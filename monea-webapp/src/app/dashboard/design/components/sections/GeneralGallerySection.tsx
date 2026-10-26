import React from "react";
import { Label } from "@/components/ui/label";
import { ImageIcon, LayoutGrid, SlidersHorizontal, Film, Plus, Trash2, Loader2, Scissors, ArrowDown, ArrowUp, Replace } from "lucide-react";
import clsx from "clsx";
import { PhotoImage } from "@/components/templates/shared/PhotoImage";
import { getWeddingPhotoLayout } from "@/lib/wedding-photo-layout";
import ImageCropperModal from "@/components/ui/image-cropper-modal";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

interface GeneralGallerySectionProps {
    wedding: any;
    inputRef: React.RefObject<HTMLInputElement>;
    uploading: boolean;
    progress: number;
    uploadStatus: "idle" | "uploading" | "success" | "error";
    uploadError: string | null;
    failedFileCount: number;
    onUpload: (files: FileList | File[]) => Promise<void>;
    onRetry: () => Promise<void>;
    onReplacePhoto: (index: number, url: string, publicId?: string) => Promise<boolean>;
    onMovePhoto: (fromIndex: number, toIndex: number) => Promise<boolean>;
    onMediaOperationChange: (busy: boolean) => void;
    removeGalleryItem: (index: number) => void;
    updateTheme: (key: string, value: any, autoSave?: boolean) => void;
}

