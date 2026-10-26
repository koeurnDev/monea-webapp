import React, { lazy, useEffect, useState, useCallback, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Smartphone, LayoutTemplate, Settings2, Loader2, ArrowRight, ArrowLeft, CheckCircle2, ExternalLink, Lock, Save, Share2, Send, Copy, CircleHelp, MoreHorizontal } from "lucide-react";
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SafeQRCode from "@/components/ui/SafeQRCode";
// @ts-ignore
import { Joyride, Step } from "react-joyride";
import clsx from "clsx";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useAuth } from "@/hooks/useAuth";

import { StepWizard } from "./components/StepWizard";
import { PreviewSync, MobilePreviewWrapper } from "./components/PreviewSync";
import { useDesignWizard, STEPS, PRESET_COLORS } from "./hooks/useDesignWizard";
import type { WeddingData } from "@/components/templates/types";
import { isEditingLocked } from "@/lib/permissions";
import { isPhoneFrameColor, PHONE_FRAME_COLORS, type PhoneFrameColor } from "@/lib/phone-frame-colors";
import { moneaClient } from "@/lib/api-client";

const StepSkeleton = () => <div className="h-64 rounded-2xl bg-muted animate-pulse" />;

// Lazy-load each step — only load when needed
const Step1Template = lazy(() => import("./components/Step1Template"));
const Step2Info     = lazy(() => import("./components/Step2Info"));
const Step3Time     = lazy(() => import("./components/Step3Time"));
const Step4Media    = lazy(() => import("./components/Step4Media"));
const Step5Extra    = lazy(() => import("./components/Step5Extra"));

const PHONE_PREVIEW_SIZE = { width: 440, height: 956 } as const;

export default function DesignPage() {
    const { t } = useTranslation();
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Admin template preview mode
    const templatePreviewId = searchParams.get('templatePreview');
    const isTemplatePreviewMode = !!templatePreviewId;

    useEffect(() => {
        // Skip wedding check if in template preview mode
        if (isTemplatePreviewMode) return;
        
        if (!isLoading && !user?.weddingId) {
            navigate('/dashboard/create', { replace: true });
        }
    }, [isLoading, user?.weddingId, navigate, isTemplatePreviewMode]);

    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest font-kantumruy">{t("design.wizard.waiting")}</p>
            </div>
        }>
            <DesignContent />
        </Suspense>
    );
}

