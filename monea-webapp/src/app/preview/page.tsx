import React, { Suspense, startTransition, useEffect, useState } from "react";
import { WeddingData } from "@/components/templates";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { SafeBoundary } from "@/components/ui/SafeBoundary";
import { moneaClient } from "@/lib/api-client";

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

export default function PreviewPage() {
    const [wedding, setWedding] = useState<WeddingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        // Check URL params first (for template gallery preview)
        const urlParams = new URLSearchParams(window.location.search);
        const templateIdParam = urlParams.get('templateId');
        const eventTypeParam = urlParams.get('eventType');
        const isEditorMode = urlParams.get('mode') === 'editor';

        if (templateIdParam) {
            const defaultWedding: WeddingData = {
                id: "",
                groomName: "",
                brideName: "",
                date: "",
                location: null,
                templateId: templateIdParam,
                eventType: eventTypeParam === "anniversary" || eventTypeParam === "wedding"
                    ? eventTypeParam
                    : templateIdParam === "anniversary-elegant" ? "anniversary" : "wedding",
                galleryItems: [],
                activities: [],
                themeSettings: {},
            };
            moneaClient.get<{ data?: { previewData?: Partial<WeddingData> } }>(
                `/api/template-preview/${encodeURIComponent(templateIdParam)}`,
                { cache: "no-store" },
            )
                .then((response) => {
                    if (response.error) {
                        console.error("[Preview] Could not load saved template demo:", response.error);
                        setWedding(defaultWedding);
                        return;
                    }
                    const previewData = response.data?.data?.previewData;
                    if (!previewData || typeof previewData !== "object" || Array.isArray(previewData)) {
                        setWedding(defaultWedding);
                        return;
                    }
                    setWedding({
                        ...defaultWedding,
                        ...deepDecodeEntities(previewData),
                        id: "",
                        templateId: templateIdParam,
                        eventType: eventTypeParam === "anniversary" || eventTypeParam === "wedding"
                            ? eventTypeParam
                            : previewData.eventType === "anniversary" || previewData.eventType === "wedding"
                                ? previewData.eventType
                                : defaultWedding.eventType,
                        themeSettings: {
                            ...defaultWedding.themeSettings,
                            ...(previewData.themeSettings || {}),
                        },
                        galleryItems: Array.isArray(previewData.galleryItems) ? previewData.galleryItems : [],
                        activities: Array.isArray(previewData.activities) ? previewData.activities : [],
                    });
                })
                .catch((error) => {
                    console.error("[Preview] Could not load saved template demo:", error);
                    setWedding(defaultWedding);
                })
                .finally(() => setIsLoading(false));
        } else if (!isEditorMode) {
            // Dashboard preview mode - fetch user's wedding data
            moneaClient.get<any>('/api/wedding?full=true')
                .then(res => {
                    if (res.data && res.data.id) {
                        let data = deepDecodeEntities({ ...res.data });
                        if (typeof data.themeSettings === 'string' && data.themeSettings !== "") {
                            try { data.themeSettings = deepDecodeEntities(JSON.parse(data.themeSettings)); } catch (e) { data.themeSettings = {}; }
                        }
                        setWedding(data);
                    }
                })
                .catch(err => {
                    console.warn("[Preview] initial fetch error:", err);
                    setLoadError(true);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!window.parent || window.parent === window) {
            setIsLoading(false);
        }

        let readyPings = 0;
        const readyInterval = setInterval(() => {
            readyPings++;
            window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
            if (readyPings >= 3) {
                clearInterval(readyInterval);
            }
        }, 300);

        // Listen to parent postMessages
        const handleMessage = (event: MessageEvent) => {
            const expectedOrigin = window.location.origin;
            const isTrustedParent = event.source === window.parent && event.origin === expectedOrigin;

            if (!isTrustedParent) return;

            if (event.data?.type === "UPDATE_PREVIEW" && event.data.payload) {
                clearInterval(readyInterval);
                const cleanPayload = { ...event.data.payload };

                if (cleanPayload.themeSettings?.heroImage?.startsWith("/images/preview/")) {
                    cleanPayload.themeSettings.heroImage = "";
                }

                if (cleanPayload.galleryItems && Array.isArray(cleanPayload.galleryItems)) {
                    cleanPayload.galleryItems = cleanPayload.galleryItems.map((item: any) => {
                        if (item.url?.startsWith("/images/preview/")) {
                            return { ...item, url: "" };
                        }
                        return item;
                    });
                }

                setWedding(deepDecodeEntities(cleanPayload));
                setLoadError(false);
                setIsLoading(false);
            }

            if (event.data?.type === "UPDATE_PREVIEW_PARTIAL" && event.data.payload) {
                startTransition(() => {
                    setWedding(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            themeSettings: {
                                ...(prev.themeSettings || {}),
                                ...event.data.payload
                            }
                        };
                    });
                });
            }

            if (event.data?.type === "SCROLL_TO_SECTION" && event.data.payload) {
                const sectionId = event.data.payload;

                setTimeout(() => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        };

        window.addEventListener("message", handleMessage);

        // Initial ping
        window.parent.postMessage({ type: "PREVIEW_READY" }, "*");

        const editorWaitTimer = isEditorMode
            ? setTimeout(() => setIsLoading(false), 1200)
            : undefined;

        return () => {
            window.removeEventListener("message", handleMessage);
            clearInterval(readyInterval);
            if (editorWaitTimer) clearTimeout(editorWaitTimer);
        };
    }, []);

    return (
        <SafeBoundary name="Preview Template" isSilent={false}>
            <style>{`
                /* Hide scrollbar for preview to prevent off-center layout */
                ::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
            `}</style>
            <div className="relative min-h-screen w-full">
                <Suspense fallback={
                    <div className="flex min-h-[500px] items-center justify-center animate-pulse font-kantumruy text-sm text-slate-400">
                        កំពុងផ្ទុកគំរូ...
                    </div>
                }>
                    {isLoading ? (
                        <div className="flex min-h-[500px] items-center justify-center animate-pulse font-kantumruy text-sm text-slate-400">
                            កំពុងផ្ទុកគំរូ...
                        </div>
                    ) : loadError ? (
                        <div role="alert" className="flex min-h-[500px] items-center justify-center px-6 text-center font-kantumruy text-sm text-muted-foreground">
                            មិនអាចផ្ទុកទិន្នន័យ Preview បានទេ។ សូមព្យាយាមម្ដងទៀត។
                        </div>
                    ) : wedding ? (
                        <TemplateRenderer
                            wedding={wedding}
                            templateId={wedding.templateId || null}
                            guestName={new URLSearchParams(window.location.search).get("guestName") || undefined}
                            uploadedImagesOnly
                        />
                    ) : (
                        <div className="flex min-h-[500px] items-center justify-center px-6 text-center font-kantumruy text-sm text-muted-foreground">
                            មិនមានទិន្នន័យ Preview ទេ។
                        </div>
                    )}
                </Suspense>
            </div>
        </SafeBoundary>
    );
}