export const GeneralGallerySection: React.FC<GeneralGallerySectionProps> = ({
    wedding,
    inputRef,
    uploading,
    progress,
    uploadStatus,
    uploadError,
    failedFileCount,
    onUpload,
    onRetry,
    onReplacePhoto,
    onMovePhoto,
    onMediaOperationChange,
    removeGalleryItem,
    updateTheme,
}) => {
    const [cropIndex, setCropIndex] = React.useState<number | null>(null);
    const [cropFeedback, setCropFeedback] = React.useState<{ message: string; error: boolean } | null>(null);
    const [reorderFeedback, setReorderFeedback] = React.useState<string | null>(null);
    const [isReordering, setIsReordering] = React.useState(false);
    const cropTargetIndex = React.useRef<number | null>(null);
    const slotTargetIndex = React.useRef<number | null>(null);
    const slotInputRef = React.useRef<HTMLInputElement>(null);
    const [slotUploadFeedback, setSlotUploadFeedback] = React.useState<string | null>(null);
    const photoLayout = getWeddingPhotoLayout(wedding.templateId);
    const cropUploader = useCloudinaryUpload({
        folder: wedding.id || "",
        resourceType: "image",
        onSuccess: async (url, publicId) => {
            const index = cropTargetIndex.current;
            if (index === null) return;
            const saved = await onReplacePhoto(index, url, publicId);
            setCropFeedback(saved
                ? { message: "បានកាត់ និងរក្សារូបនេះរួចរាល់។", error: false }
                : { message: "រូបបាន upload ប៉ុន្តែរក្សាទុកមិនបាន។ សូមពិនិត្យការតភ្ជាប់ ហើយសាក crop ម្ដងទៀត។", error: true });
        },
        onError: (error) => console.error("Cropped photo upload failed:", error),
    });
    const slotUploader = useCloudinaryUpload({
        folder: wedding.id || "",
        resourceType: "image",
        onSuccess: async (url, publicId) => {
            const index = slotTargetIndex.current;
            if (index === null) return;
            const saved = await onReplacePhoto(index, url, publicId);
            setSlotUploadFeedback(saved
                ? "បានរក្សាទុករូបនៅផ្នែកដែលបានជ្រើសរើស។"
                : "រូបបានផ្ទុកឡើង ប៉ុន្តែរក្សាទុកមិនបាន។ សូមសាកម្ដងទៀត។");
        },
        onError: (error) => {
            console.error("Section photo upload failed:", error);
            setSlotUploadFeedback(error instanceof Error ? error.message : "មិនអាចដាក់រូបក្នុងផ្នែកនេះបានទេ។");
        },
    });
    const isBusy = uploading || cropUploader.uploading || slotUploader.uploading || isReordering;
    const galleryItems = wedding.galleryItems || [];
    const filledSectionCount = photoLayout.slots.reduce(
        (count, slot) => count + (galleryItems[slot.index]?.url?.trim() ? 1 : 0),
        0,
    );
    const photos = galleryItems
        .map((item: any, index: number) => ({ item, index }))
        .filter(({ item }: { item: any }) =>
            item && typeof item.url === "string" && item.url.trim()
            && item.type?.toUpperCase() !== "VIDEO"
            && item.type?.toUpperCase() !== "CERTIFICATE"
        )
        .filter(({ index }: { index: number }) => index >= photoLayout.slots.length
        );

    React.useEffect(() => {
        onMediaOperationChange(cropUploader.uploading || slotUploader.uploading || isReordering);
    }, [cropUploader.uploading, isReordering, onMediaOperationChange, slotUploader.uploading]);

    const selectedPhoto = cropIndex === null ? null : galleryItems[cropIndex];
    const selectedSlot = cropIndex === null ? undefined : photoLayout.slots[cropIndex];
    const selectedTitle = selectedSlot?.title
        || (cropIndex === null ? "" : `រូបបន្ថែម ${cropIndex - photoLayout.slots.length + 1}`);
    const movePhoto = async (fromIndex: number, toIndex: number) => {
        setIsReordering(true);
        setReorderFeedback(null);
        try {
            const saved = await onMovePhoto(fromIndex, toIndex);
            setReorderFeedback(saved
                ? "បានប្ដូរលំដាប់រូប និងរក្សាទុករួចរាល់។"
                : "មិនអាចរក្សាទុកលំដាប់រូបបានទេ។ សូមសាកម្ដងទៀត។");
        } catch (error) {
            console.error("Reordering gallery photo failed:", error);
            setReorderFeedback(error instanceof Error ? error.message : "មិនអាចប្ដូរលំដាប់រូបបានទេ។");
        } finally {
            setIsReordering(false);
        }
    };

    const handleCropComplete = async (croppedImage: Blob) => {
        if (cropIndex === null) return;
        cropTargetIndex.current = cropIndex;
        setCropFeedback(null);
        try {
            await cropUploader.uploadFile(new File(
                [croppedImage],
                `cropped-photo-${Date.now()}.jpg`,
                { type: croppedImage.type || "image/jpeg" },
            ));
        } finally {
            cropTargetIndex.current = null;
        }
    };
    const uploadSlotPhoto = async (file: File) => {
        if (file.type && !file.type.startsWith("image/")) {
            setSlotUploadFeedback("សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ។");
            return;
        }
        setSlotUploadFeedback(null);
        await slotUploader.uploadFile(file);
        slotTargetIndex.current = null;
    };

    return (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-3 font-kantumruy sm:space-y-5 sm:p-5">
            <div className="space-y-1">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    ជ្រើសរើសរូបតាមផ្នែក
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {filledSectionCount}/{photoLayout.slots.length} ផ្នែកមានរូប · ចុចប៊ូតុងដើម្បីបន្ថែម ឬប្ដូររូប។
                </p>
            </div>

            <input
                ref={slotInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadSlotPhoto(file);
                    event.target.value = "";
                }}
            />
            {slotUploadFeedback && (
                <p role={slotUploadFeedback.startsWith("បាន") ? "status" : "alert"} className={clsx(
                    "text-xs font-bold",
                    slotUploadFeedback.startsWith("បាន")
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300",
                )}>
                    {slotUploadFeedback}
                </p>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                {photoLayout.slots.map((slot) => {
                    const item = galleryItems[slot.index];
                    const hasPhoto = Boolean(item?.url?.trim());
                    return (
                        <div key={slot.key} title={slot.locationHint} className="flex min-w-0 overflow-hidden rounded-xl border border-border bg-background sm:flex-col">
                            <div className="h-28 w-24 shrink-0 bg-muted sm:h-auto sm:w-full" style={{ aspectRatio: String(slot.aspectRatio) }}>
                                {hasPhoto ? (
                                    <PhotoImage
                                        src={item.url}
                                        alt={slot.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
                                        <ImageIcon className="h-6 w-6 opacity-50" />
                                        <span className="text-[10px] leading-tight">មិនទាន់មានរូប</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-2.5 sm:flex-none">
                                <div className="space-y-1">
                                    <p className="line-clamp-2 text-xs font-bold leading-relaxed text-foreground">{slot.title}</p>
                                    <p className={clsx("text-[11px] font-semibold", hasPhoto ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
                                        {hasPhoto ? "បានដាក់រូបរួច" : "មិនទាន់មានរូប"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                        slotTargetIndex.current = slot.index;
                                        setSlotUploadFeedback(null);
                                        slotInputRef.current?.click();
                                    }}
                                    className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-primary/25 bg-primary/5 px-2 text-xs font-bold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                >
                                    {hasPhoto ? <Replace size={14} /> : <Plus size={14} />}
                                    {hasPhoto ? "ប្ដូររូប" : "ដាក់រូប"}
                                </button>
                                {hasPhoto && (
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => {
                                                setCropFeedback(null);
                                                setCropIndex(slot.index);
                                            }}
                                            className="flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                        >
                                            <Scissors size={13} />
                                            កាត់
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => removeGalleryItem(slot.index)}
                                            className="min-h-10 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:hover:bg-rose-500/10"
                                        >
                                            លុបរូប
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {slotUploader.uploading && (
                <p role="status" className="text-xs font-bold text-primary">
                    កំពុងដាក់រូបក្នុងផ្នែកដែលបានជ្រើសរើស... {slotUploader.progress}%
                </p>
            )}

            <div className="space-y-1 border-t border-border pt-4">
                <h5 className="text-xs font-bold text-foreground">រូបវិចិត្រសាលបន្ថែម (ស្រេចចិត្ត)</h5>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    រូបដែលដាក់នៅទីនេះចូលកម្រងរូបតែប៉ុណ្ណោះ មិនត្រូវបានចាត់ទៅផ្នែកខាងលើដោយស្វ័យប្រវត្តិទេ។
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    if (event.target.files) void onUpload(event.target.files);
                    event.target.value = "";
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
                className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 p-4 text-center transition-colors hover:bg-accent/70 disabled:cursor-wait disabled:opacity-70"
            >
                {isBusy ? (
                    <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <span className="text-sm font-bold text-foreground">
                            {cropUploader.uploading ? "កំពុង upload រូបដែលបានកាត់..." : "កំពុងដាក់រូប..."} {cropUploader.uploading ? cropUploader.progress : progress}%
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Plus size={22} />
                        </span>
                        <span className="text-sm font-bold text-foreground">ជ្រើសរើសរូបភាព</span>
                        <span className="text-xs text-muted-foreground">អាចជ្រើសរើសច្រើនសន្លឹកក្នុងពេលតែមួយ</span>
                    </>
                )}
            </button>

            {uploadStatus === "success" && (
                <p role="status" className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    រូបវិចិត្រសាលត្រូវបានបន្ថែម និងរក្សាទុករួចរាល់។
                </p>
            )}
            {uploadStatus === "error" && (
                <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    <span>{uploadError || "មិនអាចដាក់ ឬរក្សាទុករូបបានទេ។ សូមសាកល្បងម្ដងទៀត។"}</span>
                    {failedFileCount > 0 && (
                        <button
                            type="button"
                            onClick={() => void onRetry()}
                            disabled={uploading}
                            className="min-h-9 rounded-lg border border-rose-300 px-3 py-1.5 disabled:opacity-50"
                        >
                            សាកដាក់រូបដែលបរាជ័យម្ដងទៀត
                        </button>
                    )}
                </div>
            )}
            {(cropUploader.uploading || cropFeedback) && (
                <p role={cropFeedback?.error ? "alert" : "status"} className={clsx(
                    "text-xs font-bold",
                    cropFeedback?.error ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300",
                )}>
                    {cropUploader.uploading
                        ? `កំពុង upload រូបដែលបានកាត់... ${cropUploader.progress}%`
                        : cropFeedback?.message}
                </p>
            )}
            {cropUploader.error && (
                <p role="alert" className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {cropUploader.error}
                </p>
            )}
            {reorderFeedback && (
                <p role={reorderFeedback.startsWith("បាន") ? "status" : "alert"} className={clsx(
                    "text-xs font-bold",
                    reorderFeedback.startsWith("បាន")
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300",
                )}>
                    {reorderFeedback}
                </p>
            )}

            {photos.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                                    <p className="text-xs font-bold text-foreground">រូបវិចិត្រសាលបន្ថែម</p>
                                    <p className="text-xs text-muted-foreground">រូបទាំងនេះបង្ហាញក្នុងកម្រងរូប មិនជំនួសរូបផ្នែកខាងលើទេ</p>
                        </div>
                        <span className="text-xs font-bold text-primary">{photos.length} រូប</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {photos.map(({ item, index }: { item: any; index: number }) => {
                            const slot = photoLayout.slots[index];
                            const title = slot?.title || `រូបបន្ថែម ${index - photoLayout.slots.length + 1}`;
                            const photoPosition = photos.findIndex((photo: { index: number }) => photo.index === index);
                            const previousPhoto = photos[photoPosition - 1];
                            const nextPhoto = photos[photoPosition + 1];
                            const previousSlotIsEmpty = index > 0
                                && index < photoLayout.slots.length
                                && !galleryItems[index - 1]?.url
                                && galleryItems[index - 1]?.type?.toUpperCase() !== "VIDEO"
                                && galleryItems[index - 1]?.type?.toUpperCase() !== "CERTIFICATE";
                            const nextSlotIsEmpty = index + 1 < photoLayout.slots.length
                                && !galleryItems[index + 1]?.url
                                && galleryItems[index + 1]?.type?.toUpperCase() !== "VIDEO"
                                && galleryItems[index + 1]?.type?.toUpperCase() !== "CERTIFICATE";
                            const moveUpTarget = previousPhoto?.index ?? (previousSlotIsEmpty ? index - 1 : null);
                            const moveDownTarget = nextPhoto?.index ?? (nextSlotIsEmpty ? index + 1 : null);
                            return (
                                <div key={item.publicId || `${item.url}-${index}`} className="relative overflow-hidden rounded-xl border border-border bg-card">
                                    <div className="aspect-[4/3] bg-muted">
                                        <PhotoImage src={item.url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex min-h-9 items-center justify-between gap-1 px-2">
                                        <span className="truncate text-xs font-bold text-foreground">{title}</span>
                                        <div className="flex shrink-0 items-center">
                                            <button
                                                type="button"
                                                onClick={() => moveUpTarget !== null && void movePhoto(index, moveUpTarget)}
                                                aria-label={`ផ្លាស់ទី ${title} ឡើងលើ`}
                                                title="ផ្លាស់ទីឡើងលើ"
                                                disabled={isBusy || moveUpTarget === null}
                                                className="flex h-8 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveDownTarget !== null && void movePhoto(index, moveDownTarget)}
                                                aria-label={`ផ្លាស់ទី ${title} ចុះក្រោម`}
                                                title="ផ្លាស់ទីចុះក្រោម"
                                                disabled={isBusy || moveDownTarget === null}
                                                className="flex h-8 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCropFeedback(null);
                                                    setCropIndex(index);
                                                }}
                                                aria-label={`កាត់តម្រឹម ${title}`}
                                                title={`កាត់តម្រឹម ${title}`}
                                                disabled={isBusy}
                                                className="flex h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-primary hover:bg-accent disabled:opacity-50"
                                            >
                                                <Scissors size={14} />
                                                <span className="text-xs font-bold">កាត់</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryItem(index)}
                                                aria-label={`លុប ${title}`}
                                                disabled={isBusy}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-3 border-t border-border pt-4">
                <Label className="block text-xs font-bold text-foreground">របៀបបង្ហាញកម្រងរូបភាព</Label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: "masonry", label: "ក្រឡារូប", hint: "រូបធំតូចលាយគ្នា", icon: LayoutGrid },
                        { id: "slider", label: "រំកិលមើល", hint: "មើលម្ដងមួយ", icon: SlidersHorizontal },
                        { id: "polaroid", label: "ស៊ុមស", hint: "ស្ទីល Polaroid", icon: Film },
                    ].map((style) => {
                        const isSelected = wedding.themeSettings?.galleryStyle === style.id
                            || (style.id === "masonry" && !wedding.themeSettings?.galleryStyle);
                        return (
                            <button
                                key={style.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => updateTheme("galleryStyle", style.id, true)}
                                className={clsx(
                                    "flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-colors",
                                    isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                )}
                            >
                                <style.icon size={16} />
                                <span className="text-xs font-bold">{style.label}</span>
                                <span className="text-xs">{style.hint}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <ImageCropperModal
                isOpen={cropIndex !== null}
                onClose={() => setCropIndex(null)}
                imageSrc={selectedPhoto?.url || null}
                contextLabel={selectedTitle}
                title="កាត់តម្រឹមរូប"
                aspectRatio={selectedSlot?.aspectRatio ?? 1}
                onCropComplete={(croppedImage) => void handleCropComplete(croppedImage)}
            />
        </section>
    );
};
