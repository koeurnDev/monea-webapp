export interface BankAccount {
    bankName: string;
    accountName: string;
    accountNumber: string;
    qrUrl?: string | null;
    side?: string;
}

export interface GiftRegistryItem {
    id: string;
    type: string; // 'ABA' | 'ACLEDA' | 'WING' | 'CASH'
    bankName?: string;
    accountName: string;
    accountNumber: string;
    qrCodeUrl?: string;
}

export type TemplateSection =
    | "hero"
    | "gallery"
    | "story"
    | "timeline"
    | "guestbook"
    | "map"
    | "gift"
    | "eventInfo"
    | "contact";

export type VisibilityKey =
    | "showHero"
    | "showGallery"
    | "showStory"
    | "showTimeline"
    | "showGuestbook"
    | "showMap"
    | "showGift"
    | "showEventInfo"
    | "showContact";

export type SectionVisibility = Partial<Record<VisibilityKey, boolean>>;

export interface TemplateLabels {
    scheduleTitle?: string;
    storyTitle?: string;
    [label: string]: string | undefined;
}

export interface LegacyTemplateLabels extends TemplateLabels {
    schedule_title?: string;
}

export interface ResolvedTemplateConfig {
    visibility: SectionVisibility;
    labels: TemplateLabels;
}

export interface WeddingData {
    id: string;
    groomName: string;
    brideName: string;
    groomFather?: string;
    groomMother?: string;
    brideFather?: string;
    brideMother?: string;
    groomPhoto?: string;
    bridePhoto?: string;
    date: Date | string;
    time?: string | null;
    location: string | null;
    guestName?: string;
    mapUrl?: string;
    locationName?: string;
    galleryItems: { url: string; publicId?: string; type: string }[];
    activities: { time: string; description: string | null; title: string, icon?: string | null, publicId?: string | null, order?: number }[];
    themeSettings?: {
        primaryColor?: string;
        colorPalettePreset?: string;
        paperTexture?: string;
        paperColor?: string;
        coverImageUrl?: string;
        loveStory?: string;
        nameFont?: string;
        nameSeparator?: string;
        m05TitleFont?: string;
        m05NameFont?: string;
        emeraldCardColor?: string;
        m07CardColor?: string;
        m05ColorPreset?: string;
        m05EnvelopeColor?: string;
        m05CardColor?: string;
        m05SealColor?: string;
        m05SurfaceColor?: string;
        m05HighlightColor?: string;
        m05FoilShadeColor?: string;
        m05PhotoTint?: number;
        customTypographyUrl?: string;
        customTypographyPublicId?: string;
        customTypographyScale?: number;
        customTypographyY?: number;
        customTypographyDropShadow?: string;
        customMonogramUrl?: string;
        customMonogramPublicId?: string;
        customMonogramScale?: number;
        customMonogramY?: number;
        customMonogramDropShadow?: string;
        musicUrl?: string;
        musicUrlPublicId?: string;
        mapLink?: string;
        videoUrl?: string;
        heroImage?: string;
        heroImagePublicId?: string;
        heroImagePosition?: string;
        heroImageX?: string;
        heroImageScale?: number;
        heroImageBrightness?: number;
        heroImageContrast?: number;
        groomImagePosition?: string;
        groomImageX?: string;
        groomImageY?: string;
        groomImageScale?: number;
        brideImagePosition?: string;
        brideImageX?: string;
        brideImageY?: string;
        brideImageScale?: number;
        englishImageX?: string;
        englishImagePosition?: string;
        englishImageScale?: number;
        bannerImageX?: string;
        bannerImagePosition?: string;
        bannerImageScale?: number;
        signatureImageScale?: number;
        editorialPan1X?: string; editorialPan1Y?: string; editorialPan1Scale?: number;
        editorialPan2X?: string; editorialPan2Y?: string; editorialPan2Scale?: number;
        editorialPan3X?: string; editorialPan3Y?: string; editorialPan3Scale?: number;
        editorialPan4X?: string; editorialPan4Y?: string; editorialPan4Scale?: number;
        signaturePan1X?: string; signaturePan1Y?: string; signaturePan1Scale?: number;
        signaturePan2X?: string; signaturePan2Y?: string; signaturePan2Scale?: number;
        signaturePan3X?: string; signaturePan3Y?: string; signaturePan3Scale?: number;
        signaturePan4X?: string; signaturePan4Y?: string; signaturePan4Scale?: number;
        signaturePan5X?: string; signaturePan5Y?: string; signaturePan5Scale?: number;
        signaturePan6X?: string; signaturePan6Y?: string; signaturePan6Scale?: number;
        hubImageX?: string; hubImageY?: string;
        mapImageX?: string; mapImageY?: string;
        preWeddingPan1X?: string; preWeddingPan1Y?: string;
        preWeddingPan2X?: string; preWeddingPan2Y?: string;
        preWeddingPan3X?: string; preWeddingPan3Y?: string;
        preWeddingPan4X?: string; preWeddingPan4Y?: string;
        preWeddingPan5X?: string; preWeddingPan5Y?: string;
        preWeddingPan6X?: string; preWeddingPan6Y?: string;
        galleryImageX?: string; galleryImageY?: string;
        dynamicPrimaryColor?: string;
        dynamicSecondaryColor?: string;
        galleryStyle?: 'masonry' | 'slider' | 'polaroid';
        facebookUrl?: string;
        telegramUrl?: string;
        phoneNumber?: string;
        showSocialLinks?: boolean;
        paymentQrUrl?: string;
        lunarDate?: string;
        acknowledgment?: string;
        groomVow?: string;
        brideVow?: string;
        mainQuote?: string;
        bankAccounts?: BankAccount[];
        groomStory?: string;
        brideStory?: string;
        story?: {
            kh?: string;
            km?: string;
            en?: string;
            [key: string]: string | undefined;
        };
        customLabels?: LegacyTemplateLabels;
        storyImages?: string[];
        storyImageCaptions?: string[];
        storyImagePublicId?: string;
        storyImagePublicIds?: string[];
        welcomeMessage?: string;
        invitationText?: string;
        visibility?: SectionVisibility & { showSchedule?: boolean };
        hiddenPhotoSlots?: number[];
        hiddenGalleryPhotoKeys?: string[];
        galleryItems?: { url: string; publicId?: string; type: string }[];
        fontStyle?: string;
        shareImage?: string;
        parents?: {
            groomFather?: string;
            groomMother?: string;
            brideFather?: string;
            brideMother?: string;
            groomPhone?: string;
            bridePhone?: string;
        };
        editorialText1?: string;
        editorialText2?: string;
        editorialText3?: string;
        giftRegistry?: GiftRegistryItem[];
        locationQrUrl?: string;
        locationQrPublicId?: string;
        passcode?: string;
        socialPreviewImage?: string;
        socialPreviewImagePublicId?: string;
    } | null;
    templateId?: string | null;
    eventType?: 'wedding' | 'anniversary';
    packageType?: string | null;
    paymentStatus?: string | null;
    guestId?: string; // Unique ID for QR check-in
    previewUploadedImagesOnly?: boolean;
}

export interface TemplateProps {
    wedding: WeddingData;
    config: ResolvedTemplateConfig;
    guestName?: string;
}
