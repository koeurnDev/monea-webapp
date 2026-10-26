import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
// next/image replaced with <img>;
import { ArrowLeft, Palette, Percent, Eye, Sparkles, CreditCard, Loader2, CircleCheck, AlertCircle, Upload, X, Coffee } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SafeQRCode from "@/components/ui/SafeQRCode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { WeddingData } from '@/components/templates/types';
import {
    getTemplatesForEventType,
    TEMPLATE_DEFINITIONS,
    normalizeTemplateAvailability,
    normalizeTemplatePresentationMetadata,
    type TemplatePresentationMetadata,
} from '@/components/templates/template-config';
import { moneaClient } from '@/lib/api-client';
import { uploadFileToR2 } from '@/lib/r2-upload';

interface TemplatePricingInfo {
    [templateId: string]: {
        name: string;
        price: number;
        currency: 'USD' | 'KHR';
        isFree?: boolean;
        originalPrice?: number; // តម្លៃដើម
        onSale?: boolean; // មានបញ្ចុះតម្លៃ
    };
}

interface TemplatePricingEntryResponse {
    name?: string;
    price?: number | string;
    amount?: number | string;
    currency?: 'USD' | 'KHR';
    isFree?: boolean;
    originalPrice?: number | string;
    originalAmount?: number | string;
    onSale?: boolean;
}

interface TemplatePricingResponse {
    data: Record<string, TemplatePricingEntryResponse>;
}

interface TemplateLicenseStatus {
    hasLicense: boolean;
    status?: string;
    receiptReviewStatus?: string | null;
    source?: "user" | "wedding";
}

interface TemplatePurchaseSession {
    success: boolean;
    templateId: string;
    templateName: string;
    amount: number;
    currency: 'USD' | 'KHR';
    orderId: string;
    licenseId: string;
    requiresPayment: boolean;
    qrCode: string | null;
    md5: string | null;
    expiresAt: number | null;
    resumed?: boolean;
}

interface Step1TemplateProps {
    wedding: WeddingData;
    updateEventType: (type: 'wedding' | 'anniversary', allowedTemplateIds?: readonly string[]) => void;
    updateTemplate: (templateId: string) => void;
    packageType?: string | null;
    weddingId?: string;
}

