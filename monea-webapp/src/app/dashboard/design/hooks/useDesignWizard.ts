import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from 'react-router-dom';
import useSWR from "swr";
import { useCloudinary } from "@/hooks/use-cloudinary";
import { useAuth } from "@/hooks/useAuth";
import type { WeddingData } from "@/components/templates/types";
import { moneaClient } from "@/lib/api-client";
import { getTemplateConfig, getTemplatesForEventType } from "@/components/templates/template-config";
import { DEFAULT_WEDDING } from "@/data/wedding";
import { createSerialTaskQueue } from "@/lib/serial-task-queue";
import { normalizeWeddingActivities } from "@/lib/wedding-activities";
import { appendUploadedPhotosToGallery, migrateWeddingPhotoSlots, swapWeddingPhotoSlots, WEDDING_PHOTO_LAYOUTS } from "@/lib/wedding-photo-layout";
import {
    DEFAULT_WEDDING_ACTIVITIES,
    getDefaultActivitiesForEventType,
    matchesDefaultActivities,
} from "@/lib/wedding-activity-defaults";

export { DEFAULT_WEDDING } from "@/data/wedding";

// --- API Fetcher ---
const fetcher = async (url: string) => {
    const response = await fetch(url, { credentials: "include" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(
            typeof data?.error === "string"
                ? data.error
                : `Failed to load wedding data (${response.status})`
        );
    }
    if (!data || typeof data !== "object") {
        throw new Error("Wedding data response was invalid");
    }
    return data;
};

const isNetworkSaveFailure = (status: number, error: string | null) =>
    status === 503 && /failed to fetch|networkerror|load failed/i.test(error || "");

// --- Constants ---
export const PRESET_COLORS = ["#8E5A5A", "#1E40AF", "#047857", "#B91C1C", "#D97706", "#4B5563", "#000000", "#D4AF37"];

export const TEMPLATE_LAYOUTS: Record<string, { slots: number, labels: string[] }> =
    Object.fromEntries(Object.entries(WEDDING_PHOTO_LAYOUTS).map(([templateId, photoLayout]) => [
        templateId,
        {
            slots: photoLayout.slots.length,
            labels: photoLayout.slots.map((slot) => slot.title),
        },
    ]));

const getEditorDefaults = (isPlatformAdmin: boolean): WeddingData => {
    if (isPlatformAdmin) return DEFAULT_WEDDING;

    return {
        ...DEFAULT_WEDDING,
        groomName: "",
        brideName: "",
        date: "",
        location: "",
        themeSettings: {
            primaryColor: "",
            heroImage: "",
            coverImageUrl: "",
            customLabels: {},
            parents: {},
        },
        galleryItems: [],
        activities: DEFAULT_WEDDING_ACTIVITIES.map((activity) => ({ ...activity })),
    };
};

export const STEPS = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 }
];

// Defensive: backend template/version save expects a valid `templateId`.
// Some older/partial wedding records can temporarily contain `templateId: null/undefined/""`
// while the UI hydrates; this would otherwise trigger a 400 "Unknown template".
const normalizeTemplateId = (value: unknown, fallback: string): string => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
};

function decodeHtmlEntities(str: any): any {
    if (typeof str !== 'string') return str;
    let decoded = str;
    for (let i = 0; i < 5; i++) {
        const next = decoded
            .replace(/&amp;/g, '&')
            .replace(/&#x2F;/g, '/')
            .replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        if (next === decoded) break;
        decoded = next;
    }
    return decoded;
}

function deepDecodeEntities(obj: any): any {
    if (!obj || typeof obj !== 'object') {
        return typeof obj === 'string' ? decodeHtmlEntities(obj) : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepDecodeEntities);
    }
    const res: any = {};
    for (const k of Object.keys(obj)) {
        res[k] = deepDecodeEntities(obj[k]);
    }
    return res;
}

function getPayloadSnapshot(data: WeddingData | null) {
    if (!data) return null;
    return JSON.stringify({
        id: data.id,
        templateId: data.templateId,
        groomName: data.groomName,
        brideName: data.brideName,
        date: data.date,
        location: data.location,
        themeSettings: data.themeSettings,
        galleryItems: data.galleryItems,
        activities: data.activities,
        eventType: data.eventType
    });
}

