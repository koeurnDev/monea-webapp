import * as React from 'react';
import { Label } from "@/components/ui/label";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { DebouncedTextarea } from "@/components/ui/debounced-textarea";
import { Switch } from "@/components/ui/switch";
import {
    Palette, Heart, CreditCard, Type, Clock, BookOpen,
    MessageSquare, Eye, Facebook, Send, Phone, ImageIcon, Share2, Upload, Trash2, Loader2,
    Settings, Sparkles, Lock
} from "lucide-react";
import clsx from "clsx";
import { m, AnimatePresence } from 'framer-motion';
import type { TemplateSection, VisibilityKey, WeddingData } from '@/components/templates/types';
import { useTranslation } from "@/i18n/LanguageProvider";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { AccordionItem } from "./sections/AccordionItem";
import { PaymentSection } from "./sections/PaymentSection";
import { LabelsSection } from "./sections/LabelsSection";
import { HistorySection } from "./sections/HistorySection";
import { NEA_M05_COLOR_PRESETS } from "@/lib/nea-m05-colors";
import { getTemplateConfig } from "@/components/templates/template-config";
import { getTemplateDefaultPaperColor, TEMPLATE_PAPER_TEXTURES } from "@/lib/template-paper";
import { isRecommendedSocialPreviewAspectRatio } from "@/lib/social-preview";

const MAX_STORY_IMAGES = 30;

interface Step5ExtraProps {
    wedding: WeddingData;
    updateTheme: (key: string | Record<string, unknown>, value?: any) => void;
    updateParent: (key: string, value: string) => void;
    updateLabel: (key: string, value: string) => void;
    handleSaveVersion: () => Promise<void>;
    handleRollback: (versionId: string) => Promise<void>;
    handleDeleteVersion: (versionId: string) => Promise<void>;
    fetchVersions: () => Promise<void>;
    templateVersions: any[];
    fetchingVersions: boolean;
    isSavingVersion: boolean;
    newVersionTitle: string;
    setNewVersionTitle: (val: string) => void;
    activeAccordion: string | null;
    setActiveAccordion: (val: string | null) => void;
    PRESET_COLORS: string[];
    packageType?: string | null;
    addGalleryItem: (url: string, publicId?: string, index?: number) => void;
    removeGalleryItem: (index: number) => void;
    removeThemeAsset: (urlKey: string, publicIdKey: string, assetIndex?: number) => Promise<void>;
}

const visibilityOptions: { key: VisibilityKey; section: TemplateSection; label: string; icon: typeof Heart }[] = [
    { key: 'showStory', section: "story", label: "រឿងរ៉ាវស្នេហា (Love Story)", icon: Heart },
    { key: 'showGallery', section: "gallery", label: "វិចិត្រសាលរូបថត (Photo Gallery)", icon: ImageIcon },
    { key: 'showTimeline', section: "timeline", label: "កាលវិភាគកម្មវិធី (Schedule Timeline)", icon: Clock },
    { key: 'showGuestbook', section: "guestbook", label: "សៀវភៅជូនពរ (Guestbook Wishes)", icon: MessageSquare }
] as const;