const Step1Template: React.FC<Step1TemplateProps> = ({ wedding, updateEventType, updateTemplate, packageType, weddingId }) => {
    const { t } = useTranslation();
    const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);
    const [metadata, setMetadata] = useState<Record<string, TemplatePresentationMetadata> | null>(null);
    const [pricing, setPricing] = useState<TemplatePricingInfo | null>(null);
    const [licenses, setLicenses] = useState<Record<string, TemplateLicenseStatus>>({});
    const [availabilityError, setAvailabilityError] = useState(false);
    const [pricingError, setPricingError] = useState(false);
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [loadingLicenses, setLoadingLicenses] = useState(false);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [supportQrOpen, setSupportQrOpen] = useState(false);
    const [supportQr, setSupportQr] = useState<string | null>(null);
    const [supportQrError, setSupportQrError] = useState('');
    const [isLoadingSupportQr, setIsLoadingSupportQr] = useState(false);
    const [purchaseConfirmationTemplateId, setPurchaseConfirmationTemplateId] = useState<string | null>(null);
    const [purchaseTemplateId, setPurchaseTemplateId] = useState<string | null>(null);
    const [purchaseSession, setPurchaseSession] = useState<TemplatePurchaseSession | null>(null);
    const [purchaseTimeRemaining, setPurchaseTimeRemaining] = useState(0);
    const [purchaseTab, setPurchaseTab] = useState<'qr' | 'confirm'>('qr');
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseStatusMessage, setPurchaseStatusMessage] = useState('');
    const [isInitiatingPurchase, setIsInitiatingPurchase] = useState(false);
    const [isVerifyingPurchase, setIsVerifyingPurchase] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [receiptNote, setReceiptNote] = useState('');
    const [receiptError, setReceiptError] = useState('');
    const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

    useEffect(() => {
        const expiresAt = purchaseSession?.expiresAt;
        if (!expiresAt) {
            setPurchaseTimeRemaining(0);
            return;
        }

        const updateRemaining = () => {
            setPurchaseTimeRemaining(Math.max(0, expiresAt - Date.now()));
        };
        updateRemaining();
        const intervalId = window.setInterval(updateRemaining, 1000);
        return () => window.clearInterval(intervalId);
    }, [purchaseSession?.expiresAt]);

    const activeEventType: 'wedding' | 'anniversary' = wedding.eventType === 'anniversary' ? 'anniversary' : 'wedding';
    const hasSelectedEventType = wedding.eventType === 'wedding' || wedding.eventType === 'anniversary';

    const loadAvailability = useCallback(async () => {
        setLoadingAvailability(true);
        setAvailabilityError(false);
        try {
            const [availabilityResponse, metadataResponse, pricingResponse] = await Promise.all([
                moneaClient.get<Record<string, boolean>>("/api/templates/availability", { cache: "no-store" }),
                moneaClient.get<Record<string, TemplatePresentationMetadata>>("/api/templates/metadata", { cache: "no-store" }),
                moneaClient.get<TemplatePricingResponse>("/api/template-pricing", { cache: "no-store" }),
            ]);
            if (availabilityResponse.error || !availabilityResponse.data || metadataResponse.error || !metadataResponse.data) {
                throw new Error(availabilityResponse.error || metadataResponse.error || "Template configuration response was invalid");
            }
            setAvailability(normalizeTemplateAvailability(availabilityResponse.data));
            setMetadata(normalizeTemplatePresentationMetadata(metadataResponse.data));
            const rawPricing = pricingResponse.data?.data;
            const loadedPricing = rawPricing && typeof rawPricing === "object"
                ? Object.entries(rawPricing).reduce<TemplatePricingInfo>((normalized, [templateId, entry]) => {
                        const price = Number(entry.price ?? entry.amount);
                        if (!Number.isFinite(price) || price < 0) return normalized;
                        const originalPriceValue = entry.originalPrice ?? entry.originalAmount;
                        const parsedOriginalPrice = originalPriceValue === undefined
                            ? undefined
                            : Number(originalPriceValue);
                        const originalPrice = parsedOriginalPrice !== undefined
                            && Number.isFinite(parsedOriginalPrice)
                            && parsedOriginalPrice >= 0
                            ? parsedOriginalPrice
                            : undefined;
                        normalized[templateId] = {
                            name: entry.name || templateId,
                            price,
                            currency: "USD",
                            isFree: typeof entry.isFree === "boolean" ? entry.isFree : price === 0,
                            ...(originalPrice !== undefined ? { originalPrice } : {}),
                            onSale: typeof entry.onSale === "boolean"
                                ? entry.onSale
                                : originalPrice !== undefined && originalPrice > price,
                        };
                        return normalized;
                    }, {})
                : null;
            if (!pricingResponse.error && loadedPricing && Object.keys(loadedPricing).length > 0) {
                setPricing(loadedPricing);
                setPricingError(false);
            } else {
                console.error("[Step1Template] Failed to load template pricing:", pricingResponse.error || "Pricing response was invalid");
                setPricingError(true);
            }
        } catch (error) {
            console.error("[Step1Template] Failed to load template availability:", error);
            setAvailabilityError(true);
        } finally {
            setLoadingAvailability(false);
        }
    }, []);

    const loadTemplateLicenses = useCallback(async () => {
        setLoadingLicenses(true);
        try {
            const userAccessResponse = await moneaClient.get<any>(
                "/api/template-purchase/user-licenses",
                { cache: "no-store" }
            );
            if (userAccessResponse.error || !userAccessResponse.data?.licenses) {
                throw new Error(userAccessResponse.error || "User template access response was invalid");
            }

            const licensesMap: Record<string, TemplateLicenseStatus> = {};
            userAccessResponse.data.licenses.forEach((license: any) => {
                licensesMap[license.templateId] = {
                    hasLicense: license.status === 'ACTIVE',
                    status: license.status,
                    receiptReviewStatus: null,
                    source: "user",
                };
            });

            if (weddingId) {
                const response = await moneaClient.get<any>(
                    `/api/template-purchase/list/${weddingId}`,
                    { cache: "no-store" }
                );
                if (response.error || !response.data?.licenses) {
                    throw new Error(response.error || "Wedding template license response was invalid");
                }
                response.data.licenses.forEach((license: any) => {
                    const hasUserAccess = licensesMap[license.templateId]?.hasLicense;
                    licensesMap[license.templateId] = {
                        hasLicense: hasUserAccess || license.status === 'ACTIVE',
                        status: hasUserAccess ? 'ACTIVE' : license.status,
                        receiptReviewStatus: hasUserAccess ? null : license.receiptReviewStatus || null,
                        source: hasUserAccess ? "user" : "wedding",
                    };
                });
            }
            setLicenses(licensesMap);
        } catch (error) {
            console.error("[Step1Template] Failed to load template licenses:", error);
        } finally {
            setLoadingLicenses(false);
        }
    }, [weddingId]);

    useEffect(() => {
        void loadAvailability();
    }, [loadAvailability]);

    useEffect(() => {
        void loadTemplateLicenses();
    }, [loadTemplateLicenses]);

    const enabledTemplateIds = availability
        ? new Set(Object.entries(availability)
            .filter(([id, enabled]) => enabled)
            .map(([id]) => id))
        : new Set<string>();

    const applyEventTypeChange = (normalizedType: 'wedding' | 'anniversary') => {
        const allowedTemplates = getTemplatesForEventType(
            normalizedType,
            availability ? enabledTemplateIds : undefined,
        )
            .filter((template) => {
                const eventType = metadata?.[template.id]?.eventType ?? template.eventType;
                return eventType === normalizedType || eventType === "both";
            })
            .map((template) => template.id);
        if (!allowedTemplates.length) return;

        const currentTemplate = wedding.templateId;
        const isCurrentTemplateAllowed = !!currentTemplate && allowedTemplates.includes(currentTemplate);
        const nextTemplate = isCurrentTemplateAllowed ? currentTemplate : allowedTemplates[0];

        updateEventType(normalizedType, allowedTemplates);
        if (nextTemplate && nextTemplate !== currentTemplate) {
            updateTemplate(nextTemplate);
        }
    };

    const handleSwitchEventType = (type: 'wedding' | 'anniversary') => {
        const normalizedType = type === 'anniversary' ? 'anniversary' : 'wedding';
        applyEventTypeChange(normalizedType);
    };

    const visibleTemplates = availability && metadata
        ? getTemplatesForEventType(activeEventType, enabledTemplateIds)
            .filter((template) => metadata[template.id].eventType === activeEventType || metadata[template.id].eventType === "both")
            .map((template) => ({ ...template, ...metadata[template.id] }))
        : [];
    const previewTemplate = previewTemplateId
        ? visibleTemplates.find((template) => template.id === previewTemplateId)
        : undefined;
    const selectedUnavailableTemplate = wedding.templateId
        ? TEMPLATE_DEFINITIONS[wedding.templateId as keyof typeof TEMPLATE_DEFINITIONS]
        : undefined;
    const selectedTemplateMetadata = wedding.templateId ? metadata?.[wedding.templateId] : undefined;
    if (
        availability && metadata &&
        wedding.templateId &&
        selectedUnavailableTemplate &&
        selectedTemplateMetadata
    ) {
        if (!visibleTemplates.some((template) => template.id === selectedUnavailableTemplate.id)) {
            visibleTemplates.push({ ...selectedUnavailableTemplate, ...selectedTemplateMetadata });
        }
    }

    const beginTemplatePurchase = (tmpl: { id: string; title: string }) => {
        setPurchaseConfirmationTemplateId(tmpl.id);
    };

    const initiateTemplatePurchase = async (tmpl: { id: string; title: string }) => {
        setPurchaseTemplateId(tmpl.id);
        setPurchaseSession(null);
        setPurchaseError('');
        setPurchaseStatusMessage('');
        setPurchaseTab('qr');
        setReceiptFile(null);
        setReceiptPreview(null);
        setReceiptNote('');
        setReceiptError('');
        setIsInitiatingPurchase(true);

        try {
            const response = await moneaClient.post<TemplatePurchaseSession>(
                "/api/template-purchase/initiate",
                { templateId: tmpl.id, currency: "USD" },
            );
            if (response.error || !response.data?.success || !response.data.qrCode || !response.data.md5) {
                throw new Error(response.error || "មិនអាចបង្កើត QR ទូទាត់បានទេ។ សូមព្យាយាមម្តងទៀត។");
            }
            setPurchaseSession(response.data);
        } catch (error) {
            console.error("[Step1Template] Failed to initiate template purchase:", error);
            setPurchaseError(error instanceof Error ? error.message : "មិនអាចចាប់ផ្តើមការទូទាត់បានទេ។");
        } finally {
            setIsInitiatingPurchase(false);
        }
    };

    const confirmTemplatePurchase = () => {
        const template = visibleTemplates.find((item) => item.id === purchaseConfirmationTemplateId);
        setPurchaseConfirmationTemplateId(null);
        if (template) {
            void initiateTemplatePurchase(template);
        }
    };

    const openSupportQr = async () => {
        setSupportQrOpen(true);
        setSupportQr(null);
        setSupportQrError('');
        setIsLoadingSupportQr(true);
        try {
            const response = await moneaClient.post<{ qrCode?: string }>("/api/payment/support-qr", {});
            if (response.error || !response.data?.qrCode) {
                throw new Error(response.error || "មិនអាចបង្កើត QR គាំទ្របានទេ។");
            }
            setSupportQr(response.data.qrCode);
        } catch (error) {
            console.error("[Step1Template] Failed to create voluntary support QR:", error);
            setSupportQrError(error instanceof Error ? error.message : "មិនអាចបង្កើត QR គាំទ្របានទេ។");
        } finally {
            setIsLoadingSupportQr(false);
        }
    };

    const handleSelectTemplate = (tmpl: { id: string; title: string }) => {
        if (wedding.eventType !== activeEventType) {
            updateEventType(activeEventType, visibleTemplates.map((template) => template.id));
        }
        if (canUseTemplate(tmpl.id)) {
            updateTemplate(tmpl.id);
        } else {
            void beginTemplatePurchase(tmpl);
        }
    };

    const verifyTemplatePurchase = async () => {
        if (!purchaseSession?.orderId || !purchaseSession.md5) return;
        setIsVerifyingPurchase(true);
        setPurchaseError('');
        setPurchaseStatusMessage('');

        try {
            const response = await moneaClient.post<{
                success?: boolean;
                status?: string;
                message?: string;
            }>(`/api/template-purchase/verify/${encodeURIComponent(purchaseSession.orderId)}`, {
                md5: purchaseSession.md5,
            });

            if (response.error) {
                throw new Error(response.error);
            }
            if (response.data?.status === "ACTIVE" || response.data?.success) {
                setLicenses((current) => ({
                    ...current,
                    [purchaseSession.templateId]: { hasLicense: true, status: "ACTIVE" },
                }));
                updateTemplate(purchaseSession.templateId);
                setPurchaseTemplateId(null);
                return;
            }
            setPurchaseStatusMessage(
                response.data?.message || "មិនទាន់ឃើញការទូទាត់ទេ។ សូមសាកល្បងបញ្ជាក់ម្តងទៀតបន្ទាប់ពីស្កេន QR។",
            );
        } catch (error) {
            console.error("[Step1Template] Failed to verify template payment:", error);
            setPurchaseError(error instanceof Error ? error.message : "មិនអាចផ្ទៀងផ្ទាត់ការទូទាត់បានទេ។");
        } finally {
            setIsVerifyingPurchase(false);
        }
    };

    const handleReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0] ?? null;
        input.value = '';
        setReceiptError('');

        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
            setReceiptFile(null);
            setReceiptPreview(null);
            setReceiptError('សូមជ្រើសរើសរូប JPG, PNG ឬ WebP។');
            return;
        }
        if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
            setReceiptFile(null);
            setReceiptPreview(null);
            setReceiptError('រូបបង្កាន់ដៃត្រូវតូចជាង 10 MB។');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                setReceiptFile(null);
                setReceiptPreview(null);
                setReceiptError('មិនអាចអានរូបនេះបានទេ។ សូមជ្រើសរើសរូបផ្សេង។');
                return;
            }
            setReceiptFile(file);
            setReceiptPreview(reader.result);
        };
        reader.onerror = () => {
            setReceiptFile(null);
            setReceiptPreview(null);
            setReceiptError('មិនអាចអានរូបនេះបានទេ។ សូមជ្រើសរើសរូបផ្សេង។');
        };
        reader.readAsDataURL(file);
    };

    const submitTemplateReceipt = async () => {
        if (!purchaseSession || !receiptFile) {
            setReceiptError('សូមជ្រើសរើសរូបបង្កាន់ដៃបន្ទាប់ពីបង់ប្រាក់។');
            return;
        }
        if (!weddingId) {
            setReceiptError('ប្រព័ន្ធមិនអាចភ្ជាប់កម្មវិធីមង្គលការរបស់អ្នកទៅបង្កាន់ដៃបានទេ។ សូម refresh ទំព័រ ហើយសាកផ្ញើម្ដងទៀត។ បើនៅតែមិនបាន សូមទាក់ទង Support—អ្នកមិនចាំបាច់បញ្ចូល Wedding ID ដោយខ្លួនឯងទេ។');
            return;
        }

        setIsSubmittingReceipt(true);
        setReceiptError('');
        try {
            const uploaded = await uploadFileToR2(receiptFile, weddingId);
            const response = await moneaClient.post<{ success?: boolean; status?: string }>(
                `/api/template-purchase/submit-slip/${encodeURIComponent(purchaseSession.orderId)}`,
                {
                    receiptUrl: uploaded.url,
                    note: receiptNote.trim(),
                },
            );
            if (response.error || !response.data?.success) {
                throw new Error(response.error || 'មិនអាចផ្ញើបង្កាន់ដៃបានទេ។');
            }

            setLicenses((current) => ({
                ...current,
                [purchaseSession.templateId]: {
                    ...current[purchaseSession.templateId],
                    hasLicense: false,
                    status: 'INACTIVE',
                    receiptReviewStatus: 'PENDING',
                },
            }));
            setPurchaseStatusMessage('បានផ្ញើបង្កាន់ដៃទៅ Admin រួចរាល់។ សូមរង់ចាំការផ្ទៀងផ្ទាត់។');
            setPurchaseTab('confirm');
            setReceiptFile(null);
            setReceiptPreview(null);
            setReceiptNote('');
        } catch (error) {
            console.error('[Step1Template] Failed to submit template receipt:', error);
            setReceiptError(error instanceof Error ? error.message : 'មិនអាចផ្ញើបង្កាន់ដៃបានទេ។');
        } finally {
            setIsSubmittingReceipt(false);
        }
    };

    const formatPrice = (amount: number): string => {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount)) return '—';
        const formattedAmount = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
        }).format(numericAmount);
        return `$${formattedAmount}`;
    };

    const canUseTemplate = (templateId: string): boolean => {
        const templatePricing = pricing?.[templateId];
        const userHasLicense = licenses[templateId]?.hasLicense;
        const isFree = templatePricing?.isFree || templatePricing?.price === 0;
        return isFree || userHasLicense || false;
    };

    return (
        <div className="space-y-3 sm:space-y-6 md:space-y-8">
            <div className="bg-card p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 hidden p-3 opacity-10 transition-opacity group-hover:opacity-20 sm:block sm:p-4">
                    <Palette className="w-9 h-9 sm:w-12 sm:h-12 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-foreground font-kantumruy mb-0 sm:mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="sm:hidden">ជ្រើសរើសគំរូ</span>
                    <span className="hidden sm:inline">{t("wizard.steps.1.header")}</span>
                </h3>
                <p className="hidden text-xs font-medium leading-relaxed text-muted-foreground sm:block sm:text-[13px]">
                    {t("wizard.steps.1.description")}
                </p>
            </div>

            <div className="bg-muted p-1 rounded-2xl grid grid-cols-2 gap-1 relative">
                <button
                    type="button"
                    aria-pressed={activeEventType === 'wedding'}
                    onClick={() => handleSwitchEventType('wedding')}
                    className={clsx(
                        "relative min-h-[46px] touch-manipulation select-none px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 font-kantumruy font-black text-xs sm:text-xs md:text-sm tracking-wide active:scale-[0.98] pointer-events-auto",
                        activeEventType === 'wedding'
                            ? "bg-card text-foreground shadow-sm translate-y-[-1px]"
                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    )}
                >
                    {t("wizard.steps.1.wedding")}
                </button>
                <button
                    type="button"
                    aria-pressed={activeEventType === 'anniversary'}
                    onClick={() => handleSwitchEventType('anniversary')}
                    className={clsx(
                        "relative min-h-[46px] touch-manipulation select-none px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 font-kantumruy font-black text-xs sm:text-xs md:text-sm tracking-wide active:scale-[0.98] pointer-events-auto",
                        activeEventType === 'anniversary'
                            ? "bg-card text-foreground shadow-sm translate-y-[-1px]"
                            : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    )}
                >
                    {t("wizard.steps.1.anniversary")}
                </button>
            </div>

            {!hasSelectedEventType && (
                <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700 font-kantumruy dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    សូមជ្រើសរើសប្រភេទកម្មវិធីមួយ ដើម្បីបន្ត
                </p>
            )}
            {availabilityError && (
                <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-center text-xs font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    <p>មិនអាចផ្ទុកបញ្ជី template បានទេ។ សូមព្យាយាមម្តងទៀត។</p>
                    <button type="button" onClick={() => void loadAvailability()} className="mt-2 underline">
                        ព្យាយាមម្តងទៀត
                    </button>
                </div>
            )}
            {(loadingAvailability || loadingLicenses) && (
                <p role="status" className="text-center text-xs text-muted-foreground">
                    កំពុងផ្ទុក template...
                </p>
            )}
            <p className="hidden text-center text-xs leading-relaxed text-muted-foreground font-kantumruy sm:block">
                ប្រភេទកម្មវិធីកំណត់គំរូដែលអាចជ្រើសរើសបាន។ ការប្តូរប្រភេទនឹងប្តូរគំរូ ប្រសិនបើគំរូបច្ចុប្បន្នមិនត្រូវគ្នា។
            </p>

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <Label className="text-xs sm:text-sm font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">
                        {t("wizard.steps.1.popularTemplates", { defaultValue: "Templates" })}
                    </Label>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {visibleTemplates.map((tmpl) => {
                        const isSelected = wedding.templateId === tmpl.id || (!wedding.templateId && tmpl.id === 'modern-minimal');
                        const isWrongEventType = tmpl.eventType !== "both" && tmpl.eventType !== activeEventType;
                        const unavailableForNewSelection = availability?.[tmpl.id] === false || isWrongEventType;
                        const canUse = canUseTemplate(tmpl.id);
                        const templatePricing = pricing?.[tmpl.id];
                        const isFree = templatePricing?.isFree || templatePricing?.price === 0;
                        const hasDiscount = Boolean(
                            templatePricing?.onSale
                            && templatePricing.originalPrice
                            && templatePricing.originalPrice > templatePricing.price,
                        );
                        const discountPercent = hasDiscount && templatePricing?.originalPrice
                            ? Math.round((1 - templatePricing.price / templatePricing.originalPrice) * 100)
                            : 0;

                        return (
                            <div
                                key={tmpl.id}
                                className={clsx(
                                    "group relative w-full min-w-0 overflow-hidden rounded-[1.35rem] border transition-all duration-200",
                                    tmpl.comingSoon 
                                        ? "cursor-not-allowed opacity-60 bg-muted border-transparent grayscale"
                                        : !canUse && !isSelected
                                        ? "cursor-pointer group"
                                        : "cursor-pointer group",
                                    isSelected
                                        ? "border-primary/70 bg-card ring-1 ring-primary/30 shadow-md"
                                        : "border-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md"
                                )}
                            >
                                <button
                                    type="button"
                                    disabled={tmpl.comingSoon || unavailableForNewSelection || licenses[tmpl.id]?.receiptReviewStatus === 'PENDING'}
                                    aria-pressed={isSelected}
                                    onClick={() => handleSelectTemplate(tmpl)}
                                    className="block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                >
                                    {/* Template Image */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                        {tmpl.image ? (
                                            <img
                                                src={tmpl.image}
                                                alt={tmpl.code}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                                loading={isSelected ? "eager" : "lazy"}
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <Palette size={24} />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                                            {templatePricing && (
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-[10px] font-black leading-none text-white shadow-sm",
                                                    isFree ? "bg-emerald-600" : "bg-teal-600",
                                                )}>
                                                    {isFree ? null : <Sparkles size={11} aria-hidden="true" />}
                                                    {isFree ? "FREE" : "VIP Plan"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        {(tmpl.comingSoon || unavailableForNewSelection) && (
                                            <span className="absolute bottom-2 left-2 rounded-full bg-foreground/85 px-2.5 py-1 font-kantumruy text-xs font-bold text-background backdrop-blur-sm">
                                                {tmpl.comingSoon ? "ឆាប់ៗនេះ" : "មិនទទួលថ្មី"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Template Info */}
                                    <div className="flex min-w-0 flex-col gap-2 px-3 py-3">
                                        <div className="flex min-w-0 items-center justify-between gap-1.5">
                                            <p className="line-clamp-1 min-w-0 flex-1 break-words font-kantumruy text-sm font-black leading-5 text-foreground">
                                                {tmpl.code}
                                            </p>
                                        </div>
                                        <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
                                            {activeEventType === 'anniversary'
                                                ? t("wizard.steps.1.anniversary")
                                                : t("wizard.steps.1.wedding")}
                                        </p>
                                        <div className={clsx(
                                            "flex min-h-10 items-center justify-between gap-1.5 border-t border-border/70 pt-2",
                                            isFree
                                                ? "text-emerald-700 dark:text-emerald-300"
                                                : hasDiscount
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : "text-foreground",
                                        )}>
                                            {isFree ? (
                                                <span className="font-kantumruy text-sm font-black">ឥតគិតថ្លៃ</span>
                                            ) : templatePricing ? (
                                                <div className="flex min-w-0 items-baseline gap-1.5">
                                                    <span className="font-mono text-sm font-black leading-5 tabular-nums">
                                                        {formatPrice(templatePricing.price)}
                                                    </span>
                                                    {hasDiscount && templatePricing.originalPrice !== undefined && (
                                                        <span className="font-mono text-[10px] font-medium leading-4 text-muted-foreground line-through">
                                                            {formatPrice(templatePricing.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : pricingError ? (
                                                <span className="font-kantumruy text-[10px] font-semibold text-rose-600 dark:text-rose-400">តម្លៃមិនអាចផ្ទុកបាន</span>
                                            ) : (
                                                <span className="font-kantumruy text-[10px] text-muted-foreground">កំពុងផ្ទុកតម្លៃ...</span>
                                            )}
                                            {hasDiscount && (
                                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-rose-500/10 px-1.5 py-1 font-kantumruy text-[9px] font-bold text-rose-600 dark:text-rose-400">
                                                    <Percent size={10} aria-hidden="true" />
                                                    {discountPercent}%
                                                </span>
                                            )}
                                            {licenses[tmpl.id]?.hasLicense && (
                                                <span className="shrink-0 font-kantumruy text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {licenses[tmpl.id]?.source === "user" ? "VIP" : "បានទិញ"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {isFree && (
                                    <button
                                        type="button"
                                        aria-label="គាំទ្រ MONEA ដោយទិញកាហ្វេ"
                                        title="គាំទ្រ MONEA ដោយទិញកាហ្វេ"
                                        onClick={() => void openSupportQr()}
                                        className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-white/40 bg-white/95 text-amber-800 shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                                    >
                                        <Coffee size={17} aria-hidden="true" />
                                    </button>
                                )}

                                <div className="flex items-center gap-2 border-t border-border/70 bg-muted/20 px-3 py-2">
                                    <button
                                        type="button"
                                        disabled={tmpl.comingSoon || unavailableForNewSelection || licenses[tmpl.id]?.receiptReviewStatus === 'PENDING'}
                                        aria-pressed={isSelected}
                                        onClick={() => handleSelectTemplate(tmpl)}
                                        className={clsx(
                                            "inline-flex h-10 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                                            isSelected
                                                ? "bg-primary/15 text-primary"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90",
                                        )}
                                    >
                                        {!canUse && <CreditCard size={13} />}
                                        <span className="truncate">
                                            {licenses[tmpl.id]?.receiptReviewStatus === 'PENDING'
                                                ? "កំពុងរង់ចាំ Admin"
                                                : isSelected && canUse
                                                ? "កំពុងប្រើ"
                                                : canUse
                                                    ? "ជ្រើសរើស"
                                                    : templatePricing
                                                        ? `បង់ ${formatPrice(templatePricing.price)}`
                                                        : pricingError
                                                            ? "តម្លៃមិនអាចផ្ទុកបាន"
                                                            : "កំពុងផ្ទុកតម្លៃ..."}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`មើល Demo ${tmpl.code}`}
                                        title="មើល Demo"
                                        onClick={() => setPreviewTemplateId(tmpl.id)}
                                        className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <Eye size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Dialog open={supportQrOpen} onOpenChange={setSupportQrOpen}>
                <DialogContent className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] w-[min(calc(100vw-1.5rem),420px)] overflow-y-auto rounded-3xl p-4 sm:p-6">
                    <DialogTitle className="flex items-center gap-2 font-kantumruy text-lg font-black">
                        <Coffee className="h-5 w-5 text-amber-700" aria-hidden="true" />
                        សម្រាប់ កាហ្វេ
                    </DialogTitle>
                    {isLoadingSupportQr ? (
                        <div role="status" className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                            <p className="font-kantumruy text-sm text-muted-foreground">កំពុងរៀបចំ QR...</p>
                        </div>
                    ) : supportQrError ? (
                        <div className="space-y-3">
                            <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-kantumruy text-sm text-destructive">
                                {supportQrError}
                            </p>
                            <button
                                type="button"
                                onClick={() => void openSupportQr()}
                                className="min-h-11 w-full rounded-xl bg-primary px-4 font-kantumruy text-sm font-bold text-primary-foreground"
                            >
                                ព្យាយាមម្តងទៀត
                            </button>
                        </div>
                    ) : supportQr ? (
                        <div className="mx-auto w-fit max-w-full rounded-2xl bg-white p-2.5 shadow-sm sm:p-4">
                            <SafeQRCode
                                value={supportQr}
                                size={240}
                                title="MONEA voluntary support KHQR"
                                className="block h-auto w-[min(240px,68vw)] max-w-full"
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!previewTemplate}
                onOpenChange={(open) => {
                    if (!open) setPreviewTemplateId(null);
                }}
            >
                {previewTemplate && (
                    <DialogContent
                        className="grid h-[100dvh] max-h-[100dvh] w-screen max-w-none grid-rows-[68px_minmax(0,1fr)_72px] gap-0 overflow-hidden rounded-none border-0 bg-[#1d241d] p-0 text-white shadow-2xl md:h-[min(90dvh,700px)] md:max-h-[90dvh] md:w-[min(94vw,560px)] md:rounded-[1.5rem] md:border md:border-white/10 [&>button]:hidden"
                    >
                        <header className="flex min-w-0 items-center gap-3 border-b border-white/10 px-4">
                            <DialogClose
                                aria-label="ត្រឡប់"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <ArrowLeft size={20} aria-hidden="true" />
                            </DialogClose>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="truncate font-kantumruy text-sm font-black text-white">
                                    {previewTemplate.code}
                                </DialogTitle>
                                <DialogDescription className="mt-1 font-kantumruy text-[11px] text-white/60">
                                    មើលគំរូផ្ទាល់ (Live Preview)
                                </DialogDescription>
                            </div>
                            <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 font-kantumruy text-[10px] font-bold text-emerald-300">
                                អាចមើលបាន
                            </span>
                        </header>

                        <div className="flex min-h-0 items-center justify-center overflow-hidden bg-[#252d25] p-0 md:p-3">
                            <div className="relative h-full w-full overflow-hidden bg-white md:aspect-[440/956] md:h-full md:w-auto md:max-w-full">
                                <iframe
                                    key={`${previewTemplate.id}-${activeEventType}`}
                                    title={`Live Preview: ${previewTemplate.code}`}
                                    src={`/preview?templateId=${encodeURIComponent(previewTemplate.id)}&eventType=${activeEventType}`}
                                    className="block h-full w-full border-0 bg-white"
                                />
                            </div>
                        </div>

                        <footer className="flex items-center gap-2 border-t border-white/10 px-4">
                            <DialogClose className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-kantumruy text-xs font-bold text-white/70 transition-colors hover:bg-white/10">
                                បិទ
                            </DialogClose>
                            <button
                                type="button"
                                disabled={previewTemplate.comingSoon || availability?.[previewTemplate.id] === false || licenses[previewTemplate.id]?.receiptReviewStatus === 'PENDING'}
                                onClick={() => {
                                    if (canUseTemplate(previewTemplate.id)) {
                                        handleSelectTemplate(previewTemplate);
                                        setPreviewTemplateId(null);
                                    } else {
                                        setPreviewTemplateId(null);
                                        void beginTemplatePurchase(previewTemplate);
                                    }
                                }}
                                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#697746] px-3 font-kantumruy text-sm font-black text-white transition-colors hover:bg-[#788653] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {canUseTemplate(previewTemplate.id)
                                    ? null
                                    : <CreditCard size={17} aria-hidden="true" />}
                                <span className="truncate">
                                    {canUseTemplate(previewTemplate.id)
                                        ? wedding.templateId === previewTemplate.id ? "បានជ្រើសរើស" : "ជ្រើសរើសគំរូនេះ"
                                        : licenses[previewTemplate.id]?.receiptReviewStatus === 'PENDING'
                                            ? "កំពុងរង់ចាំ Admin"
                                        : pricing?.[previewTemplate.id]
                                            ? `បង់ប្រាក់ ${formatPrice(pricing[previewTemplate.id].price)}`
                                            : "បន្តទៅការទូទាត់"}
                                </span>
                            </button>
                        </footer>
                    </DialogContent>
                )}
            </Dialog>

            <Dialog
                open={!!purchaseConfirmationTemplateId}
                onOpenChange={(open) => {
                    if (!open) setPurchaseConfirmationTemplateId(null);
                }}
            >
                <DialogContent className="w-[min(94vw,420px)] rounded-3xl p-5 sm:p-6">
                    <DialogTitle className="font-kantumruy text-lg font-black">
                        បញ្ជាក់ការទិញ Template
                    </DialogTitle>
                    <DialogDescription className="font-kantumruy text-sm leading-6">
                        តើអ្នកពិតជាចង់ទិញ Template នេះមែនទេ? យើងនឹងបង្កើត QR ទូទាត់ បន្ទាប់ពីអ្នកចុចបន្ត។
                    </DialogDescription>
                    {purchaseConfirmationTemplateId && pricing?.[purchaseConfirmationTemplateId] && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                            <p className="font-kantumruy text-sm font-bold">
                                {pricing[purchaseConfirmationTemplateId].name}
                            </p>
                            <p className="mt-1 font-kantumruy text-sm text-muted-foreground">
                                តម្លៃ៖ {formatPrice(pricing[purchaseConfirmationTemplateId].price)}
                            </p>
                        </div>
                    )}
                    <div className="mt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPurchaseConfirmationTemplateId(null)}
                            className="min-h-11 flex-1 rounded-xl border border-border px-4 font-kantumruy text-sm font-bold text-foreground hover:bg-muted"
                        >
                            បោះបង់
                        </button>
                        <button
                            type="button"
                            onClick={confirmTemplatePurchase}
                            className="min-h-11 flex-1 rounded-xl bg-primary px-4 font-kantumruy text-sm font-bold text-primary-foreground hover:bg-primary/90"
                        >
                            បន្តទៅ QR
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!purchaseTemplateId}
                onOpenChange={(open) => {
                    if (!open && !isInitiatingPurchase && !isVerifyingPurchase) {
                        setPurchaseTemplateId(null);
                        setPurchaseError('');
                        setPurchaseStatusMessage('');
                    }
                }}
            >
                <DialogContent className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] w-[min(calc(100vw-1.5rem),460px)] overflow-y-auto rounded-3xl p-0 [&>button]:hidden">
                    <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                        <DialogClose
                            aria-label="បិទការទូទាត់"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ArrowLeft size={19} aria-hidden="true" />
                        </DialogClose>
                        <div className="min-w-0">
                            <DialogTitle className="truncate font-kantumruy text-base font-black">
                                បង់ប្រាក់ទិញ Template
                            </DialogTitle>
                            <DialogDescription className="mt-1 truncate font-kantumruy text-xs">
                                {visibleTemplates.find((template) => template.id === purchaseTemplateId)?.code
                                    || purchaseSession?.templateName
                                    || "Template"}
                            </DialogDescription>
                        </div>
                    </div>

                    {isInitiatingPurchase ? (
                        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                            <p className="font-kantumruy text-sm font-semibold text-muted-foreground">
                                កំពុងរៀបចំ QR ទូទាត់...
                            </p>
                        </div>
                    ) : purchaseError && !purchaseSession ? (
                        <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                            <p className="font-kantumruy text-sm text-destructive">{purchaseError}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    const template = visibleTemplates.find((item) => item.id === purchaseTemplateId);
                                    if (template) void initiateTemplatePurchase(template);
                                }}
                                className="rounded-xl bg-primary px-4 py-2 font-kantumruy text-sm font-bold text-primary-foreground"
                            >
                                ព្យាយាមម្តងទៀត
                            </button>
                        </div>
                    ) : purchaseSession ? (
                        <div className="space-y-4 p-4 sm:p-5">
                            <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                <p className="font-kantumruy text-xs text-muted-foreground">ចំនួនទឹកប្រាក់</p>
                                <p className="mt-1 font-mono text-2xl font-black text-foreground">
                                    {formatPrice(purchaseSession.amount)}
                                </p>
                                <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                                    Order: {purchaseSession.orderId}
                                </p>
                                {purchaseSession.resumed && (
                                    <p role="status" className="mt-2 font-kantumruy text-xs font-semibold text-primary">
                                        បានបន្តការទូទាត់ចាស់។ QR នេះនៅមានសុពលភាពដដែល។
                                    </p>
                                )}
                            </div>

                            <Tabs value={purchaseTab} onValueChange={(value) => setPurchaseTab(value as 'qr' | 'confirm')}>
                                <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl">
                                    <TabsTrigger value="qr" className="gap-2 rounded-lg font-kantumruy text-xs font-bold">
                                        <CreditCard size={15} aria-hidden="true" />
                                        ស្កេន QR
                                    </TabsTrigger>
                                    <TabsTrigger value="confirm" className="gap-2 rounded-lg font-kantumruy text-xs font-bold">
                                        <CircleCheck size={15} aria-hidden="true" />
                                        បញ្ជាក់ការទូទាត់
                                    </TabsTrigger>
                                    <TabsTrigger value="receipt" className="gap-2 rounded-lg font-kantumruy text-xs font-bold">
                                        <Upload size={15} aria-hidden="true" />
                                        ផ្ញើ slip
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="qr" className="mt-4 space-y-3 text-center">
                                    {!purchaseSession.qrCode ? (
                                        <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-kantumruy text-sm text-destructive">
                                            មិនមាន QR ទូទាត់ទេ។ សូមទាក់ទងផ្នែកជំនួយ។
                                        </p>
                                    ) : purchaseTimeRemaining > 0 ? (
                                        <div className="mx-auto w-fit max-w-full rounded-2xl bg-white p-2.5 shadow-sm sm:p-4">
                                            <SafeQRCode
                                                value={purchaseSession.qrCode}
                                                size={220}
                                                title={`Payment QR for ${purchaseSession.templateName}`}
                                                className="block h-auto w-[min(220px,68vw)] max-w-full"
                                            />
                                        </div>
                                    ) : purchaseSession.expiresAt && purchaseTimeRemaining === 0 ? (
                                        <div role="status" className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                            <p className="font-kantumruy text-sm font-bold text-amber-800 dark:text-amber-200">
                                                QR នេះបានផុតសុពលភាពហើយ។
                                            </p>
                                            <button
                                                type="button"
                                                disabled={isInitiatingPurchase}
                                                onClick={() => {
                                                    const template = visibleTemplates.find((item) => item.id === purchaseTemplateId);
                                                    if (template) void beginTemplatePurchase(template);
                                                }}
                                                className="rounded-xl bg-primary px-4 py-2 font-kantumruy text-sm font-bold text-primary-foreground disabled:opacity-50"
                                            >
                                                បង្កើត QR ថ្មី
                                            </button>
                                        </div>
                                    ) : (
                                        <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-kantumruy text-sm text-destructive">
                                            QR មិនមានពេលផុតកំណត់ត្រឹមត្រូវទេ។ សូមបង្កើត QR ថ្មី។
                                        </p>
                                    )}
                                    <p className="font-kantumruy text-xs leading-5 text-muted-foreground">
                                        ស្កេន QR តាមកម្មវិធីធនាគារ ហើយបង់ចំនួនទឹកប្រាក់តាមដែលបង្ហាញ។
                                    </p>
                                    {purchaseSession.expiresAt && purchaseTimeRemaining > 0 && (
                                        <p role="timer" aria-live="off" className="flex items-center justify-center gap-1.5 font-kantumruy text-[11px] text-muted-foreground">
                                            <span aria-hidden="true">⏱</span>
                                            QR មានសុពលភាពនៅសល់ {Math.floor(purchaseTimeRemaining / 60000)}:{String(Math.floor((purchaseTimeRemaining % 60000) / 1000)).padStart(2, "0")} នាទី
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent value="confirm" className="mt-4 space-y-4">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="font-kantumruy text-sm font-bold text-foreground">
                                            បន្ទាប់ពីបង់ប្រាក់រួច
                                        </p>
                                        <p className="mt-1 font-kantumruy text-xs leading-5 text-muted-foreground">
                                            ចុចប៊ូតុងខាងក្រោម ដើម្បីពិនិត្យប្រតិបត្តិការជាមួយ Bakong។ Template នឹងបើកប្រើបានក្រោយពេលទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់។
                                        </p>
                                    </div>

                                    {purchaseStatusMessage && (
                                        <p role="status" className="rounded-xl bg-amber-500/10 p-3 font-kantumruy text-xs leading-5 text-amber-700 dark:text-amber-300">
                                            {purchaseStatusMessage}
                                        </p>
                                    )}
                                    {purchaseError && (
                                        <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-kantumruy text-xs leading-5 text-destructive">
                                            {purchaseError}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isVerifyingPurchase}
                                        onClick={() => void verifyTemplatePurchase()}
                                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-kantumruy text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                                    >
                                        {isVerifyingPurchase
                                            ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                                            : <CircleCheck size={17} aria-hidden="true" />}
                                        {isVerifyingPurchase ? "កំពុងពិនិត្យ..." : "បញ្ជាក់ការទូទាត់"}
                                    </button>
                                </TabsContent>

                                <TabsContent value="receipt" className="mt-4 space-y-4">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="font-kantumruy text-sm font-bold text-foreground">
                                            ផ្ញើបង្កាន់ដៃឱ្យ Admin ពិនិត្យ
                                        </p>
                                        <p className="mt-1 font-kantumruy text-xs leading-5 text-muted-foreground">
                                            សូមបង់ប្រាក់តាម QR ជាមុន រួចបញ្ចូលរូបបង្កាន់ដៃ។ Template នឹងបើកប្រើបានក្រោយ Admin អនុម័ត។
                                        </p>
                                    </div>

                                    <label className="block space-y-2">
                                        <span className="font-kantumruy text-xs font-bold text-foreground">រូបបង្កាន់ដៃ *</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleReceiptFileChange}
                                            disabled={isSubmittingReceipt}
                                            className="block min-h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:font-kantumruy file:font-bold file:text-primary"
                                        />
                                        <span className="block font-kantumruy text-[11px] text-muted-foreground">JPG, PNG ឬ WebP · អតិបរមា 10 MB</span>
                                    </label>

                                    {receiptPreview && (
                                        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border bg-muted">
                                            <img src={receiptPreview} alt="Payment receipt preview" className="h-full w-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReceiptFile(null);
                                                    setReceiptPreview(null);
                                                    setReceiptError('');
                                                }}
                                                disabled={isSubmittingReceipt}
                                                aria-label="លុបរូបបង្កាន់ដៃ"
                                                className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white"
                                            >
                                                <X size={18} aria-hidden="true" />
                                            </button>
                                        </div>
                                    )}

                                    <label className="block space-y-2">
                                        <span className="font-kantumruy text-xs font-bold text-foreground">កំណត់ចំណាំ (មិនបាច់សរសេរ)</span>
                                        <textarea
                                            value={receiptNote}
                                            onChange={(event) => setReceiptNote(event.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            disabled={isSubmittingReceipt}
                                            placeholder="សរសេរព័ត៌មានបន្ថែម ប្រសិនបើមាន"
                                            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                                        />
                                    </label>

                                    {receiptError && (
                                        <p role="alert" className="rounded-xl bg-destructive/10 p-3 font-kantumruy text-xs leading-5 text-destructive">
                                            {receiptError}
                                        </p>
                                    )}
                                    {licenses[purchaseSession.templateId]?.receiptReviewStatus === 'PENDING' ? (
                                        <p role="status" className="rounded-xl bg-amber-500/10 p-3 font-kantumruy text-xs leading-5 text-amber-700 dark:text-amber-300">
                                            បង្កាន់ដៃបានផ្ញើទៅ Admin ហើយ។ កំពុងរង់ចាំការផ្ទៀងផ្ទាត់។
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isSubmittingReceipt || !receiptFile}
                                            onClick={() => void submitTemplateReceipt()}
                                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-kantumruy text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isSubmittingReceipt
                                                ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                                                : <Upload size={17} aria-hidden="true" />}
                                            {isSubmittingReceipt ? 'កំពុងផ្ញើ...' : 'ផ្ញើបង្កាន់ដៃឱ្យ Admin'}
                                        </button>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default React.memo(Step1Template);
