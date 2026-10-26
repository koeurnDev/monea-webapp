import { getTemplateComponent } from "./index";
import type { WeddingData } from "./types";
import { normalizeWeddingForTemplate } from "./shared/template-settings";
import { isDemoPhoto } from "./shared/weddingPhotos";

interface TemplateRendererProps {
    wedding: WeddingData;
    guestName?: string;
    templateId?: string | null;
    uploadedImagesOnly?: boolean;
}

export function TemplateRenderer({
    wedding,
    guestName,
    templateId = wedding.templateId,
    uploadedImagesOnly = false,
}: TemplateRendererProps) {
    const weddingForTemplate = {
        ...wedding,
        templateId: templateId ?? wedding.templateId,
        previewUploadedImagesOnly: uploadedImagesOnly,
        groomPhoto: isDemoPhoto(wedding.groomPhoto) ? undefined : wedding.groomPhoto,
        bridePhoto: isDemoPhoto(wedding.bridePhoto) ? undefined : wedding.bridePhoto,
        galleryItems: wedding.galleryItems?.filter((item) => item && !isDemoPhoto(item.url)) ?? [],
        themeSettings: wedding.themeSettings
            ? {
                ...wedding.themeSettings,
                heroImage: isDemoPhoto(wedding.themeSettings.heroImage) ? undefined : wedding.themeSettings.heroImage,
                coverImageUrl: isDemoPhoto(wedding.themeSettings.coverImageUrl) ? undefined : wedding.themeSettings.coverImageUrl,
                storyImages: wedding.themeSettings.storyImages?.filter((url) => url && !isDemoPhoto(url)),
                galleryItems: wedding.themeSettings.galleryItems?.filter((item) => item && !isDemoPhoto(item.url)),
            }
            : wedding.themeSettings,
    };
    const normalized = normalizeWeddingForTemplate({
        ...weddingForTemplate,
    });
    const Template = getTemplateComponent(templateId);
    const fontStyle = wedding.themeSettings?.fontStyle;
    const fontClass = fontStyle === "suwannaphum"
        ? "template-font-suwannaphum"
        : fontStyle === "battambang"
            ? "template-font-battambang"
            : fontStyle === "preahvihear"
                ? "template-font-preahvihear"
                : "template-font-default";
    return (
        <div className={`template-responsive-canvas ${fontClass} flex min-h-[100dvh] w-full min-w-0 justify-center overflow-x-clip bg-[#e8e8e8]`}>
            <div className="relative min-h-[100dvh] w-full min-w-0 max-w-[430px] bg-white shadow-2xl">
                <Template
                    key={templateId || "blossom-romance"}
                    wedding={normalized.wedding}
                    config={normalized.config}
                    guestName={guestName}
                />
            </div>
        </div>
    );
}