const Step5Extra: React.FC<Step5ExtraProps> = ({
    wedding,
    updateTheme,
    updateParent,
    updateLabel,
    handleSaveVersion,
    handleRollback,
    handleDeleteVersion,
    fetchVersions,
    templateVersions,
    fetchingVersions,
    isSavingVersion,
    newVersionTitle,
    setNewVersionTitle,
    activeAccordion,
    setActiveAccordion,
    PRESET_COLORS,
    packageType,
    addGalleryItem,
    removeGalleryItem,
    removeThemeAsset
}) => {
    const { t } = useTranslation();
    const [mounted, setMounted] = React.useState(false);
    const isAnniv = wedding.eventType === 'anniversary';
    React.useEffect(() => { setMounted(true); }, []);

    const isPremium = packageType === "PREMIUM";
    const isNeaM05 = wedding.templateId === "nea-m05";
    const isEmeraldGarden = wedding.templateId === "emerald-garden";
    const isAnniversaryElegant = wedding.templateId === "anniversary-elegant";
    const supportsPaperCustomization = Boolean(getTemplateConfig(wedding.templateId));
    const selectedM05Color = wedding.themeSettings?.m05ColorPreset || "olive-gold";
    const selectedM05Palette = NEA_M05_COLOR_PRESETS.find((preset) => preset.id === selectedM05Color) || NEA_M05_COLOR_PRESETS[0];
    const templateDefaultColor = getTemplateConfig(wedding.templateId)?.primaryColor || "#f43f5e";
    const supportedVisibilityControls: readonly TemplateSection[] =
        getTemplateConfig(wedding.templateId)?.visibilityControls || [];
    const [socialPreviewUrl, setSocialPreviewUrl] = React.useState<string | null>(wedding.themeSettings?.socialPreviewImage || null);
    const [socialPreviewAspectWarning, setSocialPreviewAspectWarning] = React.useState<string | null>(null);
    const [storyImageLimitNotice, setStoryImageLimitNotice] = React.useState<string | null>(null);
    const socialPreviewFallbackUrl = [
        wedding.themeSettings?.heroImage,
        wedding.galleryItems?.[0]?.url,
    ].find((url): url is string =>
        typeof url === "string" && url.length > 0 && !/^(?:data|blob):/i.test(url)
    ) || "/icons/logomoneo.webp";
    const socialPreviewImage = socialPreviewUrl && !/^(?:data|blob):/i.test(socialPreviewUrl)
        ? socialPreviewUrl
        : socialPreviewFallbackUrl;
    const socialPreviewTitle = wedding.themeSettings?.customLabels?.invite_title?.trim()
        || `ធៀបអញ្ជើញ៖ ${wedding.groomName || "កូនកំលោះ"} & ${wedding.brideName || "កូនក្រមុំ"} 💍`;
    const socialInputRef = React.useRef<HTMLInputElement>(null);
    const {
        uploading: socialPreviewUploading,
        progress: socialPreviewProgress,
        error: socialPreviewError,
        uploadFile: uploadSocialPreview,
    } = useCloudinaryUpload({
        onSuccess: (url, publicId, type) => {
            if (type !== "IMAGE") return;
            setSocialPreviewUrl(url);
            updateTheme({
                socialPreviewImage: url,
                socialPreviewImagePublicId: publicId || "",
            });
        },
        resourceType: "image",
        folder: wedding.id,
    });
    const storyImageInputRef = React.useRef<HTMLInputElement>(null);
    const storyImages = wedding.themeSettings?.storyImages;
    const storyImageSkipped = Array.isArray(storyImages) && storyImages.length === 0;
    const storyMediaRef = React.useRef({
        images: wedding.themeSettings?.storyImages || [],
        captions: wedding.themeSettings?.storyImageCaptions || [],
        publicIds: wedding.themeSettings?.storyImagePublicIds
            || (wedding.themeSettings?.storyImagePublicId ? [wedding.themeSettings.storyImagePublicId] : []),
    });
    React.useEffect(() => {
        storyMediaRef.current = {
            images: wedding.themeSettings?.storyImages || [],
            captions: wedding.themeSettings?.storyImageCaptions || [],
            publicIds: wedding.themeSettings?.storyImagePublicIds
                || (wedding.themeSettings?.storyImagePublicId ? [wedding.themeSettings.storyImagePublicId] : []),
        };
    }, [wedding.themeSettings?.storyImages, wedding.themeSettings?.storyImageCaptions, wedding.themeSettings?.storyImagePublicIds, wedding.themeSettings?.storyImagePublicId]);
    const { uploading: storyImageUploading, progress: storyImageProgress, error: storyImageError, uploadFile: uploadStoryImage } = useCloudinaryUpload({
        folder: wedding.id,
        onSuccess: (url, publicId) => {
            const currentImages = storyMediaRef.current.images;
            if (currentImages.filter(Boolean).length >= MAX_STORY_IMAGES) {
                setStoryImageLimitNotice(`អាចបញ្ចូលរូបបានច្រើនបំផុត ${MAX_STORY_IMAGES} សន្លឹកប៉ុណ្ណោះ។`);
                return;
            }
            const currentPublicIds = storyMediaRef.current.publicIds;
            const nextImages = [...currentImages, url];
            const nextPublicIds = [...currentPublicIds, publicId || ""];
            storyMediaRef.current = {
                ...storyMediaRef.current,
                images: nextImages,
                publicIds: nextPublicIds,
            };
            updateTheme({
                storyImages: nextImages,
                storyImagePublicIds: nextPublicIds,
                storyImagePublicId: "",
            });
        },
    });

    React.useEffect(() => {
        setSocialPreviewUrl(wedding.themeSettings?.socialPreviewImage || null);
    }, [wedding.themeSettings?.socialPreviewImage]);

    const onSocialFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file?.type.startsWith("image/")) return;

        setSocialPreviewAspectWarning(null);
        try {
            const image = await createImageBitmap(file);
            const isRecommended = isRecommendedSocialPreviewAspectRatio(image.width, image.height);
            image.close();
            if (!isRecommended) {
                setSocialPreviewAspectWarning("រូបនេះមិនសូវផ្ដេកទេ។ សូមប្រើរូបសមាមាត្រប្រហែល 1.91:1 ដើម្បីកាត់រូបបានស្អាតក្នុង Link preview។");
            }
        } catch {
            setSocialPreviewAspectWarning("មិនអាចពិនិត្យសមាមាត្ររូបបានទេ។ រូបនៅតែអាចបង្ហោះបាន ប៉ុន្តែ Link preview អាចកាត់រូប។");
        }

        void uploadSocialPreview(file);
    };
    const sectionShortcuts = [
        { id: 'payment', label: 'KHQR', icon: CreditCard },
        { id: 'story', label: 'រឿងរ៉ាវ', icon: BookOpen },
        { id: 'social', label: 'Social', icon: MessageSquare },
        { id: 'social-preview', label: 'រូប Link', icon: Share2 },
        { id: 'display', label: 'បង្ហាញ', icon: Eye },
        { id: 'labels', label: 'ពាក្យលើធៀប', icon: Type },
    ];
    const selectedSectionId = activeAccordion === 'theme' || activeAccordion === 'typography'
        ? 'payment'
        : activeAccordion || 'payment';
    const openSection = (sectionId: string) => {
        setActiveAccordion(sectionId);
    };
    const updatePaperColor = (color: string) => {
        updateTheme({
            paperColor: color,
            ...(isNeaM05 ? { m05CardColor: color } : {}),
            ...(isEmeraldGarden ? { emeraldCardColor: color } : {}),
            ...(isAnniversaryElegant ? { m07CardColor: color } : {}),
        });
    };
    const resetPaperCustomization = () => {
        updateTheme({
            paperTexture: "cream",
            paperColor: "",
            ...(isNeaM05 ? { m05CardColor: "" } : {}),
            ...(isEmeraldGarden ? { emeraldCardColor: "" } : {}),
            ...(isAnniversaryElegant ? { m07CardColor: "" } : {}),
        });
    };
    const resetRecommendedPaperColor = () => {
        updateTheme({
            paperColor: "",
            ...(isNeaM05 ? { m05CardColor: "" } : {}),
            ...(isEmeraldGarden ? { emeraldCardColor: "" } : {}),
            ...(isAnniversaryElegant ? { m07CardColor: "" } : {}),
        });
    };

    return (
        <div className="space-y-4 sm:space-y-6 font-kantumruy">
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-foreground">រចនាប័ទ្ម និងព័ត៌មានបន្ថែម</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">ភាគច្រើនអាចរំលងបាន</span>
                </div>
                <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                    KHQR បណ្តាញសង្គម និងសារផ្សេងៗជាជម្រើសបន្ថែម។
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black text-foreground">ជ្រើសរើសផ្នែកដែលចង់កែ</p>
                        <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">ជ្រើសរើសមួយផ្នែក ដើម្បីបើកការកំណត់របស់វា</p>
                    </div>
                    <Settings className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2">
                    {sectionShortcuts.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => openSection(id)}
                            aria-pressed={selectedSectionId === id}
                            title={label}
                            className={clsx(
                                "flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors sm:min-h-11 sm:gap-1.5 sm:px-2 sm:text-xs",
                                selectedSectionId === id
                                    ? "border-primary/30 bg-accent text-primary"
                                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 truncate">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Show only the selected settings section so navigation labels are not repeated. */}
            <div className="space-y-3">
                {/* 1. Theme Color */}
                <AccordionItem
                    id="step5-theme"
                    hideWhenClosed
                    hideHeader
                    icon={Palette}
                    title="ពណ៌ធៀប"
                    isOpen={false}
                    onClick={() => setActiveAccordion('theme')}
                >
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-foreground">
                                {isNeaM05 ? "ពណ៌ស្រាប់ · Colour presets" : "ក្ដារពណ៌ (Preset Colors)"}
                            </Label>
                            {!isPremium && (
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20">
                                    PRO / PREMIUM
                                </span>
                            )}
                        </div>
                        {isNeaM05 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: "primaryColor", label: "ពណ៌លម្អ", value: wedding.themeSettings?.primaryColor || selectedM05Palette.foil },
                                    { key: "m05FoilShadeColor", label: "ពណ៌ស្រមោល", value: wedding.themeSettings?.m05FoilShadeColor || selectedM05Palette.foilShade },
                                    { key: "m05HighlightColor", label: "ពណ៌បន្លិច", value: wedding.themeSettings?.m05HighlightColor || selectedM05Palette.foilHighlight },
                                    { key: "m05EnvelopeColor", label: "ពណ៌ស្រោម", value: wedding.themeSettings?.m05EnvelopeColor || selectedM05Palette.envelope },
                                    { key: "m05CardColor", label: "ពណ៌សំបុត្រ", value: wedding.themeSettings?.m05CardColor || "#f3ecdc" },
                                    { key: "m05SealColor", label: "ពណ៌ត្រាស្រោម", value: wedding.themeSettings?.m05SealColor || selectedM05Palette.foil },
                                    { key: "m05SurfaceColor", label: "ពណ៌ផ្ទៃ", value: wedding.themeSettings?.m05SurfaceColor || selectedM05Palette.darkSurface },
                                ].map(({ key, label, value }) => (
                                    <label key={key} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                        <span className="text-xs font-bold text-muted-foreground">{label}</span>
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(event) => {
                                                updateTheme({
                                                    [key]: event.target.value,
                                                    paperColor: key === "m05CardColor" ? event.target.value : "",
                                                    colorPalettePreset: "",
                                                    m05ColorPreset: "custom",
                                                });
                                            }}
                                            className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                            aria-label={`ជ្រើសរើស${label}`}
                                        />
                                    </label>
                                ))}
                                <label className="col-span-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                    <span className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                        <span>ពណ៌លើរូបថត</span>
                                        <span>{wedding.themeSettings?.m05PhotoTint ?? 22}%</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={45}
                                        step={1}
                                        value={wedding.themeSettings?.m05PhotoTint ?? 22}
                                        onChange={(event) => updateTheme("m05PhotoTint", Number(event.target.value))}
                                        className="mt-2 w-full accent-primary"
                                        aria-label="កម្រិត tint លើរូបថត"
                                    />
                                </label>
                                <p className="col-span-2 text-xs leading-5 text-muted-foreground">
                                    ពណ៌អក្សររក្សាតាមស្ទីលដើមរបស់ Template ដើម្បីងាយអាន។ ប៊ូតុងប្រើពណ៌អក្សរដែលផ្ទុយច្បាស់; Preview បង្ហាញលទ្ធផលចុងក្រោយ។
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {isEmeraldGarden && (
                                    <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                        <span className="text-xs font-bold text-muted-foreground">ពណ៌សំបុត្រ</span>
                                        <input
                                            type="color"
                                            value={wedding.themeSettings?.paperColor || wedding.themeSettings?.emeraldCardColor || "#ffffff"}
                                            onChange={(event) => updatePaperColor(event.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                            aria-label="ជ្រើសរើសពណ៌សំបុត្រ"
                                        />
                                    </label>
                                )}
                                {isAnniversaryElegant && (
                                    <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                        <span className="text-xs font-bold text-muted-foreground">ពណ៌សំបុត្រ</span>
                                        <input
                                            type="color"
                                            value={wedding.themeSettings?.paperColor || wedding.themeSettings?.m07CardColor || "#fbf9f5"}
                                            onChange={(event) => updatePaperColor(event.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                            aria-label="ជ្រើសរើសពណ៌សំបុត្រ"
                                        />
                                    </label>
                                )}
                                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground">ពណ៌ផ្ទាល់ខ្លួន</p>
                                        <button
                                            type="button"
                                            onClick={() => updateTheme({
                                                primaryColor: "",
                                                colorPalettePreset: "",
                                                paperColor: "",
                                            })}
                                            className="mt-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                        >
                                            ប្រើពណ៌ដើមរបស់ template
                                        </button>
                                    </div>
                                    <input
                                        type="color"
                                        value={wedding.themeSettings?.primaryColor || templateDefaultColor}
                                        onChange={(event) => updateTheme({
                                            primaryColor: event.target.value,
                                            colorPalettePreset: "",
                                            paperColor: "",
                                        })}
                                        className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                        aria-label="ជ្រើសរើសពណ៌ផ្ទាល់ខ្លួន"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {NEA_M05_COLOR_PRESETS.map((preset) => {
                                        const selected = wedding.themeSettings?.colorPalettePreset === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => updateTheme({
                                                    colorPalettePreset: preset.id,
                                                    primaryColor: preset.accent,
                                                    paperColor: preset.paperColor,
                                                })}
                                                className={clsx(
                                                    "flex min-h-12 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors",
                                                    selected
                                                        ? "border-primary bg-accent ring-1 ring-primary"
                                                        : "border-border bg-muted/40 hover:border-primary/40",
                                                )}
                                            >
                                                <span className="flex shrink-0 overflow-hidden rounded-full border border-black/10">
                                                    {preset.colors.map((color) => (
                                                        <span key={color} className="h-6 w-6" style={{ backgroundColor: color }} />
                                                    ))}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-xs font-bold text-foreground">{preset.name}</span>
                                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{preset.khmerName}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {isNeaM05 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {NEA_M05_COLOR_PRESETS.map((preset) => {
                                    const selected = selectedM05Color === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => {
                                                updateTheme({
                                                    colorPalettePreset: preset.id,
                                                    m05ColorPreset: preset.id,
                                                    primaryColor: preset.foil,
                                                    paperColor: preset.paperColor,
                                                    m05FoilShadeColor: preset.foilShade,
                                                    m05HighlightColor: preset.foilHighlight,
                                                    m05EnvelopeColor: preset.envelope,
                                                    m05CardColor: "",
                                                    m05SealColor: preset.foil,
                                                    m05SurfaceColor: preset.darkSurface,
                                                    m05PhotoTint: 22,
                                                });
                                            }}
                                            className={clsx(
                                                "flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                                                selected
                                                    ? "border-primary bg-accent ring-1 ring-primary"
                                                    : "border-border bg-muted/40 hover:border-primary/40"
                                            )}
                                        >
                                            <span className="flex shrink-0 overflow-hidden rounded-full border border-black/10">
                                                {preset.colors.map((color) => (
                                                    <span key={color} className="h-7 w-7" style={{ backgroundColor: color }} />
                                                ))}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-xs font-bold text-foreground">{preset.name}</span>
                                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{preset.khmerName}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => updateTheme({
                                        primaryColor: color,
                                        colorPalettePreset: "",
                                        paperColor: "",
                                    })}
                                    className={clsx(
                                        "aspect-square min-h-12 rounded-2xl border-2 transition-all hover:scale-105 shadow-sm",
                                        wedding.themeSettings?.primaryColor === color 
                                            ? "border-primary scale-110 ring-2 ring-primary/20 shadow-md"
                                            : "border-border"
                                    )}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                        )}
                        {supportsPaperCustomization && (
                        <div className="mt-5 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-300/15 dark:bg-amber-100/[0.03]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-foreground">ផ្ទៃក្រដាស</p>
                                    <p className="mt-1 text-xs text-muted-foreground">ក្ដារពណ៌នឹងជ្រើសពណ៌ក្រដាសដែលស៊ីគ្នាដោយស្វ័យប្រវត្តិ</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    {wedding.themeSettings?.colorPalettePreset && (
                                        <button
                                            type="button"
                                            onClick={resetRecommendedPaperColor}
                                            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                        >
                                            ពណ៌ណែនាំវិញ
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={resetPaperCustomization}
                                        className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
                                    >
                                        កំណត់ដើមវិញ
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {TEMPLATE_PAPER_TEXTURES.map((texture) => {
                                    const selected = (wedding.themeSettings?.paperTexture || "cream") === texture.id;
                                    return (
                                        <button
                                            key={texture.id}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => updateTheme("paperTexture", texture.id)}
                                            className={clsx(
                                                "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition",
                                                selected
                                                    ? "border-primary ring-1 ring-primary"
                                                    : "border-border hover:border-primary/40",
                                            )}
                                            style={{
                                                backgroundColor: wedding.themeSettings?.paperColor || getTemplateDefaultPaperColor(wedding.templateId),
                                                backgroundImage: texture.image === "none" ? undefined : `url("${texture.image}")`,
                                                backgroundBlendMode: "multiply",
                                                backgroundRepeat: "repeat",
                                                backgroundSize: "64px 64px",
                                            }}
                                        >
                                            <span className="rounded bg-card/90 px-2 py-0.5 text-xs font-bold text-foreground">{texture.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-3 py-2">
                                <span className="text-xs font-bold text-muted-foreground">ពណ៌ក្រដាស</span>
                                <input
                                    type="color"
                                    value={wedding.themeSettings?.paperColor || getTemplateDefaultPaperColor(wedding.templateId)}
                                    onChange={(event) => updatePaperColor(event.target.value)}
                                    className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                    aria-label="ជ្រើសរើសពណ៌ក្រដាស"
                                />
                            </label>
                        </div>
                        )}
                    </div>
                </AccordionItem>

                {/* 2. Payment & Registry */}
                <AccordionItem 
                    id="step5-payment"
                    hideWhenClosed
                    hideHeader
                    icon={CreditCard} 
                    title="KHQR"
                    subtitle="ស្រេចចិត្ត · បញ្ចូលរូប KHQR និងឈ្មោះអ្នកទទួលប្រាក់"
                    isOpen={selectedSectionId === 'payment'}
                    onClick={() => setActiveAccordion('payment')}
                >
                    <PaymentSection wedding={wedding} updateTheme={updateTheme} t={t} />
                </AccordionItem>

                {/* 3. Love Story */}
                <AccordionItem 
                    id="step5-story"
                    hideWhenClosed
                    hideHeader
                    icon={BookOpen} 
                    title="សារថ្លែងអំណរគុណ & រឿងរ៉ាវស្នេហា" 
                    subtitle="ស្រេចចិត្ត · សារស្វាគមន៍ និងពាក្យពេចន៍ជូនភ្ញៀវ"
                    isOpen={selectedSectionId === 'story'}
                    onClick={() => setActiveAccordion('story')}
                >
                    <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-bold text-foreground">រូបភាពរឿងរ៉ាវ (អាចរំលងបាន)</Label>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {storyImages?.filter(Boolean).length || 0}/{MAX_STORY_IMAGES} រូប
                            </span>
                        </div>
                        <input
                            ref={storyImageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (event) => {
                                const input = event.currentTarget;
                                const files = Array.from(input.files || []);
                                const remainingSlots = Math.max(
                                    0,
                                    MAX_STORY_IMAGES - storyMediaRef.current.images.filter(Boolean).length,
                                );
                                const acceptedFiles = files.slice(0, remainingSlots);
                                setStoryImageLimitNotice(
                                    files.length > acceptedFiles.length
                                        ? `អាចបញ្ចូលបានតែ ${remainingSlots} សន្លឹកទៀត ដើម្បីមិនឱ្យលើស ${MAX_STORY_IMAGES} សន្លឹក។`
                                        : null,
                                );
                                for (const file of acceptedFiles) {
                                    await uploadStoryImage(file);
                                }
                                input.value = "";
                            }}
                        />
                        {storyImages?.some(Boolean) ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {storyImages.map((image, index) => ({ image, index })).filter(({ image }) => Boolean(image)).map(({ image, index }) => (
                                    <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
                                        <img src={image} alt={`រូបរឿងរ៉ាវទី ${index + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-muted-foreground">{index + 1}. រូបភាព</span>
                                            <button
                                                type="button"
                                                onClick={() => void removeThemeAsset("storyImages", "storyImagePublicId", index)}
                                                disabled={storyImageUploading}
                                                aria-label={`លុបរូបភាពរឿងរ៉ាវទី ${index + 1}`}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="h-3 w-3" /> លុប
                                            </button>
                                        </div>
                                        <Label className="mt-2 block text-xs font-semibold text-muted-foreground">
                                            ចំណងជើងរូបភាព (អាចរំលងបាន)
                                        </Label>
                                        <input
                                            type="text"
                                            value={wedding.themeSettings?.storyImageCaptions?.[index] || ""}
                                            onChange={(event) => {
                                                const captions = [...storyMediaRef.current.captions];
                                                captions[index] = event.target.value;
                                                storyMediaRef.current = { ...storyMediaRef.current, captions };
                                                updateTheme({ storyImageCaptions: captions });
                                            }}
                                            maxLength={200}
                                            aria-label={`ចំណងជើងរូបភាពរឿងរ៉ាវទី ${index + 1} (អាចរំលងបាន)`}
                                            placeholder="សរសេរចំណងជើងរូបនេះ..."
                                            className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : storyImageSkipped ? (
                            <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-muted-foreground">
                                បានជ្រើសរើសមិនដាក់រូបក្នុងផ្នែក Story។
                            </p>
                        ) : (
                            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                                បន្ថែមរូបច្រើនសន្លឹក ដើម្បីចែករំលែកដំណើររឿងរបស់អ្នក។
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => storyImageInputRef.current?.click()}
                            disabled={storyImageUploading || (storyImages?.filter(Boolean).length || 0) >= MAX_STORY_IMAGES}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-wait disabled:opacity-60"
                        >
                            {storyImageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {storyImageUploading
                                ? `កំពុងបញ្ចូល ${storyImageProgress}%`
                                : (storyImages?.filter(Boolean).length || 0) >= MAX_STORY_IMAGES
                                    ? `បានដល់ចំនួនកំណត់ ${MAX_STORY_IMAGES} សន្លឹក`
                                    : storyImages?.length ? "បន្ថែមរូបភាព" : "បញ្ចូលរូបភាព"}
                        </button>
                        {!storyImages?.length && !storyImageSkipped && (
                            <button
                                type="button"
                                onClick={() => {
                                    storyMediaRef.current = { images: [], captions: [], publicIds: [] };
                                    updateTheme({ storyImages: [], storyImageCaptions: [], storyImagePublicIds: [], storyImagePublicId: "" });
                                }}
                                disabled={storyImageUploading}
                                className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                មិនចង់ដាក់រូប
                            </button>
                        )}
                        {storyImages?.some(Boolean) && (
                            <button
                                type="button"
                                onClick={() => {
                                    storyMediaRef.current = { images: [], captions: [], publicIds: [] };
                                    updateTheme({ storyImages: [], storyImageCaptions: [], storyImagePublicIds: [], storyImagePublicId: "" });
                                }}
                                disabled={storyImageUploading}
                                className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                លុបរូបទាំងអស់
                            </button>
                        )}
                        {storyImageError && (
                            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{storyImageError}</p>
                        )}
                        {storyImageLimitNotice && (
                            <p role="status" className="text-xs font-semibold text-amber-700 dark:text-amber-400">{storyImageLimitNotice}</p>
                        )}
                        {!storyImageSkipped && (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                អាចជ្រើសរើសរូបច្រើនក្នុងពេលតែមួយ ឬបន្ថែមពេលក្រោយបាន (មិនលើស {MAX_STORY_IMAGES} សន្លឹក)។ រូបនឹងបង្ហាញជាមួយផ្នែករឿងរ៉ាវ ហើយអ្នកអាចលុបរូបនីមួយៗបាន។
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">ដំណើររឿងផ្តើមស្នេហ៍ (អាចរំលងបាន)</Label>
                            <DebouncedTextarea 
                                className="min-h-[85px] rounded-xl border border-border bg-background p-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                                value={wedding.themeSettings?.loveStory || ""} 
                                onDebouncedChange={(val) => updateTheme('loveStory', val)} 
                                placeholder="ឧ. ដំណើររឿងសេចក្តីស្រឡាញ់របស់យើងខ្ញុំ បានចាប់ផ្តើមឡើងពីថ្ងៃដែល..." 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">សារស្វាគមន៍ (Welcome Message)</Label>
                            <DebouncedTextarea 
                                className="min-h-[85px] rounded-xl border border-border bg-background p-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                                value={wedding.themeSettings?.welcomeMessage || ""} 
                                onDebouncedChange={(val) => updateTheme('welcomeMessage', val)} 
                                placeholder="ឧ. សូមស្វាគមន៍មកកាន់ទំព័រមង្គលការរបស់យើងខ្ញុំ..." 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">សារថ្លែងអំណរគុណ (Thank You Message)</Label>
                            <DebouncedTextarea 
                                className="min-h-[85px] rounded-xl border border-border bg-background p-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                                value={wedding.themeSettings?.acknowledgment || ""} 
                                onDebouncedChange={(val) => updateTheme('acknowledgment', val)} 
                                placeholder="ឧ. សូមអរគុណយ៉ាងជ្រាលជ្រៅចំពោះវត្តមានដ៏ឧត្តុង្គឧត្តម..." 
                            />
                        </div>
                    </div>
                </AccordionItem>

                {/* 4. Social Media Links */}
                <AccordionItem 
                    id="step5-social"
                    hideWhenClosed
                    hideHeader
                    icon={MessageSquare} 
                    title="តំណភ្ជាប់បណ្តាញសង្គម"
                    subtitle="ស្រេចចិត្ត · Telegram និង Facebook សម្រាប់ភ្ញៀវទាក់ទង"
                    isOpen={selectedSectionId === 'social'}
                    onClick={() => setActiveAccordion('social')}
                >
                    <div className="space-y-4 pt-2">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            បញ្ចូលតំណ Facebook, Telegram ឬលេខទូរស័ព្ទ។ អ្នកអាចគ្រប់គ្រងការបង្ហាញវានៅផ្នែក «ការបង្ហាញ»។
                        </p>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center"><Facebook size={12} /></div>
                                <span>Facebook Link</span>
                            </Label>
                            <DebouncedInput 
                                placeholder="https://facebook.com/..." 
                                value={wedding.themeSettings?.facebookUrl || ""} 
                                onDebouncedChange={(val) => updateTheme('facebookUrl', val as string)} 
                                className="h-11 rounded-xl border border-border bg-background text-xs font-bold text-foreground px-3.5 shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <div className="w-5 h-5 rounded-md bg-sky-500 text-white flex items-center justify-center"><Send size={12} /></div>
                                <span>Telegram Link</span>
                            </Label>
                            <DebouncedInput 
                                placeholder="https://t.me/..." 
                                value={wedding.themeSettings?.telegramUrl || ""} 
                                onDebouncedChange={(val) => updateTheme('telegramUrl', val as string)} 
                                className="h-11 rounded-xl border border-border bg-background text-xs font-bold text-foreground px-3.5 shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white"><Phone size={12} /></div>
                                <span>លេខទូរស័ព្ទ</span>
                            </Label>
                            <DebouncedInput
                                placeholder="ឧ. 012 345 678"
                                value={wedding.themeSettings?.phoneNumber || ""}
                                onDebouncedChange={(val) => updateTheme('phoneNumber', val as string)}
                                className="h-11 rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground shadow-sm"
                            />
                        </div>
                    </div>
                </AccordionItem>

                {/* 5. Social Link Image */}
                <AccordionItem
                    id="step5-social-preview"
                    hideWhenClosed
                    hideHeader
                    icon={Share2}
                    title="រូបភ្ជាប់មួយ Link"
                    subtitle="ស្រេចចិត្ត · រូប និងព័ត៌មានពេលផ្ញើ Link"
                    isOpen={selectedSectionId === 'social-preview'}
                    onClick={() => setActiveAccordion('social-preview')}
                >
                    <div className="space-y-3 pt-2">
                        <button
                            type="button"
                            disabled={socialPreviewUploading}
                            onClick={() => socialInputRef.current?.click()}
                            className="flex min-h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-wait disabled:opacity-70"
                        >
                            {socialPreviewUploading ? (
                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> កំពុងបង្ហោះ {socialPreviewProgress}%</span>
                            ) : socialPreviewUrl ? (
                                <img src={socialPreviewUrl} alt="Social preview" className="h-full max-h-36 w-full object-cover" />
                            ) : (
                                <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> ជ្រើសរើសរូបភ្ជាប់ Link</span>
                            )}
                        </button>
                        <input type="file" accept="image/*" className="hidden" ref={socialInputRef} onChange={onSocialFileChange} />
                        {socialPreviewError && <p role="alert" className="text-xs font-medium text-red-600">{socialPreviewError}</p>}
                        {socialPreviewAspectWarning && (
                            <p role="status" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                {socialPreviewAspectWarning}
                            </p>
                        )}
                        {socialPreviewUrl?.startsWith("data:") && (
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                រូបចាស់នេះមិនអាចបង្ហាញក្នុង Link preview បានទេ។ សូមជ្រើសរើសរូបម្តងទៀត។
                            </p>
                        )}
                        {socialPreviewUrl && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSocialPreviewUrl(null);
                                    void removeThemeAsset("socialPreviewImage", "socialPreviewImagePublicId");
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> លុបរូប Link
                            </button>
                        )}
                        <p className="text-xs text-muted-foreground">រូបនេះនឹងបង្ហាញពេលផ្ញើ Link ទៅ Telegram, Facebook ឬកម្មវិធីផ្សេងៗ។</p>
                        <DebouncedInput
                            placeholder="ចំណងជើងពេលផ្ញើ Link"
                            value={wedding.themeSettings?.customLabels?.invite_title || ""}
                            onDebouncedChange={(val) => updateLabel('invite_title', val as string)}
                            className="h-11 rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground shadow-sm"
                        />
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                <Share2 className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-bold text-muted-foreground">Preview ពេលផ្ញើ Link</span>
                            </div>
                            <img
                                src={socialPreviewImage}
                                alt="Link preview"
                                className="aspect-[1.91/1] w-full object-cover"
                            />
                            <div className="space-y-1 p-3">
                                <p className="line-clamp-2 text-sm font-bold text-foreground">{socialPreviewTitle}</p>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">moneoez.com</p>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* 6. Display */}
                <AccordionItem 
                    id="step5-display"
                    hideWhenClosed
                    hideHeader
                    icon={Eye} 
                    title="ការបង្ហាញ"
                    subtitle="ស្រេចចិត្ត · បើក ឬបិទផ្នែកដែលចង់បង្ហាញលើធៀប"
                    isOpen={selectedSectionId === 'display'}
                    onClick={() => setActiveAccordion('display')}
                >
                    <div className="space-y-5 pt-2">
                        {/* Visibility Toggles */}
                        <div className="space-y-2.5">
                            <Label className="text-xs font-bold text-foreground block">បើក/បិទផ្នែកលើធៀប (Section Visibility)</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {visibilityOptions
                                    .filter(({ section }) => supportedVisibilityControls.includes(section))
                                    .map(({ key, label, icon: Icon }) => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                                        <div className="flex items-center gap-2.5">
                                            <Icon size={15} className="text-primary" />
                                            <span className="text-xs font-bold text-foreground">{label}</span>
                                        </div>
                                        <Switch 
                                            id={key} 
                                            className="data-[state=checked]:bg-primary"
                                            checked={wedding.themeSettings?.visibility?.[key] !== false}
                                            onCheckedChange={(checked) => { 
                                                const newVisibility = { ...(wedding.themeSettings?.visibility || {}), [key]: checked }; 
                                                updateTheme('visibility', newVisibility); 
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-2.5">
                                    <Share2 size={15} className="text-primary" />
                                    <span className="text-xs font-bold text-foreground">តំណ Facebook, Telegram និងលេខទូរស័ព្ទ</span>
                                </div>
                                <Switch
                                    id="showSocialLinks"
                                    className="data-[state=checked]:bg-primary"
                                    checked={wedding.themeSettings?.showSocialLinks !== false}
                                    onCheckedChange={(checked) => updateTheme("showSocialLinks", checked)}
                                    aria-label="បង្ហាញតំណ Social លើធៀប"
                                />
                            </div>
                        </div>

                    </div>
                </AccordionItem>

                {/* 6. Custom Labels */}
                <AccordionItem 
                    id="step5-labels"
                    hideWhenClosed
                    hideHeader
                    icon={Type} 
                    title="អត្ថបទលើធៀប"
                    subtitle="រចនាប័ទ្ម · ប្តូរចំណងជើង និងពាក្យដែលបង្ហាញលើធៀប"
                    isOpen={selectedSectionId === 'labels'}
                    onClick={() => setActiveAccordion('labels')}
                >
                    <LabelsSection wedding={wedding} updateTheme={updateTheme} updateLabel={updateLabel} t={t} />
                </AccordionItem>
            </div>

        </div>
    );
};

export default React.memo(Step5Extra);