function DesignContent() {
    const { t } = useTranslation();
    const { isMobile } = useMobileDetection();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Admin template preview mode
    const templatePreviewId = searchParams.get('templatePreview');
    const isTemplatePreviewMode = !!templatePreviewId;
    const [isSheetOpen, setIsSheetOpen] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [isMediaUploading, setIsMediaUploading] = useState(false);
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [copyLinkError, setCopyLinkError] = useState(false);
    const [shareSaveError, setShareSaveError] = useState(false);
    const [finishSaveError, setFinishSaveError] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const [mobilePreviewReady, setMobilePreviewReady] = useState(false);
    const [phoneFrameColor, setPhoneFrameColor] = useState<PhoneFrameColor>("black");
    const shareLinkInputRef = useRef<HTMLInputElement>(null);
    const supportsNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    useEffect(() => {
        let cancelled = false;
        const loadPhoneFrameColor = async () => {
            const response = await moneaClient.get<{ phoneFrameColor: unknown }>(
                "/api/system/phone-frame-color",
                { cache: "no-store" },
            );
            if (cancelled) return;
            if (response.error) {
                console.warn("[Phone Preview] Could not load global frame color:", response.error);
                return;
            }
            if (!isPhoneFrameColor(response.data?.phoneFrameColor)) {
                console.warn("[Phone Preview] API returned an invalid global frame color");
                return;
            }
            setPhoneFrameColor(response.data.phoneFrameColor);
        };
        void loadPhoneFrameColor();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const phoneFrame = PHONE_FRAME_COLORS[phoneFrameColor];
    const {
        mounted,
        wedding,
        setWedding,
        loading,
        currentStep,
        setCurrentStep,
        progress,
        photoMigrationNotice,
        dismissPhotoMigrationNotice,
        mobileTab,
        setMobileTab,
        previewMode,
        setPreviewMode,
        activeAccordion,
        setActiveAccordion,
        templateVersions,
        fetchingVersions,
        newVersionTitle,
        setNewVersionTitle,
        isSavingVersion,
        rollbackConfirm,
        setRollbackConfirm,
        rollbackLoading,
        deleteVersionConfirm,
        setDeleteVersionConfirm,
        saveToast,
        versionToast,
        iframeRef,
        galleryUploading,
        galleryProgress,
        galleryUploadError,
        failedGalleryFileCount,
        retryGalleryUpload,
        loadError,
        retryLoad,
        updateWedding,
        updateTheme,
        updateLabel,
        updateParent,
        updateTemplate,
        updateEventType,
        addGalleryItem,
        removeGalleryItem,
        moveGalleryPhoto,
        removeThemeAsset,
        handleGalleryDirectUpload,
        saveChanges,
        fetchVersions,
        handleSaveVersion,
        handleRollback,
        confirmRollback,
        handleDeleteVersion,
        confirmDeleteVersion,
        nextStep,
        prevStep,
        isDirty,
        lastSavedAt
    } = useDesignWizard();
    const isM1Preview = wedding?.templateId === "khmer-legacy";

    // Joyride Tour
    const [runTour, setRunTour] = useState(false);

    const tourSteps: Step[] = [
        {
            target: '.tour-step-content',
            content: 'នៅទីនេះ អ្នកអាចបំពេញ ឬកែព័ត៌មានរបស់សំបុត្រ។ ចាប់ផ្តើមពីប្រភេទកម្មវិធី និងឈ្មោះសិន។',
            placement: 'auto'
        },
        {
            target: '.tour-next',
            content: 'ចុចប៊ូតុងនេះ ដើម្បីទៅជំហានបន្ទាប់។ រូបភាព និងការតុបតែងជាជម្រើស អ្នកអាចបើកផ្នែកខាងក្រោមដើម្បីកែ ឬរំលងបាន។',
            placement: 'auto'
        },
        {
            target: '.tour-preview',
            content: 'ចុចទីនេះដើម្បីមើលលទ្ធផលពិតនៃធៀបការរបស់អ្នកទាំងលើទូរស័ព្ទនិងកុំព្យូទ័រ។',
            placement: 'auto'
        }
    ];

    const handleJoyrideCallback = (data: any) => {
        const { action, status } = data;
        if (action === "close" || status === "finished" || status === "skipped") {
            setRunTour(false);
        }
    };

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    if (!wedding && loadError) return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
            <div role="alert" className="max-w-md space-y-3">
                <h1 className="font-kantumruy text-lg font-black text-foreground">
                    {t("design.wizard.loadErrorTitle", { defaultValue: "មិនអាចបើកទិន្នន័យធៀបបានទេ" })}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t("design.wizard.loadErrorDescription", { defaultValue: "សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។" })}
                </p>
            </div>
            <Button onClick={() => void retryLoad()} className="font-kantumruy">
                {t("common.actions.retry", { defaultValue: "ព្យាយាមម្តងទៀត" })}
            </Button>
        </div>
    );

    if (!wedding) return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest font-kantumruy">{t("design.wizard.fetching")}</p>
        </div>
    );

    const isLocked = isEditingLocked(wedding);

    const renderStepContent = () => {
        if (!wedding) return null;
        switch (currentStep) {
            case 1:
                return <Step1Template wedding={wedding} updateEventType={updateEventType} updateTemplate={updateTemplate} packageType={wedding.packageType} weddingId={wedding.id} />;
            case 2:
                return (
                    <Step2Info 
                        wedding={wedding} 
                        updateWedding={updateWedding} 
                        updateTheme={updateTheme} 
                        updateParent={updateParent}
                        updateLabel={updateLabel}
                    />
                );
            case 3:
                return (
                    <Step3Time
                        wedding={wedding}
                        updateWedding={updateWedding}
                        updateTheme={updateTheme}
                        setWedding={setWedding}
                    />
                );
            case 4:
                return (
                    <Step4Media
                        wedding={wedding}
                        onPreviewInvitation={() => {
                            setMobilePreviewReady(false);
                            setIsSheetOpen(false);
                        }}
                        photoMigrationNotice={photoMigrationNotice}
                        onDismissPhotoMigrationNotice={dismissPhotoMigrationNotice}
                        updateTheme={updateTheme}
                        removeThemeAsset={removeThemeAsset}
                        removeGalleryItem={removeGalleryItem}
                        replaceGalleryPhoto={(index, url, publicId) => addGalleryItem(url, publicId, index)}
                        moveGalleryPhoto={moveGalleryPhoto}
                        handleGalleryDirectUpload={handleGalleryDirectUpload}
                        galleryUploading={galleryUploading}
                        galleryProgress={galleryProgress}
                        galleryUploadError={galleryUploadError}
                        failedGalleryFileCount={failedGalleryFileCount}
                        retryGalleryUpload={retryGalleryUpload}
                        onUploadingChange={setIsMediaUploading}
                    />
                );
            case 5:
                return (
                    <Step5Extra
                        wedding={wedding}
                        updateTheme={updateTheme}
                        updateParent={updateParent}
                        updateLabel={updateLabel}
                        handleSaveVersion={handleSaveVersion}
                        handleRollback={handleRollback}
                        handleDeleteVersion={handleDeleteVersion}
                        fetchVersions={fetchVersions}
                        templateVersions={templateVersions}
                        fetchingVersions={fetchingVersions}
                        isSavingVersion={isSavingVersion}
                        newVersionTitle={newVersionTitle}
                        setNewVersionTitle={setNewVersionTitle}
                        activeAccordion={activeAccordion}
                        setActiveAccordion={setActiveAccordion}
                        PRESET_COLORS={PRESET_COLORS}
                        packageType={wedding.packageType}
                        addGalleryItem={addGalleryItem}
                        removeGalleryItem={removeGalleryItem}
                        removeThemeAsset={removeThemeAsset}
                    />
                );
            default:
                return null;
        }
    };
    const editorPanel = (
        <div className="flex-1 flex flex-col min-h-0 h-full w-full bg-card/60 backdrop-blur-md z-20 relative">
            <AnimatePresence>
                {saveToast === "success" && (
                    <m.div 
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 10, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20 text-xs font-bold flex items-center gap-2 font-kantumruy"
                    >
                        <CheckCircle2 size={16} /> រក្សាទុករួចរាល់
                    </m.div>
                )}
                {saveToast && saveToast !== "success" && (
                    <m.div 
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 10, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/20 text-xs font-bold flex items-center gap-2 font-kantumruy"
                    >
                        {saveToast === "map-link-required"
                            ? t("wizard.steps.3.mapRequiredHint", { defaultValue: "ត្រូវបញ្ចូល Google Maps link មុនពេលបន្ត ឬរក្សាទុក។" })
                            : saveToast === "error"
                                ? "មិនអាចរក្សាទុកបានទេ សូមពិនិត្យមើលព័ត៌មាន (ឈ្មោះ, ថ្ងៃខែ) ឡើងវិញ"
                                : saveToast}
                    </m.div>
                )}
            </AnimatePresence>
            <StepWizard
                currentStep={currentStep}
                weddingId={wedding?.id}
                onSave={saveChanges}
                loading={loading}
                setStep={setCurrentStep}
                progress={progress}
                isDirty={isDirty}
                lastSavedAt={lastSavedAt}
                canContinue={
                    currentStep === 1
                        ? Boolean(wedding.eventType && wedding.templateId)
                        : currentStep === 2
                            ? Boolean(wedding.groomName?.trim() && wedding.brideName?.trim())
                            : currentStep >= 3
                                ? Boolean(wedding.date && wedding.location?.trim() && (wedding.themeSettings?.mapLink?.trim() || wedding.mapUrl?.trim()))
                            : true
                }
                canContinueHint={
                    currentStep === 1
                        ? "សូមជ្រើសរើសប្រភេទកម្មវិធី និងគំរូធៀប ដើម្បីបន្ត។"
                        : currentStep === 2 && !(wedding.groomName?.trim() && wedding.brideName?.trim())
                            ? "សូមបញ្ចូលឈ្មោះគូទាំងពីរ ដើម្បីបន្ត។"
                            : currentStep >= 3 && !(wedding.date && wedding.location?.trim())
                                ? "សូមបំពេញថ្ងៃ និងឈ្មោះទីតាំងកម្មវិធី មុនបន្ត។"
                                : currentStep >= 3 && !(wedding.themeSettings?.mapLink?.trim() || wedding.mapUrl?.trim())
                                    ? t("wizard.steps.3.mapRequiredHint", { defaultValue: "ត្រូវបញ្ចូល Google Maps link មុនពេលបន្ត ឬរក្សាទុក។" })
                            : undefined
                }
                isUploading={isMediaUploading || galleryUploading}
            >
                {renderStepContent()}
            </StepWizard>
        </div>
    );

    const shareUrl = wedding ? `${window.location.origin}/w/${wedding.id}` : "";
    const telegramShareUrl = new URL("https://t.me/share/url");
    telegramShareUrl.searchParams.set("url", shareUrl);
    telegramShareUrl.searchParams.set("text", t("design.wizard.nativeShareText"));
    const openSavedPreview = async () => {
        setPreviewError(false);
        const previewWindow = window.open("about:blank", "_blank");
        if (!previewWindow) {
            setPreviewError(true);
            return;
        }
        previewWindow.opener = null;
        try {
            const saved = await saveChanges();
            if (!saved) {
                previewWindow.close();
                return;
            }
            previewWindow.location.href = `/w/${encodeURIComponent(wedding.id)}`;
        } catch (error) {
            console.error("Failed to save before opening invitation preview:", error);
            previewWindow.close();
            setPreviewError(true);
        }
    };

    const openShareAfterSave = async () => {
        if (loading || isMediaUploading || galleryUploading) return;
        setShareSaveError(false);
        const saved = await saveChanges();
        if (saved) {
            setCopyLinkError(false);
            setIsShareModalOpen(true);
        } else {
            setShareSaveError(true);
        }
    };

    const finishEditing = async () => {
        if (finishing || loading || isMediaUploading || galleryUploading) return;
        setFinishSaveError(false);
        setFinishing(true);
        try {
            if (await saveChanges()) {
                navigate("/dashboard");
            } else {
                setFinishSaveError(true);
            }
        } finally {
            setFinishing(false);
        }
    };

    const leaveEditor = async () => {
        if (leaving || loading || isMediaUploading || galleryUploading) return;
        setLeaving(true);
        try {
            if (!isDirty || await saveChanges()) {
                navigate("/dashboard");
            }
        } finally {
            setLeaving(false);
        }
    };

    const shareWithDevice = async () => {
        try {
            await navigator.share({
                title: t("design.wizard.shareTitle"),
                text: t("design.wizard.nativeShareText"),
                url: shareUrl,
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error("Failed to share invitation using the device share sheet:", error);
        }
    };
    
    const ShareModal = () => (
        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md font-khmer p-4 sm:p-6 rounded-[2rem] [&>button]:right-3 [&>button]:top-3 [&>button]:h-11 [&>button]:w-11 sm:[&>button]:right-6 sm:[&>button]:top-6">
                <DialogHeader>
                    <DialogTitle className="text-center font-black font-kantumruy">
                        {t("design.wizard.shareTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs">
                        {t("design.wizard.shareDescription")}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-2 sm:p-4 space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                        {shareUrl && <SafeQRCode value={shareUrl} size={180} className="h-auto w-[min(180px,55vw)]" fgColor="#0f172a" />}
                    </div>
                    {supportsNativeShare && (
                        <Button
                            type="button"
                            className="h-11 w-full rounded-xl font-kantumruy font-bold"
                            onClick={() => void shareWithDevice()}
                        >
                            <Share2 size={16} className="mr-2" />
                            {t("design.wizard.shareViaDevice")}
                        </Button>
                    )}
                    <Button
                        asChild
                        className="h-11 w-full rounded-xl bg-[#229ED9] font-kantumruy font-bold text-white hover:bg-[#1d8fca]"
                    >
                        <a href={telegramShareUrl.toString()} target="_blank" rel="noopener noreferrer">
                            <Send size={16} className="mr-2" />
                            {t("design.wizard.shareViaTelegram")}
                        </a>
                    </Button>
                    <div className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <input 
                            ref={shareLinkInputRef}
                            readOnly 
                            value={shareUrl} 
                            aria-label={t("design.wizard.shareLink")}
                            onClick={(event) => event.currentTarget.select()}
                            onFocus={(event) => event.currentTarget.select()}
                            className="min-w-0 flex-1 bg-transparent border-none text-xs font-medium text-slate-500 px-3 outline-none"
                        />
                        <Button 
                            size="sm"
                            className="h-11 rounded-xl px-4 font-bold active:scale-95 transition-transform"
                            onClick={async () => {
                                setCopyLinkError(false);
                                try {
                                    await navigator.clipboard.writeText(shareUrl);
                                    setCopiedShareLink(true);
                                    window.setTimeout(() => setCopiedShareLink(false), 2000);
                                } catch (error) {
                                    console.error("Failed to copy invitation link:", error);
                                    setCopiedShareLink(false);
                                    setCopyLinkError(true);
                                    window.requestAnimationFrame(() => {
                                        shareLinkInputRef.current?.focus();
                                        shareLinkInputRef.current?.select();
                                    });
                                }
                            }}
                        >
                            <Copy size={14} className="mr-2" />
                            {copiedShareLink ? t("design.wizard.copied") : t("design.wizard.copy")}
                        </Button>
                    </div>
                    {copyLinkError && (
                        <p role="alert" className="w-full text-center text-xs text-red-600">
                            {t("design.wizard.copyError")}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );

    // ==========================================
    // RESPONSIVE LAYOUT ARCHITECTURE
    // ==========================================
    // The design page renders differently based on the device width.
    // 1. Desktop: Shows a side-by-side view with the editor on the left
    //    and a live preview (iframe) on the right.
    // 2. Mobile: Uses a bottom-navigation tab system to switch between
    //    the editor form and the fullscreen preview iframe.
    // 
    // Data synchronization between the Editor state and the Iframe is 
    // managed by the `<PreviewSync />` component.
    // ==========================================

    // DESKTOP LAYOUT (In-flow, managed by DashboardLayout)
    const desktopLayout = (
        <div className="hidden md:flex flex-row overflow-hidden bg-background h-full w-full">
            {/* 1. EDITOR PANEL (Left Sidebar) */}
            <div className="flex-none w-[520px] flex flex-col z-20 bg-card shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-none h-full">
                {editorPanel}
            </div>

            {/* 2. PREVIEW AREA (Right Fluid) */}
            <div className="flex-1 bg-slate-50/50 dark:bg-black/20 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
                {/* Subtle Background Accent */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px]"></div>
                </div>

                {/* Desktop Preview Container (iPhone 16 Pro Mockup) */}
                <div
                    className={clsx(
                        "relative z-10 transition-all duration-300 ease-in-out flex flex-col group origin-center",
                        previewMode === 'mobile' 
                            ? "h-[calc(88vh-48px)] max-h-[820px] min-h-[520px] translate-y-6"
                            : "w-[95%] h-[82vh] rounded-2xl border-4 border-slate-900/10 dark:border-white/10 overflow-hidden bg-background shadow-2xl"
                    )}
                    style={previewMode === 'mobile' ? {
                        aspectRatio: `${PHONE_PREVIEW_SIZE.width} / ${PHONE_PREVIEW_SIZE.height}`,
                        maxWidth: `${PHONE_PREVIEW_SIZE.width}px`,
                    } : undefined}
                >
                    {previewMode === 'mobile' && (
                        <>
                            {!isM1Preview && (
                                <>
                                    <div className="absolute left-[-3px] top-[16%] z-0 h-[7%] w-[4px] rounded-l-full shadow-sm" style={{ background: phoneFrame.side }} />
                                    <div className="absolute left-[-3px] top-[25%] z-0 h-[11%] w-[4px] rounded-l-full shadow-sm" style={{ background: phoneFrame.side }} />
                                    <div className="absolute right-[-3px] top-[23%] z-0 h-[13%] w-[4px] rounded-r-full shadow-sm" style={{ background: phoneFrame.side }} />
                                </>
                            )}

                            <div
                                className={clsx(
                                    "relative z-10 h-full w-full",
                                    isM1Preview
                                        ? "overflow-hidden rounded-[3.1rem] bg-background"
                                        : "rounded-[3.5rem] border border-black/30 p-[3px] shadow-[0_24px_56px_rgba(0,0,0,0.38),inset_0_1px_1px_rgba(255,255,255,0.42)]",
                                )}
                                style={isM1Preview ? undefined : { background: phoneFrame.gradient }}
                            >
                                <div className={clsx(
                                    "relative h-full w-full",
                                    isM1Preview
                                        ? "overflow-hidden rounded-[3.1rem] bg-background"
                                        : "rounded-[3.35rem] border border-[#090a0c] bg-[#090a0c] p-[2px]",
                                )}>
                                    <div className={clsx(
                                        "relative h-full w-full overflow-hidden bg-background",
                                        isM1Preview ? "rounded-[3.1rem]" : "rounded-[3.2rem]",
                                    )}>
                                        <iframe
                                            ref={iframeRef}
                                            src="/preview?mode=editor"
                                            onLoad={() => {
                                                if (iframeRef.current?.contentWindow && wedding) {
                                                    iframeRef.current.contentWindow.postMessage({ type: "UPDATE_PREVIEW", payload: wedding }, "*");
                                                }
                                            }}
                                            className="h-full w-full border-none bg-background"
                                            title={t("design.wizard.preview")}
                                        />
                                        <div
                                            aria-hidden="true"
                                            className="pointer-events-none absolute left-1/2 top-[2.5%] z-40 h-7 w-[29%] max-w-[120px] -translate-x-1/2 rounded-full border border-white/[0.06] bg-black shadow-[0_1px_5px_rgba(0,0,0,0.6)]"
                                        >
                                            <span className="absolute right-[18%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#10141a] shadow-[inset_0_0_2px_rgba(100,140,190,0.45)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Desktop Mode - Full Width */}
                    {previewMode === 'desktop' && (
                        <iframe
                            ref={iframeRef}
                            src="/preview?mode=editor"
                            onLoad={() => {
                                if (iframeRef.current?.contentWindow && wedding) {
                                    iframeRef.current.contentWindow.postMessage({ type: "UPDATE_PREVIEW", payload: wedding }, "*");
                                }
                            }}
                            className="h-full w-full border-none bg-background"
                            title={t("design.wizard.preview")}
                        />
                    )}
                </div>

                <PreviewSync wedding={wedding} iframeRef={iframeRef} currentStep={currentStep} enableScrollSync={false} />

                {/* View Toggle Toolbar (Desktop Only) */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#141419]/95">
                    <div role="group" aria-label={t("design.wizard.previewSize")} className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-white/5">
                        <button
                            type="button"
                            aria-pressed={previewMode === 'mobile'}
                            onClick={() => setPreviewMode('mobile')}
                            className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                previewMode === 'mobile'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/10"
                            )}
                            title={t("design.wizard.previewMode.mobile")}
                        >
                            <Smartphone size={16} />
                        </button>
                        <button
                            type="button"
                            aria-pressed={previewMode === 'desktop'}
                            onClick={() => setPreviewMode('desktop')}
                            className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                previewMode === 'desktop'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/10"
                            )}
                            title={t("design.wizard.previewMode.desktop")}
                        >
                            <LayoutTemplate size={16} />
                        </button>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-1.5">
                        {/* Auto-save Indicator */}
                        <div className="flex items-center text-xs font-kantumruy font-bold text-foreground">
                            {loading ? (
                                <><Loader2 size={13} className="animate-spin text-teal-500 mr-1.5" /> <span>{t("design.wizard.saving")}</span></>
                            ) : isDirty ? (
                                <><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" /> <span className="text-amber-600 dark:text-amber-400">{t("design.wizard.unsaved")}</span></>
                            ) : (
                                <><CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> <span>{t("design.wizard.saved")}</span></>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
                                aria-label={t("design.wizard.moreActions")}
                                title={t("design.wizard.moreActions")}
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 font-kantumruy">
                            <DropdownMenuItem
                                disabled={isMediaUploading || galleryUploading}
                                onSelect={() => void openSavedPreview()}
                            >
                                <ExternalLink />
                                {t("design.wizard.openPreview")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={loading || isMediaUploading || galleryUploading}
                                onSelect={() => void openShareAfterSave()}
                            >
                                <Share2 />
                                {t("design.wizard.share")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {previewError && (
                        <span role="alert" className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-red-600 px-3 py-2 text-xs text-white shadow-lg">
                            {t("design.wizard.previewError")}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    // MOBILE LAYOUT (Portal to Body, Full Screen Overlay)
    const mobileLayout = mounted ? createPortal(
        <div className="md:hidden fixed inset-0 z-40 flex h-[100dvh] w-[100vw] max-w-none min-w-0 flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]" role="dialog" aria-modal="true" aria-label={t("design.wizard.mobileEditor")}>
            {/* Compact mobile header keeps more of the invitation editor visible. */}
            <div className={clsx(
                "h-12 bg-white/95 dark:bg-background/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between px-2.5 z-50 transition-all shadow-xs",
                isSheetOpen ? "flex-none relative" : "absolute top-0 left-0 w-full"
            )}>
                <div className="flex-1 flex justify-start items-center">
                    {isSheetOpen ? (
                        <button
                            type="button"
                            onClick={() => void leaveEditor()}
                            disabled={leaving || loading || isMediaUploading || galleryUploading}
                            aria-label={t("design.wizard.backToDashboard")}
                            className="h-11 w-11 -ml-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center rounded-xl active:bg-slate-100 dark:active:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {leaving ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} strokeWidth={2.5} />}
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                setShareSaveError(false);
                                setFinishSaveError(false);
                                setIsSheetOpen(true);
                            }}
                            className="h-11 px-2 -ml-1 text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-all font-bold text-xs font-kantumruy active:scale-95"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                            <span>{t("design.wizard.edit")}</span>
                        </button>
                    )}
                </div>
                
                <div className="flex-none flex justify-center items-center">
                    <MoneaLogo size="sm" showText={true} />
                </div>
                
                <div className="flex-1 flex justify-end items-center gap-2">
                    {isSheetOpen && (
                        <button
                            onClick={() => setRunTour(true)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/30"
                            title={t("design.wizard.help")}
                            aria-label={t("design.wizard.help")}
                        >
                            <CircleHelp size={18} />
                        </button>
                    )}
                    {/* Auto-save Indicator (Mobile) */}
                    <div
                        role="status"
                        aria-label={loading ? t("design.wizard.saving") : isDirty ? t("design.wizard.unsaved") : t("design.wizard.saved")}
                        className="flex items-center justify-center h-10 px-1 text-slate-400 dark:text-slate-500"
                        title={loading ? t("design.wizard.saving") : isDirty ? t("design.wizard.unsaved") : t("design.wizard.saved")}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin text-teal-500" />
                        ) : isDirty ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        ) : (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        )}
                    </div>
                    {isSheetOpen ? (
                        <button
                            onClick={() => {
                                setMobilePreviewReady(false);
                                setIsSheetOpen(false);
                            }}
                            aria-label={t("design.wizard.previewInvitation")}
                            className="tour-preview h-11 shrink-0 whitespace-nowrap px-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center rounded-xl transition-all font-kantumruy font-bold text-xs gap-1 active:scale-95"
                            title={t("design.wizard.preview", { defaultValue: "មើលលទ្ធផល" })}
                        >
                            <ExternalLink size={16} />
                            <span className="whitespace-nowrap">{t("design.wizard.previewShort", { defaultValue: "មើល" })}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void finishEditing()}
                            disabled={finishing || loading || isMediaUploading || galleryUploading}
                            className="h-11 min-w-16 px-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center rounded-xl transition-all font-kantumruy font-bold text-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {finishing ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 size={14} className="animate-spin" />
                                    {t("design.wizard.finishing")}
                                </span>
                            ) : t("design.wizard.done")}
                        </button>
                    )}
                </div>
            </div>
            {/* TABS FOR MOBILE */}
            <div className="relative flex min-h-0 min-w-0 flex-1 w-full max-w-none flex-col bg-background">
                {isSheetOpen ? (
                    // EDITOR MODE
                    <div className="relative flex min-h-0 min-w-0 flex-1 w-full max-w-none flex-col">
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {editorPanel}
                        </div>

                    </div>
                ) : (
                    // PREVIEW MODE
                    <div className="flex-1 flex flex-col bg-background relative">
                        <div className="flex-1 relative overflow-hidden">
                            <MobilePreviewWrapper
                                wedding={wedding}
                                currentStep={currentStep}
                                onReadyChange={setMobilePreviewReady}
                            />
                        </div>
                        {/* Preview action bar keeps the edit/finish choices visible. */}
                        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-50 pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/75 p-2 backdrop-blur-md">
                            <p role="status" className="px-2 text-center font-kantumruy text-xs leading-relaxed text-white/80">
                                {mobilePreviewReady
                                    ? "ពិនិត្យរូប និងព័ត៌មានធៀប រួចចុចចែករំលែក។"
                                    : "សូមរង់ចាំឲ្យ Preview បើកសិន។"}
                            </p>
                            <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSheetOpen(true)}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-slate-900 font-kantumruy shadow-lg active:scale-95 transition-all"
                            >
                                <Palette size={16} />
                                <span>{t("design.wizard.edit")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => void openShareAfterSave()}
                                disabled={!mobilePreviewReady || loading || isMediaUploading || galleryUploading}
                                title={!mobilePreviewReady ? "សូមរង់ចាំ Preview បើកសិន" : undefined}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white font-kantumruy shadow-lg shadow-teal-950/20 transition-all hover:bg-teal-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Share2 size={16} />
                                <span>{t("design.wizard.share")}</span>
                            </button>
                            </div>
                        </div>
                        {shareSaveError && (
                            <div
                                role="alert"
                                className="absolute bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-3 right-3 z-50 rounded-xl border border-rose-300/30 bg-rose-950/90 px-3 py-2 text-center font-kantumruy text-xs font-medium leading-relaxed text-white shadow-lg"
                            >
                                {t("design.wizard.shareSaveError")}
                            </div>
                        )}
                        {finishSaveError && (
                            <div
                                role="alert"
                                className="absolute bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-3 right-3 z-50 rounded-xl border border-rose-300/30 bg-rose-950/90 px-3 py-2 text-center font-kantumruy text-xs font-medium leading-relaxed text-white shadow-lg"
                            >
                                {t("design.wizard.finishSaveError")}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative h-[100dvh] w-full flex flex-col">
            {!isMobile && desktopLayout}
            {isMobile && mobileLayout}
            {mounted && <ShareModal />}
            {mounted && <Joyride
                steps={tourSteps}
                run={runTour}
                // @ts-ignore
                callback={handleJoyrideCallback}
                continuous
                showProgress
                showSkipButton
                disableOverlayClose
                spotlightClicks={false}
                locale={{ back: 'ថយក្រោយ', close: 'បិទ', last: 'បញ្ចប់', next: 'បន្ទាប់', skip: 'រំលង' }}
                styles={{
                    floater: { zIndex: 10000 },
                    tooltip: {
                        width: 'min(320px, calc(100vw - 32px))',
                        maxWidth: 'calc(100vw - 32px)',
                        boxSizing: 'border-box'
                    }
                }}
            />}

            {isLocked && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="bg-card p-10 rounded-[3rem] shadow-2xl border-2 border-dashed border-primary/20 max-w-md w-full flex flex-col items-center">
                        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-6">
                            <Lock className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-4 font-kantumruy uppercase tracking-tight">
                            {t("design.locked.title")}
                        </h2>
                        <p className="text-muted-foreground mb-8 font-khmer leading-relaxed">
                            {t("design.locked.description")}
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <Button asChild className="h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-wider shadow-xl dark:bg-slate-800 dark:hover:bg-slate-700">
                                <Link to="/dashboard">{t("design.locked.updateBtn")}</Link>
                            </Button>
                            <Button variant="ghost" asChild className="h-12 rounded-2xl font-bold font-khmer">
                                <Link to="/dashboard">{t("design.locked.backBtn")}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
