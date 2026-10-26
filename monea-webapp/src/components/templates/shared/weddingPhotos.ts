import type { WeddingData } from "../types";
import {
    getWeddingPhotoLayout,
    getWeddingPhotoSlotIndex,
    type WeddingPhotoSlotKey,
} from "../../../lib/wedding-photo-layout.ts";

const DEMO_PHOTO_FILES = new Set([
    "621811254_905398285378636_5240747682765358044_n.jpg",
    "621811002_905396558712142_5126771807004187076_n.jpg",
    "621811942_905392918712506_8600818650624857202_n.jpg",
    "621813168_905393265379138_2356104923368506186_n.jpg",
    "622279784_905392782045853_1189842078802821714_n.jpg",
    "622374686_905392995379165_1001573724208229331_n.jpg",
    "622582548_905399002045231_4147705888928073222_n.jpg",
    "622629866_905398512045280_817022291532741601_n.jpg",
]);

export const isDemoPhoto = (url?: string) => {
    if (!url) return false;
    const fileName = url.split(/[?#]/, 1)[0].split("/").pop();
    return Boolean(fileName && DEMO_PHOTO_FILES.has(fileName));
};

export const getWeddingPhotos = (wedding: WeddingData) => {
    return (wedding.galleryItems || []).filter((item) => {
        if (!item || typeof item !== "object") return false;
        const url = typeof item.url === "string" ? item.url.trim() : "";
        if (!url) return false;
        if (item.type?.toUpperCase() === "VIDEO") return false;
        return !isDemoPhoto(url);
    });
};

export const getWeddingGeneralPhotos = (wedding: WeddingData) => {
    return (wedding.galleryItems || [])
        .slice(getWeddingPhotoLayout(wedding.templateId).slots.length)
        .filter((item) => {
            if (!item || typeof item !== "object") return false;
            if (item.type?.toUpperCase() === "VIDEO" || item.type?.toUpperCase() === "CERTIFICATE") return false;
            return Boolean(typeof item.url === "string" && item.url.trim() && !isDemoPhoto(item.url));
        })
        .map((item) => item.url.trim());
};

export const getWeddingPhotoAtSlot = (wedding: WeddingData, key: WeddingPhotoSlotKey) => {
    const index = getWeddingPhotoSlotIndex(wedding.templateId, key);
    if (index === undefined) return undefined;
    const item = wedding.galleryItems?.[index];
    if (!item || typeof item !== "object") return undefined;
    const url = typeof item.url === "string" ? item.url.trim() : "";
    if (!url) return undefined;
    if (item.type?.toUpperCase() === "VIDEO" || isDemoPhoto(url)) return undefined;
    return item;
};

export const getWeddingSectionPhoto = (wedding: WeddingData, key: WeddingPhotoSlotKey) => {
    const index = getWeddingPhotoSlotIndex(wedding.templateId, key);
    if (index === undefined) return undefined;

    const layout = getWeddingPhotoLayout(wedding.templateId);
    const secondaryFeaturedKey = layout.featuredSlotKeys.find((featuredKey) => featuredKey !== "cover");

    return getWeddingPhotoAtSlot(wedding, key)
        || (secondaryFeaturedKey && key !== secondaryFeaturedKey
            ? getWeddingPhotoAtSlot(wedding, secondaryFeaturedKey)
            : undefined)
        || (key !== "cover" ? getWeddingPhotoAtSlot(wedding, "cover") : undefined);
};

export type ConfiguredPaymentAccount = {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    qrUrl?: string | null;
    qrCodeUrl?: string | null;
};

export const getConfiguredPaymentAccounts = (accounts: unknown): ConfiguredPaymentAccount[] => {
    if (!Array.isArray(accounts)) return [];

    return accounts.flatMap((account): ConfiguredPaymentAccount[] => {
        if (!account || typeof account !== "object") return [];
        const candidate = account as ConfiguredPaymentAccount;
        const accountNumber = candidate.accountNumber?.trim();
        const qrUrl = candidate.qrUrl?.trim() || candidate.qrCodeUrl?.trim();
        const qrPath = qrUrl?.split(/[?#]/, 1)[0];
        const hasRealAccountNumber = Boolean(accountNumber && accountNumber !== "001 234 567");
        const hasRealQr = Boolean(qrPath && !qrPath.endsWith("/images/qr.webp"));
        if (!hasRealAccountNumber && !hasRealQr) return [];

        const sanitizedAccount: ConfiguredPaymentAccount = {
            ...candidate,
            accountName: candidate.accountName?.trim() === "KAB SIN & MEAS CHANMEANA" ? undefined : candidate.accountName,
            accountNumber: hasRealAccountNumber ? accountNumber : undefined,
            qrUrl: candidate.qrUrl && !candidate.qrUrl.split(/[?#]/, 1)[0].endsWith("/images/qr.webp") ? candidate.qrUrl : undefined,
            qrCodeUrl: candidate.qrCodeUrl && !candidate.qrCodeUrl.split(/[?#]/, 1)[0].endsWith("/images/qr.webp") ? candidate.qrCodeUrl : undefined,
        };
        return [sanitizedAccount];
    });
};

export const getWeddingHeroImage = (wedding: WeddingData, fallback = "") => {
    return getWeddingPhotoAtSlot(wedding, "cover")?.url
        || (wedding.themeSettings?.heroImagePublicId && !isDemoPhoto(wedding.themeSettings.heroImage) ? wedding.themeSettings.heroImage : undefined)
        || (!isDemoPhoto(wedding.themeSettings?.heroImage) ? wedding.themeSettings?.heroImage : undefined)
        || (!isDemoPhoto(wedding.themeSettings?.coverImageUrl) ? wedding.themeSettings?.coverImageUrl : undefined)
        || (!wedding.previewUploadedImagesOnly && !isDemoPhoto(fallback) ? fallback : "");
};