export function useDesignWizard() {
    // --- State Initialization ---
    const [mounted, setMounted] = useState(false);
    const [wedding, setWedding] = useState<WeddingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [photoMigrationNotice, setPhotoMigrationNotice] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // UI states
    const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [activeAccordion, setActiveAccordion] = useState<string | null>('theme');
    const { user, isLoading: authLoading } = useAuth();
    const isPlatformAdmin = user?.role === 'SUPERADMIN' || user?.role === 'PLATFORM_OWNER';

    // Versioning states
    const [templateVersions, setTemplateVersions] = useState<any[]>([]);
    const [fetchingVersions, setFetchingVersions] = useState(false);
    const [newVersionTitle, setNewVersionTitle] = useState("");
    const [isSavingVersion, setIsSavingVersion] = useState(false);
    const [rollbackConfirm, setRollbackConfirm] = useState<{ open: boolean; versionId: string }>({ open: false, versionId: "" });
    const [rollbackLoading, setRollbackLoading] = useState(false);
    const [deleteVersionConfirm, setDeleteVersionConfirm] = useState<{ open: boolean; versionId: string }>({ open: false, versionId: "" });

    // Notifications
    const [saveToast, setSaveToast] = useState<"success" | "error" | string | null>(null);
    const [versionToast, setVersionToast] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const [searchParams] = useSearchParams();
    const idFromUrl = searchParams.get('id');
    const templateIdFromUrl = searchParams.get('templateId');

    // Admin template preview mode
    const templatePreviewId = searchParams.get('templatePreview');
    const isTemplatePreviewMode = !!templatePreviewId;

    // Refs & Hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const {
        uploadFiles,
        retryFailedUploads,
        uploading: galleryUploading,
        progress: galleryProgress,
        error: galleryUploadError,
        failedFileCount: failedGalleryFileCount,
    } = useCloudinary({
        folder: wedding?.id || idFromUrl || ""
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load an existing demo for this template, or start with editable defaults.
    useEffect(() => {
        if (!isTemplatePreviewMode || !templatePreviewId) return;
        let cancelled = false;
        const templateConfig = getTemplateConfig(templatePreviewId);
        const defaultWedding: WeddingData = {
            ...getEditorDefaults(isPlatformAdmin),
            id: `template-preview-${templatePreviewId}`,
            templateId: templatePreviewId,
            eventType: templateConfig?.eventType === "anniversary" ? "anniversary" : "wedding",
            groomName: "Sample Groom",
            brideName: "Sample Bride",
        };

        isLoadedRef.current = false;
        lastSavedSnapshotRef.current = null;
        setWedding(null);
        setLoading(true);

        const loadTemplatePreview = async () => {
            let loadedWedding = defaultWedding;
            try {
                const response = await moneaClient.get<{
                    data?: { previewData?: Partial<WeddingData> };
                }>(`/api/template-preview/${encodeURIComponent(templatePreviewId)}`, { cache: "no-store" });
                if (response.error) {
                    console.error("[Template Preview] Could not load saved demo:", response.error);
                } else {
                    const previewData = response.data?.data?.previewData;
                    if (previewData && typeof previewData === "object" && !Array.isArray(previewData)) {
                        loadedWedding = {
                            ...defaultWedding,
                            ...previewData,
                            id: defaultWedding.id,
                            templateId: templatePreviewId,
                            eventType: previewData.eventType === "anniversary" || previewData.eventType === "wedding"
                                ? previewData.eventType
                                : defaultWedding.eventType,
                            themeSettings: {
                                ...(defaultWedding.themeSettings || {}),
                                ...(previewData.themeSettings || {}),
                            },
                            galleryItems: Array.isArray(previewData.galleryItems)
                                ? previewData.galleryItems
                                : defaultWedding.galleryItems,
                            activities: Array.isArray(previewData.activities)
                                ? normalizeWeddingActivities(previewData.activities)
                                : defaultWedding.activities,
                        };
                    }
                }
            } catch (error) {
                console.error("[Template Preview] Could not load saved demo:", error);
            }

            if (cancelled) return;
            setWedding(loadedWedding);
            lastSavedSnapshotRef.current = getPayloadSnapshot(loadedWedding);
            isLoadedRef.current = true;
            setLoading(false);
        };

        void loadTemplatePreview();
        return () => {
            cancelled = true;
        };
    }, [isTemplatePreviewMode, templatePreviewId, isPlatformAdmin]);

    // --- Data Fetching (SWR) ---
    // Skip SWR fetching for template preview mode
    const shouldFetch = !isTemplatePreviewMode;
    const apiUrl = shouldFetch && idFromUrl ? `/api/wedding?id=${idFromUrl}&full=true` : (shouldFetch ? "/api/wedding?full=true" : null);
    const { data: swrWedding, error: swrError, mutate } = useSWR(shouldFetch ? apiUrl : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000,
        shouldRetryOnError: false,
    });

    // Track initial load from SWR
    const isLoadedRef = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        const editorDefaults = getEditorDefaults(isPlatformAdmin);
        if (isLoadedRef.current) return;

        if (swrWedding) {
            if (swrWedding.id) {
                let data = deepDecodeEntities({ ...swrWedding });
                if (typeof data.themeSettings === 'string' && data.themeSettings !== "") {
                    try {
                        data.themeSettings = deepDecodeEntities(JSON.parse(data.themeSettings));
                    } catch (e) {
                        data.themeSettings = {};
                    }
                }
                if (data.themeSettings?.heroImage?.includes("/preview")) {
                    data.themeSettings.heroImage = "";
                }

                // If galleryItems was saved in themeSettings, use it!
                if (data.themeSettings?.galleryItems && Array.isArray(data.themeSettings.galleryItems)) {
                    data.galleryItems = data.themeSettings.galleryItems;
                } else if (data.galleryItems && Array.isArray(data.galleryItems)) {
                    const reconstructed: any[] = [];
                    data.galleryItems.forEach((item: any, idx: number) => {
                        if (item?.url?.includes("/preview")) return;
                        if (item?.caption?.startsWith("slot:")) {
                            const slotIdx = parseInt(item.caption.replace("slot:", ""), 10);
                            if (!isNaN(slotIdx)) {
                                reconstructed[slotIdx] = item;
                                return;
                            }
                        }
                        reconstructed[idx] = item;
                    });
                    data.galleryItems = reconstructed;
                }
                data.galleryItems = Array.isArray(data.galleryItems) ? data.galleryItems : [];
                if (data.themeSettings?.privateCertificate?.publicId) {
                    const hasCertificate = data.galleryItems.some((item: any) => item?.type === "CERTIFICATE");
                    if (!hasCertificate) {
                        data.galleryItems.push({
                            ...data.themeSettings.privateCertificate,
                            type: "CERTIFICATE",
                        });
                    }
                }

                const savedActivities = Array.isArray(data.activities) ? data.activities : [];
                const loadedWedding = {
                    ...editorDefaults,
                    ...data,
                    // If user came from templates gallery, override templateId
                    templateId: templateIdFromUrl || data.templateId || editorDefaults.templateId,
                    groomName: data.groomName !== undefined ? data.groomName : "",
                    brideName: data.brideName !== undefined ? data.brideName : "",
                    location: data.location !== undefined ? data.location : "",
                    themeSettings: {
                        ...(editorDefaults.themeSettings || {}),
                        ...(data.themeSettings || {})
                    },
                    galleryItems: data.galleryItems || [],
                    activities: normalizeWeddingActivities(savedActivities)
                };
                setWedding(loadedWedding);
                lastSavedSnapshotRef.current = getPayloadSnapshot({
                    ...loadedWedding,
                    activities: savedActivities,
                });
                isLoadedRef.current = true;
            } else {
                // No wedding yet — use default, apply templateId from URL if provided
                const defaultWithTemplate = templateIdFromUrl
                    ? { ...editorDefaults, templateId: templateIdFromUrl }
                    : editorDefaults;
                setWedding(defaultWithTemplate);
                lastSavedSnapshotRef.current = getPayloadSnapshot(defaultWithTemplate);
                isLoadedRef.current = true;
            }
            setLoading(false);
        } else if (swrError) {
            console.error("SWR Fetch Error:", swrError);
            setWedding(null);
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [swrWedding, swrError, authLoading, isPlatformAdmin, templateIdFromUrl]);

    // --- Progress Calculation ---
    useEffect(() => {
        if (!wedding) return;
        let p = 0;
        if (wedding.groomName?.trim() && wedding.brideName?.trim()) p += 20;
        if (wedding.date) p += 20;
        if (wedding.location?.trim()) p += 20;
        if (wedding.themeSettings?.heroImage) p += 20;
        const galleryCount = (wedding.galleryItems || []).filter((i) => i && typeof i === 'object' && typeof i.url === 'string' && i.url.trim() && !i.url.includes('cover')).length;
        if (galleryCount > 0) p += 20;
        setProgress(p);
    }, [wedding]);

    // Track latest wedding state in a ref & dirty state
    const weddingRef = useRef(wedding);
    const lastSavedSnapshotRef = useRef<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    weddingRef.current = wedding;

    // Dirty state: true when active wedding state differs from the last saved snapshot
    const isDirty = Boolean(
        wedding &&
        lastSavedSnapshotRef.current !== null &&
        getPayloadSnapshot(wedding) !== lastSavedSnapshotRef.current
    );

    // Guard against accidental tab close/refresh with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty || loading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, loading]);

    // --- Save Logic ---
    const performSaveChanges = useCallback(async (manualData?: WeddingData, options: { silent?: boolean } = {}): Promise<boolean> => {
        const { silent = false } = options;
        const data = manualData || weddingRef.current;
        if (!data) return false;

        // For template preview mode, always skip map validation
        if (!silent && !isTemplatePreviewMode && !data.themeSettings?.mapLink?.trim() && !data.mapUrl?.trim()) {
            setSaveToast("map-link-required");
            setTimeout(() => setSaveToast(null), 3000);
            return false;
        }

        const payloadSnapshot = getPayloadSnapshot(data);
        if (lastSavedSnapshotRef.current === payloadSnapshot) return true;

        // Validation (only skip if silent/auto-save, or in template preview mode)
        if (!silent && !isTemplatePreviewMode && (
            !data.eventType ||
            !data.groomName?.trim() ||
            !data.brideName?.trim() ||
            !data.date ||
            !data.location?.trim()
        )) {
            setSaveToast("error");
            setTimeout(() => setSaveToast(null), 3000);
            return false;
        }

        if (!silent) setLoading(true);
        try {
            // Template preview mode: save to template preview endpoint
            if (isTemplatePreviewMode && templatePreviewId) {
                const previewPayload = {
                    templateId: templatePreviewId,
                    groomName: data.groomName,
                    brideName: data.brideName,
                    date: data.date,
                    location: data.location,
                    themeSettings: data.themeSettings,
                    galleryItems: data.galleryItems,
                    activities: data.activities?.filter((item: any) => item.title?.trim()).map((item: any) => ({
                        title: item.title.trim(),
                        time: item.time || "",
                        description: item.description || "",
                        icon: item.icon || null,
                        publicId: item.publicId || null,
                        order: item.order || 0
                    })),
                    eventType: data.eventType
                };

                const res = await moneaClient.post<any>(`/api/admin/template-preview/${templatePreviewId}`, {
                    previewData: previewPayload,
                });

                if (res.status === 200 && res.data) {
                    lastSavedSnapshotRef.current = payloadSnapshot;
                    setLastSavedAt(new Date());
                    if (!silent) {
                        setSaveToast("success");
                        setTimeout(() => setSaveToast(null), 2000);
                    }
                    return true;
                } else {
                    throw new Error(res.error || "Failed to save template preview");
                }
            }

            // Normal wedding save
            const payload = {
                weddingId: data.id || undefined,
                templateId: data.templateId || "modern-minimal",
                groomName: data.groomName,
                brideName: data.brideName,
                date: data.date,
                location: data.location,
                themeSettings: data.themeSettings,
                galleryItems: data.galleryItems,
                activities: data.activities?.filter((item: any) => item.title?.trim()).map((item: any) => ({
                    title: item.title.trim(),
                    time: item.time || "",
                    description: item.description || "",
                    icon: item.icon || null,
                    publicId: item.publicId || null,
                    order: item.order || 0
                })),
                eventType: data.eventType
            };

            let res = await moneaClient.put<any>("/api/wedding", payload);
            for (let retry = 0; retry < 2 && isNetworkSaveFailure(res.status, res.error); retry++) {
                console.warn(`[Wedding Save] Network request failed; retrying (${retry + 1}/2).`);
                await new Promise(resolve => setTimeout(resolve, 500 * 2 ** retry));
                res = await moneaClient.put<any>("/api/wedding", payload);
            }

            if (res.status === 200 && res.data) {
                lastSavedSnapshotRef.current = payloadSnapshot;
                setLastSavedAt(new Date());

                // If the wedding was created or updated with a new ID, update it
                if (res.data.id) {
                    setWedding(prev => prev ? { ...prev, id: res.data.id } : res.data);
                }
                mutate(res.data, false);

                if (!silent) {
                    setSaveToast("success");
                    setTimeout(() => setSaveToast(null), 3000);
                }
                return true;
            } else {
                console.error("Save failed with status:", res.status, res.error, "Details:", res.details);
                
                // Extract useful error message
                let errorMsg = res.error || "error";
                
                setSaveToast(errorMsg);
                setTimeout(() => setSaveToast(null), 4000);
                return false;
            }
        } catch (error: any) {
            console.error("Save error:", error);
            setSaveToast(error?.message || "error");
            setTimeout(() => setSaveToast(null), 4000);
            return false;
        } finally {
            if (!silent) setLoading(false);
        }
    }, [isTemplatePreviewMode, templatePreviewId, mutate]);

    const saveQueueRef = useRef(createSerialTaskQueue());
    const saveChanges = useCallback((manualData?: WeddingData, options: { silent?: boolean } = {}): Promise<boolean> => {
        return saveQueueRef.current(() => performSaveChanges(manualData, options))
            .catch((error) => {
                console.error("Previous wedding save failed unexpectedly:", error);
                return false;
            });
    }, [performSaveChanges]);

    // Auto-save: Every time wedding state changes, automatically save to database after 1000ms debounce
    useEffect(() => {
        if (!mounted || !wedding) return;

        const timer = setTimeout(() => {
            saveChanges(wedding, { silent: true });
        }, 1000);

        return () => clearTimeout(timer);
    }, [wedding, mounted, saveChanges]);

    // --- Core Update Functions ---
    const deleteCloudinaryAsset = useCallback(async (publicId: string, resourceType: "image" | "video" = "image") => {
        try {
            if (publicId.startsWith("r2:")) {
                await moneaClient.post('/api/r2/delete', { publicId });
            } else {
                await moneaClient.post('/api/cloudinary/delete', { public_id: publicId, resource_type: resourceType });
            }
        } catch (error) {
            console.error("Error deleting asset:", error);
        }
    }, []);

    const updateWedding = useCallback(<K extends keyof WeddingData>(key: K, value: WeddingData[K]) => {
        setWedding((prev) => prev ? { ...prev, [key]: value } : null);
    }, []);

    const updateTheme = useCallback((keyOrValues: string | Record<string, unknown>, value?: any, autoSave = false) => {
        setWedding((prev) => {
            if (!prev) return null;
            const changes = typeof keyOrValues === "string" ? { [keyOrValues]: value } : keyOrValues;
            const changesMusicUrl = Object.prototype.hasOwnProperty.call(changes, "musicUrl");
            const musicUrlChanged = changesMusicUrl && changes.musicUrl !== prev.themeSettings?.musicUrl;
            if (musicUrlChanged && prev.themeSettings?.musicUrlPublicId) {
                deleteCloudinaryAsset(prev.themeSettings.musicUrlPublicId, "video");
            }
            const themeChanges = {
                ...changes,
                ...(musicUrlChanged && !Object.prototype.hasOwnProperty.call(changes, "musicUrlPublicId")
                    ? { musicUrlPublicId: "" }
                    : {}),
            };
            const updated = {
                ...prev,
                themeSettings: { ...(prev.themeSettings || {}), ...themeChanges }
            };
            if (autoSave) saveChanges(updated, { silent: true });
            return updated;
        });
    }, [deleteCloudinaryAsset, saveChanges]);

    const removeThemeAsset = useCallback(async (urlKey: string, publicIdKey: string, assetIndex?: number) => {
        setWedding(prev => {
            if (!prev) return null;
            const storyPublicIds = prev.themeSettings?.storyImagePublicIds || [];
            const publicIdsToDelete = urlKey === "storyImages"
                ? assetIndex !== undefined
                    ? [storyPublicIds[assetIndex] || (assetIndex === 0 ? prev.themeSettings?.storyImagePublicId : undefined)]
                    : [...storyPublicIds, prev.themeSettings?.storyImagePublicId]
                : [(prev.themeSettings as any)?.[publicIdKey]];
            for (const publicId of new Set(publicIdsToDelete.filter((id): id is string => Boolean(id)))) {
                deleteCloudinaryAsset(publicId, publicIdKey === "musicUrlPublicId" ? "video" : "image");
            }
            const storyImages = prev.themeSettings?.storyImages || [];
            const updated = {
                ...prev,
                themeSettings: {
                    ...(prev.themeSettings || {}),
                    [urlKey]: assetIndex !== undefined && urlKey === "storyImages"
                        ? storyImages.filter((_, index) => index !== assetIndex)
                        : urlKey === "storyImages" ? [] : "",
                    ...(urlKey === "storyImages" && assetIndex !== undefined
                        ? {
                            storyImageCaptions: (prev.themeSettings?.storyImageCaptions || [])
                                .filter((_, index) => index !== assetIndex),
                            storyImagePublicIds: storyPublicIds.length
                                ? storyPublicIds.filter((_, index) => index !== assetIndex)
                                : [],
                            ...(assetIndex === 0 ? { [publicIdKey]: "" } : {}),
                        }
                        : {
                            [publicIdKey]: "",
                            ...(urlKey === "storyImages" ? { storyImageCaptions: [] } : {}),
                        }),
                }
            };
            mutate(updated, false);
            saveChanges(updated, { silent: true });
            return updated;
        });
    }, [mutate, deleteCloudinaryAsset, saveChanges]);

    const updateLabel = useCallback((key: string, value: string) => {
        setWedding((prev) => !prev ? null : {
            ...prev,
            themeSettings: {
                ...(prev.themeSettings || {}),
                customLabels: { ...(prev.themeSettings?.customLabels || {}), [key]: value }
            }
        });
    }, []);

    const updateParent = useCallback((key: string, value: string) => {
        setWedding((prev) => !prev ? null : {
            ...prev,
            themeSettings: {
                ...(prev.themeSettings || {}),
                parents: { ...(prev.themeSettings?.parents || {}), [key]: value }
            }
        });
    }, []);

    const updateTemplate = useCallback((templateId: string) => {
        const migrationPreview = wedding
            ? migrateWeddingPhotoSlots(
                wedding.galleryItems,
                wedding.templateId,
                templateId,
                wedding.themeSettings?.hiddenPhotoSlots,
                wedding.themeSettings?.hiddenGalleryPhotoKeys,
            )
            : null;
        setPhotoMigrationNotice(
            migrationPreview?.movedToGalleryCount
                ? `បានរក្សារូប ${migrationPreview.movedToGalleryCount} សន្លឹកក្នុងវិចិត្រសាលបន្ថែម ព្រោះ template ថ្មីមិនមានផ្នែកដូចគ្នា។`
                : null,
        );
        setWedding((prev) => {
            if (!prev) return null;
            const config = getTemplateConfig(templateId);
            const photoMigration = migrateWeddingPhotoSlots(
                prev.galleryItems,
                prev.templateId,
                templateId,
                prev.themeSettings?.hiddenPhotoSlots,
                prev.themeSettings?.hiddenGalleryPhotoKeys,
            );
            return {
                ...prev,
                templateId,
                galleryItems: photoMigration.galleryItems,
                themeSettings: {
                    ...(prev.themeSettings || {}),
                    hiddenPhotoSlots: photoMigration.hiddenPhotoSlots,
                    hiddenGalleryPhotoKeys: photoMigration.hiddenGalleryPhotoKeys,
                    ...(config?.primaryColor ? { primaryColor: config.primaryColor } : {}),
                },
            };
        });
    }, [wedding]);

    const updateEventType = useCallback((type: 'wedding' | 'anniversary', allowedTemplateIds?: readonly string[]) => {
        setWedding((prev) => {
            if (!prev) return null;

            const normalizedType = type === 'anniversary' ? 'anniversary' : 'wedding';
            const previousType = prev.eventType === "anniversary" ? "anniversary" : "wedding";
            const previousDefaults = getDefaultActivitiesForEventType(previousType);
            const shouldUpdateDefaultActivities = prev.eventType === undefined
                ? matchesDefaultActivities(prev.activities, DEFAULT_WEDDING_ACTIVITIES)
                : matchesDefaultActivities(prev.activities, previousDefaults);
            const activities = shouldUpdateDefaultActivities
                ? getDefaultActivitiesForEventType(normalizedType).map((activity) => ({ ...activity }))
                : prev.activities;
            const allowedTemplates = allowedTemplateIds
                ? [...allowedTemplateIds]
                : getTemplatesForEventType(normalizedType).map((template) => template.id);

            const currentTemplate = prev.templateId;
            const isCurrentTemplateAllowed = !!currentTemplate && allowedTemplates.includes(currentTemplate);
            const nextTemplate = isCurrentTemplateAllowed ? currentTemplate : (allowedTemplates[0] || currentTemplate);
            if (!nextTemplate) {
                return { ...prev, eventType: normalizedType, activities };
            }

            const config = getTemplateConfig(nextTemplate);
            const photoMigration = migrateWeddingPhotoSlots(
                prev.galleryItems,
                currentTemplate,
                nextTemplate,
                prev.themeSettings?.hiddenPhotoSlots,
                prev.themeSettings?.hiddenGalleryPhotoKeys,
            );
            return {
                ...prev,
                eventType: normalizedType,
                templateId: nextTemplate,
                galleryItems: photoMigration.galleryItems,
                activities,
                themeSettings: {
                    ...(prev.themeSettings || {}),
                    hiddenPhotoSlots: photoMigration.hiddenPhotoSlots,
                    hiddenGalleryPhotoKeys: photoMigration.hiddenGalleryPhotoKeys,
                    ...(config?.primaryColor ? { primaryColor: config.primaryColor } : {}),
                },
            };
        });
    }, []);

    // --- Iframe Sync ---
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "SYNC_IMAGE_POSITION" && event.data.payload) {
                const { field, value } = event.data.payload;
                updateTheme(field as any, value);
            } else if (event.data?.type === "SYNC_IMAGE_POSITION_2D" && event.data.payload) {
                const { fieldX, valueX, fieldY, valueY } = event.data.payload;
                setWedding((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        themeSettings: { ...(prev.themeSettings || {}), [fieldX]: valueX, [fieldY]: valueY }
                    };
                });
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [updateTheme]);

    // --- Gallery Handlers ---
    const addGalleryItem = useCallback(async (url: string, publicId?: string, index?: number, type: string = "IMAGE") => {
        const currentWedding = weddingRef.current;
        if (!currentWedding) return false;

        const newItems = [...(currentWedding.galleryItems || [])];
        const newTheme = { ...(currentWedding.themeSettings || {}) };

        if (typeof index === 'number') {
            while (newItems.length <= index) newItems.push({ url: "", type: "IMAGE" });
            newItems[index] = { url, publicId, type };
            newTheme.hiddenPhotoSlots = (newTheme.hiddenPhotoSlots || []).filter((slot) => slot !== index);
            if (index === 0) {
                newTheme.heroImage = url;
                newTheme.coverImageUrl = url;
                if (publicId) newTheme.heroImagePublicId = publicId;
            }
        } else {
            newItems.push({ url, publicId, type });
            if (newItems.length === 1) {
                newTheme.heroImage = url;
                newTheme.coverImageUrl = url;
                if (publicId) newTheme.heroImagePublicId = publicId;
            }
        }

        const updated = { ...currentWedding, galleryItems: newItems, themeSettings: newTheme };
        setWedding(updated);
        mutate(updated, false);
        const saved = await saveChanges(updated, { silent: true });
        return saved;
    }, [mutate, saveChanges]);

    const removeGalleryItem = useCallback((index: number) => {
        setWedding((prev) => {
            if (!prev || !prev.templateId) return prev;
            const layout = TEMPLATE_LAYOUTS[prev.templateId];
            const itemToDelete = prev.galleryItems[index];
            const newTheme = { ...(prev.themeSettings || {}) };
            if (index < layout.slots) {
                newTheme.hiddenPhotoSlots = (newTheme.hiddenPhotoSlots || []).filter((slot) => slot !== index);
            } else {
                const photoKey = itemToDelete?.publicId || itemToDelete?.url;
                if (photoKey) {
                    newTheme.hiddenGalleryPhotoKeys = (newTheme.hiddenGalleryPhotoKeys || []).filter((key) => key !== photoKey);
                }
            }
            if (index === 0) {
                newTheme.heroImage = "";
                newTheme.coverImageUrl = "";
                newTheme.heroImagePublicId = "";
            }
            const updated = {
                ...prev,
                galleryItems: index < layout.slots 
                    ? prev.galleryItems.map((item, i) => i === index ? { ...item, url: "", publicId: undefined } : item) 
                    : prev.galleryItems.filter((_, i) => i !== index),
                themeSettings: newTheme
            };
            mutate(updated, false);
            saveChanges(updated, { silent: true });
            return updated;
        });
    }, [mutate, saveChanges]);

    const moveGalleryPhoto = useCallback(async (fromIndex: number, toIndex: number) => {
        const currentWedding = weddingRef.current;
        if (!currentWedding) return false;

        const galleryItems = swapWeddingPhotoSlots(
            currentWedding.galleryItems || [],
            fromIndex,
            toIndex,
            currentWedding.templateId,
        );
        if (!galleryItems) return false;

        const coverPhoto = galleryItems[0];
        const themeSettings = {
            ...(currentWedding.themeSettings || {}),
            heroImage: coverPhoto?.url || "",
            coverImageUrl: coverPhoto?.url || "",
            heroImagePublicId: coverPhoto?.publicId || "",
        };
        const updated = { ...currentWedding, galleryItems, themeSettings };
        setWedding(updated);
        mutate(updated, false);
        return saveChanges(updated, { silent: true });
    }, [mutate, saveChanges]);

    const persistUploadedPhotos = useCallback(async (uploadedItems: { url: string; publicId: string; type?: string }[]) => {
        if (uploadedItems.length === 0) return false;
        const currentWedding = weddingRef.current;
        if (!currentWedding) return false;

        const uploadedPhotos = uploadedItems.filter((item) => item.type?.toUpperCase() !== "VIDEO");
        if (uploadedPhotos.length === 0) return false;
        const galleryItems = appendUploadedPhotosToGallery(
            currentWedding.galleryItems || [],
            uploadedPhotos.map((item) => ({
                url: item.url,
                publicId: item.publicId,
                type: "IMAGE",
            })),
            currentWedding.templateId,
        );
        if (galleryItems.length === currentWedding.galleryItems.length) return false;
        const coverPhoto = galleryItems[0];
        const themeSettings = coverPhoto?.url
            ? {
                ...(currentWedding.themeSettings || {}),
                heroImage: coverPhoto.url,
                coverImageUrl: coverPhoto.url,
                ...(coverPhoto.publicId ? { heroImagePublicId: coverPhoto.publicId } : {}),
            }
            : currentWedding.themeSettings;
        const updated = { ...currentWedding, galleryItems, themeSettings };
        setWedding(updated);
        mutate(updated, false);
        return saveChanges(updated, { silent: true });
    }, [mutate, saveChanges]);

    const handleGalleryDirectUpload = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const uploadedItems = await uploadFiles(fileArray);
        return persistUploadedPhotos(uploadedItems);
    };

    const retryGalleryDirectUpload = async () => {
        const uploadedItems = await retryFailedUploads();
        return uploadedItems ? persistUploadedPhotos(uploadedItems) : false;
    };

    // --- Versional Handlers ---
    const fetchVersions = useCallback(async () => {
        if (!wedding?.id) return;
        setFetchingVersions(true);
        try {
            const res = await fetch(`/api/templates/versions?weddingId=${wedding.id}`);
            if (res.ok) setTemplateVersions(await res.json());
        } catch (error) {
            console.error("Fetch versions error:", error);
        } finally {
            setFetchingVersions(false);
        }
    }, [wedding?.id, wedding?.templateId, newVersionTitle]);

    const handleSaveVersion = useCallback(async () => {
        if (!wedding?.id || !newVersionTitle) return;
        setIsSavingVersion(true);
        try {
            const res = await fetch("/api/templates/versions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weddingId: wedding.id,
                    versionName: newVersionTitle,
                    description: "Saved from editor",
                    // Backend validates templateId against known templates.
                    // During hydration some weddings may temporarily have an empty templateId.
                    templateId: normalizeTemplateId(wedding?.templateId, DEFAULT_WEDDING.templateId ?? "blossom-romance"),
                }),
            });

            if (res.ok) {
                const newVer = await res.json();
                setTemplateVersions(prev => [newVer, ...prev]);
                setNewVersionTitle("");
                setVersionToast(true);
                setTimeout(() => setVersionToast(false), 3000);
            }
        } catch (error) {
            console.error("Save version error:", error);
        } finally {
            setIsSavingVersion(false);
        }
    }, [wedding?.id, wedding?.templateId, newVersionTitle]);

    const handleRollback = useCallback(async (versionId: string) => {
        setRollbackConfirm({ open: true, versionId });
    }, []);

    const confirmRollback = async () => {
        setRollbackLoading(true);
        try {
            const res = await fetch("/api/templates/versions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: rollbackConfirm.versionId })
            });
            if (res.ok) {
                const result = await res.json();
                setWedding(prev => {
                    if (!prev) return null;
                    let themeSettings = result.themeSettings;
                    if (typeof themeSettings === 'string') {
                        try { themeSettings = JSON.parse(themeSettings); } catch (e) { themeSettings = {}; }
                    }
                    if (!themeSettings || typeof themeSettings !== "object") themeSettings = {};
                    const photoMigration = migrateWeddingPhotoSlots(
                        prev.galleryItems,
                        prev.templateId,
                        result.templateId,
                        themeSettings.hiddenPhotoSlots ?? prev.themeSettings?.hiddenPhotoSlots,
                        themeSettings.hiddenGalleryPhotoKeys ?? prev.themeSettings?.hiddenGalleryPhotoKeys,
                    );
                    return {
                        ...prev,
                        templateId: result.templateId,
                        galleryItems: photoMigration.galleryItems,
                        themeSettings: {
                            ...themeSettings,
                            hiddenPhotoSlots: photoMigration.hiddenPhotoSlots,
                            hiddenGalleryPhotoKeys: photoMigration.hiddenGalleryPhotoKeys,
                        },
                    };
                });
                setRollbackConfirm({ open: false, versionId: "" });
            }
        } catch (error) {
            console.error("Rollback error:", error);
        } finally {
            setRollbackLoading(false);
        }
    };

    const handleDeleteVersion = useCallback(async (versionId: string) => {
        setDeleteVersionConfirm({ open: true, versionId });
    }, []);

    const confirmDeleteVersion = async () => {
        try {
            const res = await moneaClient.delete(`/api/templates/versions?id=${deleteVersionConfirm.versionId}`);
            if (!res.error) {
                setTemplateVersions((prev: any[]) => prev.filter((v: any) => v.id !== deleteVersionConfirm.versionId));
                setDeleteVersionConfirm({ open: false, versionId: "" });
            }
        } catch (error) {
            console.error("Delete version error:", error);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return {
        mounted, wedding, setWedding, loading, currentStep, setCurrentStep, progress,
        photoMigrationNotice, dismissPhotoMigrationNotice: () => setPhotoMigrationNotice(null),
        mobileTab, setMobileTab, previewMode, setPreviewMode,
        activeAccordion, setActiveAccordion,
        templateVersions, fetchingVersions, newVersionTitle, setNewVersionTitle,
        isSavingVersion, rollbackConfirm, setRollbackConfirm, rollbackLoading,
        deleteVersionConfirm, setDeleteVersionConfirm, saveToast, versionToast,
        iframeRef, galleryUploading, galleryProgress, galleryUploadError, failedGalleryFileCount, retryGalleryUpload: retryGalleryDirectUpload,
        loadError: swrError,
        retryLoad: () => mutate(),
        updateWedding, updateTheme, removeThemeAsset, updateLabel, updateParent,
        updateTemplate, updateEventType, addGalleryItem, removeGalleryItem,
        handleGalleryDirectUpload, moveGalleryPhoto, saveChanges, fetchVersions, handleSaveVersion,
        handleRollback, confirmRollback, handleDeleteVersion, confirmDeleteVersion,
        nextStep, prevStep, isDirty, lastSavedAt, isTemplatePreviewMode
    };
}
