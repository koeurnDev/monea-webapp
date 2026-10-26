import assert from "node:assert/strict";
import test from "node:test";
import {
    normalizeWeddingForTemplate,
    isSectionVisible,
} from "../src/components/templates/shared/template-settings.ts";
import {
    TEMPLATE_CATALOG,
    TEMPLATE_DEFINITIONS,
    TEMPLATE_REGISTRY,
    getTemplatesForEventType,
    normalizeTemplateAvailability,
    normalizeTemplatePresentationMetadata,
} from "../src/components/templates/template-config.ts";
import {
    TEMPLATE_AVAILABILITY_DEFAULTS,
    TEMPLATE_METADATA_DEFAULTS,
} from "../../monea-api-worker/lib/template-availability.ts";
import {
    getWeddingHeroImage,
    getWeddingGeneralPhotos,
    getWeddingPhotoAtSlot,
    getWeddingSectionPhoto,
    getWeddingPhotos,
} from "../src/components/templates/shared/weddingPhotos.ts";
import { getTemplateDefaultPaperColor, TEMPLATE_PAPER_TEXTURES } from "../src/lib/template-paper.ts";
import { NEA_M05_COLOR_PRESETS } from "../src/lib/nea-m05-colors.ts";
import { createSerialTaskQueue } from "../src/lib/serial-task-queue.ts";
import { normalizeWeddingActivities } from "../src/lib/wedding-activities.ts";
import {
    getOptimizedImageDimensions,
    prepareImageForUpload,
} from "../src/lib/prepare-image-upload.ts";
import { DEFAULT_WEDDING } from "../src/data/wedding.ts";
import {
    DEFAULT_ENGAGEMENT_ACTIVITIES,
    DEFAULT_WEDDING_ACTIVITIES,
    getDefaultActivitiesForEventType,
    matchesDefaultActivities,
} from "../src/lib/wedding-activity-defaults.ts";
import {
    getGalleryCardClass,
    getGalleryContainerClass,
    getGalleryDisplayStyle,
    getGalleryImageClass,
} from "../src/components/templates/shared/gallery-layout.ts";
import {
    getMapEmbedUrl,
    isGoogleMapsShortLink,
} from "../src/components/templates/shared/mapUtils.ts";
import {
    appendUploadedPhotosToGallery,
    assignUploadedPhotosToSlots,
    getWeddingPhotoSlotAspectRatio,
    getWeddingPhotoSlotIndex,
    getWeddingPhotoSlotKey,
    migrateWeddingPhotoSlots,
    swapWeddingPhotoSlots,
    WEDDING_PHOTO_LAYOUTS,
} from "../src/lib/wedding-photo-layout.ts";
import { getContrastingTextColor } from "../src/lib/color-contrast.ts";
import { WeddingDataCache } from "../src/lib/wedding-data-cache.ts";
import { buildSrcSet, getOriginalMediaUrl, MEDIA_WIDTHS, optimizeMediaUrl } from "../src/lib/media.ts";
import { getPostLoginPath } from "../src/lib/auth-navigation.ts";

const createWedding = (themeSettings = {}) => ({
    id: "template-contract-test",
    groomName: "A",
    brideName: "B",
    date: "2026-01-01",
    location: null,
    activities: undefined,
    galleryItems: undefined,
    themeSettings,
});

test("social preview fallbacks and service worker precache only use deployed icons", async () => {
    const { readFile, access } = await import("node:fs/promises");
    const [weddingPage, step5, serviceWorker] = await Promise.all([
        readFile(new URL("../src/app/w/[id]/_components/WeddingDataView.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    ]);
    const publicIcons = new URL("../public/icons/", import.meta.url);

    assert.match(weddingPage, /\/icons\/logomoneo\.webp/);
    assert.match(step5, /\/icons\/logomoneo\.webp/);
    assert.doesNotMatch(weddingPage + step5 + serviceWorker, /icon-(?:192x192|512x512)\.png/);
    await access(new URL("logomoneo.webp", publicIcons));
    assert.match(serviceWorker, /'\/icons\/logomoneo\.webp'/);
    assert.doesNotMatch(serviceWorker, /'\/(?:logo\.png|icons\/(?:icon-192x192|icon-512x512)\.png)'/);
});

test("R2 media uses its live source URL instead of unavailable Cloudflare transforms", () => {
    const original = "https://media.moneoez.com/wedding-id/photo%20one.jpg";
    const transformed = optimizeMediaUrl(original, { width: 640, quality: 78 });

    assert.equal(transformed, original);
    assert.equal(getOriginalMediaUrl(original), original);
    assert.equal(
        getOriginalMediaUrl("https://moneoez.com/cdn-cgi/image/width=800/https://media.moneoez.com/wedding-id/photo%20one.jpg"),
        original,
    );
    assert.equal(
        optimizeMediaUrl("https://example.com/photo.jpg", { width: 640 }),
        "https://example.com/photo.jpg",
    );
    assert.equal(buildSrcSet(original, MEDIA_WIDTHS.lightbox, { quality: 78 }), undefined);
    assert.deepEqual(MEDIA_WIDTHS.thumbnail, [400, 800]);
    assert.deepEqual(MEDIA_WIDTHS.grid, [400, 800]);
    assert.deepEqual(MEDIA_WIDTHS.lightbox, [400, 800, 1200, 1600]);
});

test("uploaded photos are resized to a guest-friendly maximum dimension", () => {
    assert.deepEqual(getOptimizedImageDimensions(4032, 3024), { width: 1600, height: 1200 });
    assert.deepEqual(getOptimizedImageDimensions(1200, 1600), { width: 1200, height: 1600 });
});

test("R2 image uploads compress supported photos and preserve animated formats", async () => {
    const originalCreateImageBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    let outputWidth = 0;
    let outputHeight = 0;
    Object.defineProperty(globalThis, "createImageBitmap", {
        configurable: true,
        value: async () => ({ width: 4032, height: 3024, close() {} }),
    });
    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: {
            createElement: () => {
                const canvas = {
                    width: 0,
                    height: 0,
                    getContext: () => ({ drawImage() {} }),
                    toBlob(callback, type) {
                        outputWidth = canvas.width;
                        outputHeight = canvas.height;
                        callback(new Blob(["compressed"], { type }));
                    },
                };
                return canvas;
            },
        },
    });

    try {
        const photo = new File(["large photo"], "wedding.jpg", { type: "image/jpeg" });
        const optimized = await prepareImageForUpload(photo);
        assert.equal(optimized.name, "wedding.webp");
        assert.equal(optimized.type, "image/webp");
        assert.deepEqual([outputWidth, outputHeight], [1600, 1200]);

        const animation = new File(["animation"], "invitation.gif", { type: "image/gif" });
        assert.equal(await prepareImageForUpload(animation), animation);
    } finally {
        if (originalCreateImageBitmap) {
            Object.defineProperty(globalThis, "createImageBitmap", originalCreateImageBitmap);
        } else {
            delete globalThis.createImageBitmap;
        }
        if (originalDocument) {
            Object.defineProperty(globalThis, "document", originalDocument);
        } else {
            delete globalThis.document;
        }
    }
});

test("PhotoImage retries the original image if a Cloudflare transformation fails", async () => {
    const { readFile } = await import("node:fs/promises");
    const photoImage = await readFile(
        new URL("../src/components/templates/shared/PhotoImage.tsx", import.meta.url),
        "utf8",
    );
    assert.match(photoImage, /getOriginalMediaUrl\(src\)/);
    assert.match(photoImage, /setUseOriginal\(true\)/);
    assert.match(photoImage, /srcSet=\{useOriginal \? undefined : responsiveSrcSet\}/);
});

test("invitation galleries declare responsive slot sizes and defer offscreen images", async () => {
    const { readFile } = await import("node:fs/promises");
    const galleryFiles = [
        "../src/components/templates/modern-minimal/GallerySection.tsx",
        "../src/components/templates/blossom-romance/GallerySection.tsx",
        "../src/components/templates/emerald-garden/GallerySection.tsx",
        "../src/components/templates/fortune-harmony/GallerySection.tsx",
        "../src/components/templates/anniversary-elegant/AnniversaryGallery.tsx",
    ];
    const galleries = await Promise.all(
        galleryFiles.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    for (const gallery of galleries) {
        assert.match(gallery, /sizes=\{galleryStyle === "slider"/);
        assert.match(gallery, /400px/);
        assert.match(gallery, /loading="lazy"/);
        assert.match(gallery, /sizes="\(max-width: 768px\) 100vw, 800px"/);
    }
});

test("post-login navigation restores only internal routes allowed for the user's role", () => {
    const origin = "https://moneoez.com";
    assert.equal(
        getPostLoginPath(false, { pathname: "/dashboard/design", search: "?step=4", hash: "#photos" }, origin),
        "/dashboard/design?step=4#photos",
    );
    assert.equal(
        getPostLoginPath(true, { pathname: "/admin/master/templates" }, origin),
        "/admin/master/templates",
    );
    assert.equal(getPostLoginPath(false, { pathname: "/admin/master" }, origin), "/dashboard");
    assert.equal(getPostLoginPath(false, { pathname: "//evil.example/path" }, origin), "/dashboard");
    assert.equal(getPostLoginPath(true, null, origin), "/admin");
});

test("SSO callback initializes the authenticated user without reloading the app", async () => {
    const { readFile } = await import("node:fs/promises");
    const callback = await readFile(
        new URL("../src/pages/auth/AuthCallbackPage.tsx", import.meta.url),
        "utf8",
    );
    assert.match(callback, /moneaClient\.get<CallbackProfile>\(['"]\/api\/auth\/me['"]\)/);
    assert.match(callback, /setAuthenticatedUser\(\{/);
    assert.match(callback, /navigate\(getPostLoginPath/);
    assert.doesNotMatch(callback, /window\.location\.href/);
});

test("wedding pages keep user photos out of SEO image previews and indexing", async () => {
    const { readFile } = await import("node:fs/promises");
    const weddingPage = await readFile(
        new URL("../src/app/w/[id]/_components/WeddingDataView.tsx", import.meta.url),
        "utf8",
    );

    assert.match(weddingPage, /const seoImage = new URL\("\/icons\/SE\.png", window\.location\.origin\)\.href/);
    assert.match(weddingPage, /ogImage=\{seoImage\}/);
    assert.match(weddingPage, /"image": seoImage/);
    assert.match(weddingPage, /index, follow, noimageindex, max-image-preview:none/);
    assert.match(weddingPage, /noindex, nofollow, noimageindex, max-image-preview:none/);
    assert.doesNotMatch(weddingPage, /ogImage=\{heroImg\}/);
    assert.doesNotMatch(weddingPage, /"image": heroImg/);
});

test("wedding data cache prunes expired data and caps memory and session entries", () => {
    const values = new Map();
    const storage = {
        get length() { return values.size; },
        getItem(key) { return values.get(key) ?? null; },
        key(index) { return [...values.keys()][index] ?? null; },
        removeItem(key) { values.delete(key); },
        setItem(key, value) { values.set(key, value); },
    };
    const cache = new WeddingDataCache(storage, 100, 2);

    cache.set("one", { id: "one" }, 10);
    cache.set("two", { id: "two" }, 20);
    cache.set("three", { id: "three" }, 30);

    assert.equal(cache.get("one", 30), null);
    assert.deepEqual(cache.get("three", 30), { id: "three" });
    assert.deepEqual(cache.get("two", 30), { id: "two" });
    assert.equal(values.size, 2);

    cache.set("four", { id: "four" }, 200);
    assert.equal(cache.get("three", 200), null);
    assert.deepEqual(cache.get("four", 200), { id: "four" });
    assert.equal(values.size, 1);
});

test("normalizes legacy visibility and schedule title keys", () => {
    const { wedding, config } = normalizeWeddingForTemplate(createWedding({
        visibility: { showSchedule: false },
        customLabels: { schedule_title: "Legacy schedule title" },
    }));

    assert.equal(config.visibility.showTimeline, false);
    assert.equal(config.labels.scheduleTitle, "Legacy schedule title");
    assert.equal(isSectionVisible(config, "timeline"), false);
    assert.equal(wedding.themeSettings?.visibility?.showSchedule, undefined);
    assert.equal(wedding.themeSettings?.customLabels?.schedule_title, undefined);
    assert.equal(isSectionVisible(config, "guestbook"), true);
});

test("canonical keys take precedence and missing content is normalized", () => {
    const { wedding, config } = normalizeWeddingForTemplate(createWedding({
        visibility: { showTimeline: true, showSchedule: false },
        customLabels: {
            scheduleTitle: "Current title",
            schedule_title: "Legacy title",
        },
    }));

    assert.equal(config.visibility.showTimeline, true);
    assert.equal(config.labels.scheduleTitle, "Current title");
    assert.deepEqual(wedding.activities, []);
    assert.deepEqual(wedding.galleryItems, []);
    assert.equal(isSectionVisible(config, "gallery"), true);
    assert.equal(isSectionVisible(config, "guestbook"), true);
    const { config: hiddenGuestbookConfig } = normalizeWeddingForTemplate(createWedding({
        visibility: { showGuestbook: false },
    }));
    assert.equal(isSectionVisible(hiddenGuestbookConfig, "guestbook"), false);
});

test("M1 general gallery keeps its original boundary when reserved photo slots are empty", () => {
    const wedding = {
        ...createWedding(),
        galleryItems: [
            ...Array.from({ length: 12 }, (_, index) => ({ url: index === 2 ? "" : `/slot-${index}.jpg`, type: "IMAGE" })),
            { url: "/gallery-one.jpg", type: "IMAGE" },
            { url: "/gallery-two.jpg", type: "IMAGE" },
            { url: "/private-certificate.jpg", type: "CERTIFICATE" },
        ],
        templateId: "khmer-legacy",
    };
    assert.deepEqual(getWeddingGeneralPhotos(wedding), ["/gallery-one.jpg", "/gallery-two.jpg"]);
    assert.equal(wedding.galleryItems[11].url, "/slot-11.jpg");
    assert.equal(wedding.galleryItems[12].url, "/gallery-one.jpg");
});

test("every template photo layout has contiguous slots and preserves its general gallery boundary", () => {
    for (const [templateId, layout] of Object.entries(WEDDING_PHOTO_LAYOUTS)) {
        assert.deepEqual(
            layout.slots.map((slot) => slot.index),
            Array.from({ length: layout.slots.length }, (_, index) => index),
            `${templateId} slots should be contiguous`,
        );

        const galleryItems = [
            ...layout.slots.map((slot) => ({ url: `/slot-${slot.index}.jpg`, type: "IMAGE" })),
            { url: "/gallery-one.jpg", type: "IMAGE" },
            { url: "/gallery-two.jpg", type: "IMAGE" },
        ];
        const wedding = { ...createWedding(), templateId, galleryItems };
        assert.deepEqual(getWeddingGeneralPhotos(wedding), ["/gallery-one.jpg", "/gallery-two.jpg"], `${templateId} gallery boundary`);
        assert.equal(wedding.galleryItems[layout.slots.length - 1].url, `/slot-${layout.slots.length - 1}.jpg`, `${templateId} final reserved slot`);
        assert.equal(wedding.galleryItems[layout.slots.length].url, "/gallery-one.jpg", `${templateId} first gallery photo`);
    }
});

test("template changes keep photos attached to semantic slots and preserve unmatched photos", () => {
    const sourceLayout = WEDDING_PHOTO_LAYOUTS["anniversary-elegant"];
    const targetLayout = WEDDING_PHOTO_LAYOUTS["modern-minimal"];
    const sourceItems = [
        ...sourceLayout.slots.map((slot) => ({
            url: `/photos/${slot.key}.jpg`,
            publicId: `photos/${slot.key}`,
            type: "IMAGE",
        })),
        { url: "/photos/album.jpg", publicId: "photos/album", type: "IMAGE" },
    ];
    const migration = migrateWeddingPhotoSlots(
        sourceItems,
        "anniversary-elegant",
        "modern-minimal",
        [1, 6, 9],
        ["photos/hidden-album"],
    );
    const targetIndex = (key) => targetLayout.slots.find((slot) => slot.key === key).index;

    assert.equal(migration.galleryItems[targetIndex("cover")].url, "/photos/cover.jpg");
    assert.equal(migration.galleryItems[targetIndex("thankYou")].url, "/photos/thankYou.jpg");
    assert.equal(migration.galleryItems[targetIndex("gallery1")].url, "/photos/gallery1.jpg");
    assert.equal(migration.galleryItems[targetIndex("groom")].url, "/photos/groom.jpg");
    assert.deepEqual(migration.hiddenPhotoSlots, [targetIndex("groom")]);
    assert.deepEqual(
        migration.hiddenGalleryPhotoKeys,
        ["photos/hidden-album", "photos/countdown", "photos/story"],
    );
    assert.deepEqual(
        migration.galleryItems.slice(targetLayout.slots.length).map(({ url }) => url),
        ["/photos/countdown.jpg", "/photos/location.jpg", "/photos/gift.jpg", "/photos/story.jpg", "/photos/album.jpg"],
    );
});

test("all editor template-switch paths migrate semantic photo slots", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(
        new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url),
        "utf8",
    );

    assert.match(source, /migrateWeddingPhotoSlots\(\s*prev\.galleryItems,\s*prev\.templateId,\s*templateId/);
    assert.match(source, /migrateWeddingPhotoSlots\(\s*prev\.galleryItems,\s*currentTemplate,\s*nextTemplate/);
    assert.match(source, /migrateWeddingPhotoSlots\(\s*prev\.galleryItems,\s*prev\.templateId,\s*result\.templateId/);
});

test("configured section photo slots map to their template's photo consumers and crop ratios", async () => {
    const { readFile } = await import("node:fs/promises");
    const templateRoot = new URL("../src/components/templates/", import.meta.url);
    const [khmer, nea, fortune, blossom, emerald, gardenEditorial] = await Promise.all([
        readFile(new URL("KhmerLegacy.tsx", templateRoot), "utf8"),
        readFile(new URL("NeaM05.tsx", templateRoot), "utf8"),
        readFile(new URL("fortune-harmony/HeroSection.tsx", templateRoot), "utf8"),
        readFile(new URL("blossom-romance/HeroSection.tsx", templateRoot), "utf8"),
        readFile(new URL("emerald-garden/HeroSection.tsx", templateRoot), "utf8"),
        readFile(new URL("GardenEditorial.tsx", templateRoot), "utf8"),
    ]);
    const checks = [
        ["modern-minimal", ["cover", "divider1", "thankYou", "divider2", "groom", "bride"]],
        ["anniversary-elegant", ["cover", "countdown", "location", "gift", "thankYou", "story", "groom", "bride"]],
        ["khmer-legacy", ["cover", "couple", "location", "editorial1", "editorial2", "locationBackup", "signature1", "signature2", "signature3", "signature4", "signature5", "signature6"]],
        ["nea-m05", ["cover"]],
        ["fortune-harmony", ["cover"]],
        ["blossom-romance", ["cover"]],
        ["emerald-garden", ["cover"]],
        ["garden-editorial", ["cover", "location", "story"]],
    ];

    for (const [templateId, expectedSectionKeys] of checks) {
        const layout = WEDDING_PHOTO_LAYOUTS[templateId];
        const sectionSlots = layout
            .slots.filter((slot) => slot.display === "section")
            .map((slot) => slot.key);
        assert.deepEqual(sectionSlots, expectedSectionKeys, `${templateId} section slot map`);
        assert.equal(new Set(layout.slots.map((slot) => slot.key)).size, layout.slots.length, `${templateId} slot keys should be unique`);
        for (const slot of layout.slots) {
            assert.equal(getWeddingPhotoSlotIndex(templateId, slot.key), slot.index, `${templateId}.${slot.key} storage index`);
            assert.equal(getWeddingPhotoSlotKey(templateId, slot.index), slot.key, `${templateId} index ${slot.index} key`);
        }
    }

    assert.match(khmer, /<LocationMap wedding=\{wedding\} mapPan=\{mapPan\}/);
    assert.match(nea, /getNeaM05CouplePhoto\(wedding\)/);
    assert.match(fortune, /getWeddingSectionPhoto\(wedding, "cover"\)/);
    assert.match(blossom, /getWeddingSectionPhoto\(wedding, "cover"\)/);
    assert.match(emerald, /getWeddingSectionPhoto\(wedding, "cover"\)/);
    assert.match(gardenEditorial, /getWeddingSectionPhoto\(wedding, "cover"\)/);
    assert.match(gardenEditorial, /getWeddingSectionPhoto\(wedding, "location"\)/);
    assert.match(gardenEditorial, /getWeddingSectionPhoto\(wedding, "story"\)/);
    assert.equal(getWeddingPhotoSlotAspectRatio("divider1", "modern-minimal"), 16 / 9);
    assert.equal(getWeddingPhotoSlotAspectRatio("locationBackup", "khmer-legacy"), 4 / 5);
    assert.equal(getWeddingPhotoSlotAspectRatio("groom", "anniversary-elegant"), 1);
    assert.ok(WEDDING_PHOTO_LAYOUTS["modern-minimal"].slots.filter((slot) => slot.display === "gallery").length > 0);
    assert.ok(WEDDING_PHOTO_LAYOUTS["fortune-harmony"].slots.filter((slot) => slot.display === "gallery").length > 0);
    assert.ok(WEDDING_PHOTO_LAYOUTS["blossom-romance"].slots.filter((slot) => slot.display === "gallery").length > 0);
    assert.ok(WEDDING_PHOTO_LAYOUTS["emerald-garden"].slots.filter((slot) => slot.display === "gallery").length > 0);
    assert.ok(WEDDING_PHOTO_LAYOUTS["nea-m05"].slots.filter((slot) => slot.display === "gallery").length > 0);
});

test("template photo consumers use semantic keys instead of hard-coded slot numbers", async () => {
    const { readFile } = await import("node:fs/promises");
    const templateRoot = new URL("../src/components/templates/", import.meta.url);
    const consumerFiles = [
        "ModernMinimal.tsx",
        "modern-minimal/LetterSection.tsx",
        "modern-minimal/ThankYouSection.tsx",
        "anniversary-elegant/AnniversaryCountdown.tsx",
        "anniversary-elegant/AnniversaryGift.tsx",
        "anniversary-elegant/AnniversaryLocation.tsx",
        "anniversary-elegant/AnniversaryStory.tsx",
        "anniversary-elegant/AnniversaryThankYou.tsx",
        "anniversary-elegant/AnniversaryVows.tsx",
        "khmer-legacy/EventCountdown.tsx",
        "khmer-legacy/FamilyBanner.tsx",
        "khmer-legacy/EditorialBreaks.tsx",
        "khmer-legacy/KhmerSchedule.tsx",
        "khmer-legacy/LocationMap.tsx",
        "khmer-legacy/SignatureMoments.tsx",
        "fortune-harmony/HeroSection.tsx",
        "blossom-romance/HeroSection.tsx",
        "emerald-garden/HeroSection.tsx",
        "GardenEditorial.tsx",
    ];

    const sources = await Promise.all(consumerFiles.map((file) => readFile(new URL(file, templateRoot), "utf8")));
    for (const [index, source] of sources.entries()) {
        assert.doesNotMatch(
            source,
            /getWedding(?:PhotoAtSlot|SectionPhoto)\(wedding,\s*\d|galleryImages\s*\[\s*\d/,
            `${consumerFiles[index]} should refer to a semantic photo slot`,
        );
    }
    assert.match(sources.at(-1), /blossom-arch-bg\.jpg/);
});

test("uploaded photo batches automatically fill each template's slots in order", () => {
    for (const [templateId, layout] of Object.entries(WEDDING_PHOTO_LAYOUTS)) {
        const uploads = [
            { url: "/one.jpg", publicId: "one", type: "IMAGE" },
            { url: "/two.jpg", publicId: "two", type: "IMAGE" },
            { url: "/three.jpg", publicId: "three", type: "IMAGE" },
        ];
        const assigned = assignUploadedPhotosToSlots([], uploads, templateId);

        assert.equal(assigned[0].url, "/one.jpg", `${templateId} first photo should be the cover`);
        assert.equal(assigned[1].url, "/two.jpg", `${templateId} second photo should fill the next slot`);
        assert.equal(assigned[2].url, "/three.jpg", `${templateId} third photo should fill the next slot`);
        assert.equal(assigned.length, Math.max(uploads.length, layout.slots.length > 0 ? uploads.length : 0));
    }
});

test("new photo uploads fill empty slots without replacing existing photos", () => {
    const result = assignUploadedPhotosToSlots([
        { url: "/old-cover.jpg", type: "IMAGE" },
        { url: "", type: "IMAGE" },
        { url: "/old-location.jpg", type: "IMAGE" },
    ], [
        { url: "/new-one.jpg", type: "IMAGE" },
        { url: "/new-two.jpg", type: "IMAGE" },
    ], "khmer-legacy");

    assert.equal(result[0].url, "/old-cover.jpg");
    assert.equal(result[1].url, "/new-one.jpg");
    assert.equal(result[2].url, "/old-location.jpg");
    assert.equal(result[3].url, "/new-two.jpg");
});

test("additional gallery uploads stay out of template slots and skip duplicate assets", () => {
    const result = appendUploadedPhotosToGallery([
        { url: "/cover.jpg", publicId: "cover", type: "IMAGE" },
    ], [
        { url: "/cover.jpg", publicId: "cover", type: "IMAGE" },
        { url: "/gallery.jpg", publicId: "gallery", type: "IMAGE" },
        { url: "/clip.mp4", publicId: "clip", type: "VIDEO" },
    ], "modern-minimal");

    const slotCount = WEDDING_PHOTO_LAYOUTS["modern-minimal"].slots.length;
    assert.equal(result[0].url, "/cover.jpg");
    assert.equal(result[1].url, "");
    assert.equal(result[slotCount].url, "/gallery.jpg");
    assert.equal(result.length, slotCount + 1);
});

test("reordering photos swaps slot assignments without moving certificates or changing the gallery boundary", () => {
    const items = [
        { url: "/cover.jpg", publicId: "cover", type: "IMAGE" },
        { url: "/couple.jpg", publicId: "couple", type: "IMAGE" },
        { url: "", type: "IMAGE" },
        { url: "/certificate.jpg", type: "CERTIFICATE" },
        { url: "/gallery.jpg", publicId: "gallery", type: "IMAGE" },
    ];
    const movedToCover = swapWeddingPhotoSlots(items, 1, 0, "modern-minimal");
    assert.equal(movedToCover?.[0].url, "/couple.jpg");
    assert.equal(movedToCover?.[1].url, "/cover.jpg");
    assert.equal(movedToCover?.[3].url, "/certificate.jpg");
    assert.equal(movedToCover?.[4].url, "/gallery.jpg");

    const movedIntoEmptySlot = swapWeddingPhotoSlots(items, 1, 2, "modern-minimal");
    assert.equal(movedIntoEmptySlot?.[1].url, "");
    assert.equal(movedIntoEmptySlot?.[2].url, "/couple.jpg");
    assert.equal(swapWeddingPhotoSlots(items, 0, 3, "modern-minimal"), null);
    assert.equal(swapWeddingPhotoSlots([
        { url: "/cover.jpg", type: "IMAGE" },
        { url: "", type: "CERTIFICATE" },
    ], 0, 1, "modern-minimal"), null);
});

test("photo library assigns section photos individually and keeps batch uploads in the extra gallery", async () => {
    const { readFile } = await import("node:fs/promises");
    const [mediaStep, library] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/sections/GeneralGallerySection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(library, /multiple/);
    assert.match(library, /accept="image\/\*"/);
    assert.match(library, /ជ្រើសរើសរូបតាមផ្នែក/);
    assert.match(library, /ចុច «ដាក់រូប» នៅផ្នែកដែលអ្នកចង់ប្ដូរ/);
    assert.match(library, /ជំនួសរូបចាស់នៅទីតាំងដដែល/);
    assert.match(library, /រូបវិចិត្រសាលបន្ថែម/);
    assert.match(library, /មិនត្រូវបានចាត់ទៅផ្នែកខាងលើដោយស្វ័យប្រវត្តិទេ/);
    assert.match(library, /កាត់តម្រឹម \$\{title\}/);
    assert.match(library, /<ImageCropperModal/);
    assert.match(library, /onReplacePhoto\(index, url, publicId\)/);
    assert.match(library, /aspectRatio=\{selectedSlot\?\.aspectRatio \?\? 1\}/);
    assert.match(library, /ផ្លាស់ទី \$\{title\} ឡើងលើ/);
    assert.match(library, /ផ្លាស់ទី \$\{title\} ចុះក្រោម/);
    assert.match(library, /onMovePhoto\(fromIndex, toIndex\)/);
    assert.match(mediaStep, /ជ្រើសរើសរូបសម្រាប់ផ្នែកនីមួយៗខាងក្រោម/);
    assert.match(mediaStep, /មិនត្រូវបានដាក់ស្ទួនទៅផ្នែកផ្សេងទេ/);
    assert.doesNotMatch(mediaStep, /រូបបន្ទាប់ៗទៅផ្នែកផ្សេងៗដោយស្វ័យប្រវត្តិ/);
});

test("template photo migration tells users when photos move to the extra gallery", async () => {
    const { readFile } = await import("node:fs/promises");
    const [wizard, mediaStep, page] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(wizard, /បានរក្សារូប \$\{migrationPreview\.movedToGalleryCount\} សន្លឹកក្នុងវិចិត្រសាលបន្ថែម/);
    assert.match(mediaStep, /role="status"[\s\S]*?\{photoMigrationNotice\}/);
    assert.match(page, /photoMigrationNotice=\{photoMigrationNotice\}/);
});

test("location backup slot explains when it is used without photo visibility toggles", async () => {
    const { readFile } = await import("node:fs/promises");
    const locationMap = await readFile(new URL("../src/components/templates/khmer-legacy/LocationMap.tsx", import.meta.url), "utf8");

    assert.match(locationMap, /getWeddingPhotoAtSlot\(wedding, "location"\)[\s\S]*?getWeddingPhotoAtSlot\(wedding, "locationBackup"\)/);
});

test("template data collapses duplicate schedule activities but keeps distinct entries", () => {
    const repeatedActivity = {
        time: "០៧:០០ ព្រឹក",
        title: "ពិធីហែជំនូន",
        description: "ជួបជុំសាច់ញាតិ និងភ្ញៀវកិត្តិយស",
        icon: null,
        order: 0,
    };
    const { wedding } = normalizeWeddingForTemplate({
        ...createWedding(),
        activities: [
            repeatedActivity,
            { ...repeatedActivity, order: 1 },
            {
                time: "០៨:៣០ ព្រឹក",
                title: "ពិធីសំពះផ្ទឹម",
                description: "ពិធីសិរីសួស្តី",
                icon: null,
                order: 2,
            },
        ],
    });

    assert.deepEqual(wedding.activities, [
        repeatedActivity,
        {
            time: "០៨:៣០ ព្រឹក",
            title: "ពិធីសំពះផ្ទឹម",
            description: "ពិធីសិរីសួស្តី",
            icon: null,
            order: 2,
        },
    ]);
});

test("new wedding invitations start with an editable Khmer wedding programme", async () => {
    const expectedTitles = [
        "ពិធីហែជំនូន",
        "ពិធីសូត្រមន្ត",
        "ពិធីកាត់សក់",
        "ពិធីសំពះផ្ទឹម",
        "ពិធីបង្វិលពពិល",
        "ពិធីបាចផ្កាស្លា",
        "ពិធីចងដៃ",
        "ពិធីជប់លៀង",
    ];
    const { readFile } = await import("node:fs/promises");
    const editorHook = await readFile(
        new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url),
        "utf8",
    );

    assert.deepEqual(DEFAULT_WEDDING.activities.map(({ title }) => title), expectedTitles);
    assert.deepEqual(
        DEFAULT_WEDDING.activities.map(({ order }) => order),
        expectedTitles.map((_, index) => index),
    );
    assert.deepEqual(DEFAULT_WEDDING.activities, DEFAULT_WEDDING_ACTIVITIES);
    assert.match(editorHook, /activities: DEFAULT_WEDDING_ACTIVITIES\.map\(\(activity\) => \(\{ \.\.\.activity \}\)\)/);
    assert.match(editorHook, /activities: data\.activities,/);
});

test("private marriage certificates are not exposed in the public M1 invitation", async () => {
    const { readFile } = await import("node:fs/promises");
    const [template, weddingApi] = await Promise.all([
        readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/routers/wedding.ts", import.meta.url), "utf8"),
    ]);

    assert.doesNotMatch(template, /SacredBond/);
    assert.match(weddingApi, /delete parsedThemeSettings\.privateCertificate/);
    assert.match(weddingApi, /item\?\.type !== "CERTIFICATE"/);
});

test("engagement invitations get their own default programme without replacing edited schedules", async () => {
    const engagementTitles = [
        "ជួបជុំគ្រួសារ និងភ្ញៀវកិត្តិយស",
        "ពិធីសែនព្រេន",
        "ពិធីប្រគល់ចិញ្ចៀន និងជំនូន",
        "ពិធីជូនពរ និងថតរូបអនុស្សាវរីយ៍",
        "ពិសាអាហារថ្ងៃត្រង់",
    ];
    const { readFile } = await import("node:fs/promises");
    const editorHook = await readFile(
        new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url),
        "utf8",
    );

    assert.deepEqual(
        getDefaultActivitiesForEventType("anniversary").map(({ title }) => title),
        engagementTitles,
    );
    assert.deepEqual(
        DEFAULT_ENGAGEMENT_ACTIVITIES.map(({ order }) => order),
        engagementTitles.map((_, index) => index),
    );
    assert.equal(matchesDefaultActivities(DEFAULT_WEDDING_ACTIVITIES, DEFAULT_WEDDING_ACTIVITIES), true);
    assert.equal(matchesDefaultActivities([], DEFAULT_WEDDING_ACTIVITIES), false);
    assert.equal(
        matchesDefaultActivities(
            [{ ...DEFAULT_WEDDING_ACTIVITIES[0], title: "កម្មវិធីផ្ទាល់ខ្លួន" }],
            DEFAULT_WEDDING_ACTIVITIES,
        ),
        false,
    );
    assert.match(editorHook, /matchesDefaultActivities\(prev\.activities, DEFAULT_WEDDING_ACTIVITIES\)/);
    assert.match(editorHook, /matchesDefaultActivities\(prev\.activities, previousDefaults\)/);
    assert.match(editorHook, /getDefaultActivitiesForEventType\(normalizedType\)\.map\(\(activity\) => \(\{ \.\.\.activity \}\)\)/);
});

test("engagement invitations offer the three requested ceremony title choices", async () => {
    const { readFile } = await import("node:fs/promises");
    const labelsSection = await readFile(
        new URL("../src/app/dashboard/design/components/sections/LabelsSection.tsx", import.meta.url),
        "utf8",
    );

    assert.match(labelsSection, /const isEngagement = wedding\.eventType === "anniversary"/);
    assert.match(labelsSection, /"សិរិមង្គលភ្ជាប់ពាក្យ"/);
    assert.match(labelsSection, /"សិរីមង្គលពិធីចែចូវ"/);
    assert.match(labelsSection, /"សិរីមង្គលពិធីពិសាស្លាដក់កន្សែង"/);
    assert.match(labelsSection, /onChange=\{\(event\) => updateLabel\(field\.key, event\.target\.value\)\}/);
    assert.match(labelsSection, /hasExistingCustomTitle && <option value=\{invitationTitle\}>\{invitationTitle\}<\/option>/);
});

test("editor activity normalization removes repeated and blank entries while keeping distinct activities", async () => {
    const repeatedActivity = {
        time: " ០៧:០០   ព្រឹក ",
        title: " ពិធីហែជំនូន ",
        description: "ជួបជុំសាច់ញាតិ",
        icon: null,
        order: 0,
    };
    const activities = normalizeWeddingActivities([
        repeatedActivity,
        { ...repeatedActivity, time: "០៧:០០ ព្រឹក", title: "ពិធីហែជំនូន", order: 1 },
        { time: "", title: "", description: "", order: 2 },
        { time: "", title: "", description: "", order: 3 },
        { time: "០៨:៣០ ព្រឹក", title: "ពិធីសំពះផ្ទឹម", description: "ចងដៃ", order: 4 },
    ]);
    const { readFile } = await import("node:fs/promises");
    const editorHook = await readFile(
        new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url),
        "utf8",
    );

    assert.equal(activities.length, 2);
    assert.equal(activities[0].order, 0);
    assert.equal(activities[1].title, "ពិធីសំពះផ្ទឹម");
    assert.match(editorHook, /activities: normalizeWeddingActivities\(savedActivities\)/);
    assert.match(editorHook, /activities: savedActivities,\s*\}\);/);
    assert.match(editorHook, /const timer = setTimeout\(\(\) => \{\s*saveChanges\(wedding, \{ silent: true \}\);/);

    const repeatedDefaults = Array.from({ length: 45 }, (_, index) => ({
        ...DEFAULT_WEDDING.activities[index % DEFAULT_WEDDING.activities.length],
        order: index,
    }));
    assert.deepEqual(
        normalizeWeddingActivities(repeatedDefaults).map(({ title }) => title),
        DEFAULT_WEDDING.activities.map(({ title }) => title),
    );
});

test("paper texture choices use only bundled texture assets", () => {
    assert.deepEqual(TEMPLATE_PAPER_TEXTURES.map(({ id }) => id), ["cream", "linen", "plain"]);
    assert.ok(TEMPLATE_PAPER_TEXTURES.every(({ image }) => (
        image === "none" || image.startsWith("/khmer-invite-starter-kit/textures/")
    )));
});

test("all invitation templates support editable paper color and texture", async () => {
    const { readFile } = await import("node:fs/promises");
    const templatePaths = {
        "khmer-legacy": "../src/components/templates/KhmerLegacy.tsx",
        "modern-minimal": "../src/components/templates/ModernMinimal.tsx",
        "fortune-harmony": "../src/components/templates/FortuneHarmony.tsx",
        "blossom-romance": "../src/components/templates/BlossomRomance.tsx",
        "nea-m05": "../src/components/templates/NeaM05.tsx",
        "emerald-garden": "../src/components/templates/EmeraldGarden.tsx",
        "anniversary-elegant": "../src/components/templates/AnniversaryElegant.tsx",
        "garden-editorial": "../src/components/templates/GardenEditorial.tsx",
    };
    const [settings, paperStyles, ...templates] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/lib/template-color-palette.ts", import.meta.url), "utf8"),
        ...Object.values(templatePaths).map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    ]);

    assert.equal(Object.keys(TEMPLATE_DEFINITIONS).length, Object.keys(templatePaths).length);
    assert.match(settings, /const supportsPaperCustomization = Boolean\(getTemplateConfig\(wedding\.templateId\)\)/);
    assert.equal(getTemplateDefaultPaperColor("nea-m05"), "#F3ECDC");
    assert.equal(getTemplateDefaultPaperColor("emerald-garden"), "#FFFFFF");
    assert.ok(NEA_M05_COLOR_PRESETS.every(({ paperColor }) => /^#[\da-f]{6}$/i.test(paperColor)));
    assert.match(settings, /colorPalettePreset: preset\.id,\s*primaryColor: preset\.accent,\s*paperColor: preset\.paperColor/);
    assert.match(settings, /m05ColorPreset: preset\.id,\s*primaryColor: preset\.foil,\s*paperColor: preset\.paperColor/);
    assert.match(settings, /onClick=\{resetRecommendedPaperColor\}/);
    assert.match(settings, /primaryColor: event\.target\.value,\s*colorPalettePreset: "",\s*paperColor: ""/);
    assert.match(settings, /primaryColor: color,\s*colorPalettePreset: "",\s*paperColor: ""/);
    assert.match(settings, /paperColor: key === "m05CardColor" \? event\.target\.value : ""/);
    assert.match(paperStyles, /export const getTemplatePaperStyles =/);
    assert.match(paperStyles, /"--monea-paper-color": paperColor/);
    assert.match(paperStyles, /"--monea-paper-texture": paperTexture\.image === "none" \? "none" : `url\("\$\{paperTexture\.image\}"\)`/);

    const templateSources = Object.fromEntries(Object.keys(templatePaths).map((id, index) => [id, templates[index]]));
    for (const id of ["khmer-legacy", "modern-minimal", "fortune-harmony", "blossom-romance", "anniversary-elegant", "garden-editorial"]) {
        assert.match(templateSources[id], /getTemplatePaletteStyles/);
        assert.match(templateSources[id], /monea-paper-canvas/);
    }
    assert.match(templateSources["emerald-garden"], /getTemplatePaletteStyles/);
    assert.match(templateSources["emerald-garden"], /monea-paper-canvas/);
    assert.match(templateSources["nea-m05"], /getTemplatePaperStyles/);
    assert.match(templateSources["nea-m05"], /var\(--monea-paper-texture\)/);
});

test("template palette preserves text colors and template backgrounds", async () => {
    const { readFile } = await import("node:fs/promises");
    const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
    const palette = await readFile(new URL("../src/lib/template-color-palette.ts", import.meta.url), "utf8");

    assert.match(palette, /themeSettings\?\.primaryColor \|\| preset\?\.accent \|\| defaultPrimary/);
    assert.match(palette, /"--monea-palette-on-primary": getContrastingTextColor\(primary\)/);
    assert.match(palette, /preset\?\.foil \|\| `color-mix\(in srgb, \$\{primary\} 35%, white\)`/);
    assert.match(styles, /background-color: var\(--monea-palette-primary\) !important/);
    assert.match(styles, /color: var\(--monea-palette-on-primary\) !important/);
    assert.doesNotMatch(styles, /\.monea-full-palette \[class\*="text-/);
    assert.doesNotMatch(styles, /\.monea-full-palette \[class\*="bg-\[#/);
});

test("standalone template previews render the requested template and event type", async () => {
    const { readFile } = await import("node:fs/promises");
    const previewPage = await readFile(new URL("../src/app/preview/page.tsx", import.meta.url), "utf8");

    assert.match(previewPage, /templateId: templateIdParam/);
    assert.match(previewPage, /templateIdParam === "anniversary-elegant"\s*\?\s*"anniversary"/);
});

test("Fortune Harmony countdown keeps its event date stable across timer updates", async () => {
    const { readFile } = await import("node:fs/promises");
    const hero = await readFile(
        new URL("../src/components/templates/fortune-harmony/HeroSection.tsx", import.meta.url),
        "utf8",
    );

    assert.match(hero, /useMemo\(\s*\(\) => wedding\.date \? new Date\(wedding\.date\) : new Date\(\),\s*\[wedding\.date\],?\s*\)/);
    assert.match(hero, /}, \[eventDate\]\)/);
});

test("M-03 keeps responsive names and presents its sections without decorative cards", async () => {
    const { readFile } = await import("node:fs/promises");
    const [hero, envelope, globalStyles, template, schedule, parents, location, gift, gallery] = await Promise.all([
        readFile(new URL("../src/components/templates/fortune-harmony/HeroSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/EntranceEnvelope.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/FortuneHarmony.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/ScheduleSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/ParentsSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/LocationSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/GiftSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/fortune-harmony/GallerySection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(hero, /coupleNamesLength = Array\.from\(`\$\{groomName\}\$\{brideName\}`\)\.length/);
    assert.match(hero, /coupleNameFontSize = Math\.min\(37, Math\.max\(15, 300 \/ coupleNamesLength\)\)/);
    assert.match(hero, /min-w-0 flex-col items-center justify-center p-1\.5 text-center sm:p-2/);
    assert.match(hero, /whitespace-nowrap font-kantumruy text-xl font-bold leading-tight tracking-\[-0\.04em\].*sm:text-2xl/);
    assert.match(hero, /flex-nowrap items-center justify-center gap-2 text-\[#2d352b\]/);
    assert.match(hero, /<OneLineName name=\{groomName\} className="min-w-0 flex-1 text-center" \/>/);
    assert.match(hero, /<OneLineName name=\{brideName\} className="min-w-0 flex-1 text-center" \/>/);
    assert.match(hero, /<Heart aria-hidden="true"/);
    assert.match(envelope, /m05-font-name flex w-full items-center justify-center gap-2/);
    assert.match(envelope, /<OneLineName name=\{groomName\} className="min-w-0 flex-1 text-center" \/>/);
    assert.match(envelope, /<OneLineName name=\{brideName\} className="min-w-0 flex-1 text-center" \/>/);
    assert.match(envelope, /<span aria-hidden="true" className="shrink-0 text-amber-300">♡<\/span>/);
    assert.match(template, /m05-type-system fortune-harmony-type-system/);
    assert.match(globalStyles, /\.fortune-harmony-type-system \.fh-khmer-safe\s*\{\s*padding-block:\s*\.45em \.5em;\s*line-height:\s*2\.1;\s*\}/);
    assert.match(template, /<p className="fh-khmer-safe whitespace-pre-line break-words text-sm/);
    assert.doesNotMatch(schedule, /font-khmer-moul text-lg text-\[#4d5649\] sm:text-2xl/);
    assert.match(schedule, /space-y-3 before:pointer-events-none before:absolute before:bottom-7 before:left-\[12px\] before:top-7 before:w-0\.5 before:bg-\[#8ea07a\]\/80/);
    assert.match(schedule, /<div className="py-1 space-y-1">/);
    assert.match(schedule, /group relative ml-3 min-w-0 pl-6 sm:ml-4 sm:pl-7/);
    assert.doesNotMatch(schedule, /border-l-2 border-\[#8ea07a\]\/80/);
    assert.match(schedule, /<span className="fh-khmer-safe">\{item\.time\}<\/span>/);
    assert.match(parents, /<p className="fh-khmer-safe">/);
    assert.match(location, /<span className="fh-khmer-safe min-w-0 text-center">/);
    assert.match(gift, /<span className="fh-khmer-safe">បានចម្លង<\/span>/);
    assert.match(template, /<GuestbookSection wedding=\{wedding\} khmerSpacing unboxed \/>/);
    assert.doesNotMatch(template, /max-w-\[540px\].*shadow-2xl/);
    assert.doesNotMatch(template, /rounded-\[2rem\] border border-amber-300\/30 bg-\[#4b0b13\]\/70/);
    assert.doesNotMatch(parents, /rounded-2xl border border-\[#d9d1bf\].*shadow-md/);
    assert.doesNotMatch(parents, /rounded-3xl border border-\[#d9d1bf\].*shadow-md/);
    assert.doesNotMatch(schedule, /rounded-full border border-\[#d9d1bf\].*shadow-md/);
    assert.doesNotMatch(schedule, /bg-\[#fffdf8\]\/80 border border-\[#d9d1bf\] rounded-2xl p-4 shadow-md/);
    assert.doesNotMatch(location, /bg-\[#fffdf8\]\/85 border border-\[#d9d1bf\] rounded-3xl p-5 shadow-md/);
    assert.doesNotMatch(gift, /bg-\[#fffdf8\]\/80 border border-\[#d9d1bf\] rounded-3xl p-5 shadow-md/);
    assert.match(gift, /bg-white rounded-2xl/);
    assert.match(gift, /onClick=\{\(\) => acc\.accountNumber && handleCopy/);
    assert.match(location, /href=\{directUrl\}/);
    assert.match(gallery, /onClick=\{\(\) => setSelectedPhoto\(idx\)\}/);
    assert.match(gallery, /AnimatePresence[\s\S]*?selectedPhoto !== null/);
    assert.doesNotMatch(envelope + hero, /m05-foil|font-moulpali/);
});

test("modern invitation templates use scoped Khmer-safe typography spacing", async () => {
    const { readFile } = await import("node:fs/promises");
    const [globalStyles, legacy, modern, blossom, emerald, anniversary] = await Promise.all([
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/ModernMinimal.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/BlossomRomance.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/EmeraldGarden.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/AnniversaryElegant.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(globalStyles, /\.khmer-readable-type-system \.font-khmer-moul,[\s\S]*?padding-block:\s*\.45em \.5em;[\s\S]*?line-height:\s*2\.1;/);
    assert.match(globalStyles, /\.khmer-readable-type-system \.font-kantumruy\s*\{[\s\S]*?line-height:\s*1\.9;/);
    assert.match(legacy, /\.font-khmer-content\s*\{[^}]*line-height:\s*2\.2;/);
    assert.doesNotMatch(legacy, /khmer-readable-type-system/);
    for (const [name, source] of Object.entries({ modern, blossom, emerald, anniversary })) {
        assert.match(source, /khmer-readable-type-system/, `${name} should scope the Khmer typography rules`);
    }
});

test("M-02 invitation uses the requested wording and Suwannaphum font", async () => {
    const { readFile } = await import("node:fs/promises");
    const [letter, styles] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/LetterSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

    assert.match(letter, /border-y border-\[#cfc5af\][^"]*text-center/);
    assert.match(letter, /font-suwannaphum[^"]*text-\[#77613a\]">[\s\S]*?មានកិត្តិយសសូមគោរពអញ្ជើញ/);
    assert.match(letter, /font-suwannaphum[^"]*text-\[#77613a\] sm:mt-3/);
    assert.match(letter, /m02-invitation-copy font-suwannaphum font-normal text-\[#37352f\]/);
    assert.match(letter, /និងប្រិយមិត្តជិតឆ្ងាយទាំងអស់ ចូលរួមជាអធិបតី និងជាសាក្សីក្នុងពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍/);
    assert.match(styles, /\.modern-minimal-content \.m02-invitation-copy\.font-suwannaphum\s*\{\s*font-family: 'Suwannaphum', 'Kantumruy Pro', sans-serif !important;/);
});

test("M-02 calendar save action uses Suwannaphum", async () => {
    const { readFile } = await import("node:fs/promises");
    const [countdown, styles] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/CountdownSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

    assert.match(countdown, /className="m02-calendar-link[^"]*font-suwannaphum/);
    assert.match(styles, /\.modern-minimal-content \.m02-calendar-link\.font-suwannaphum\s*\{\s*font-family: 'Suwannaphum', 'Kantumruy Pro', sans-serif !important;/);
});

test("M-02 gallery thumbnails fade in after loading without scroll-triggered card motion", async () => {
    const { readFile } = await import("node:fs/promises");
    const gallery = await readFile(
        new URL("../src/components/templates/modern-minimal/GallerySection.tsx", import.meta.url),
        "utf8",
    );

    assert.match(gallery, /onLoad=\{\(\) => setIsLoaded\(true\)\}/);
    assert.match(gallery, /transition-\[opacity,transform\] duration-500/);
    assert.doesNotMatch(gallery, /<m\.button/);
    assert.equal((gallery.match(/whileInView=/g) || []).length, 1);
    assert.match(gallery, /transition-\[transform,box-shadow\] duration-200 active:scale-\[0\.98\]/);
    assert.match(gallery, /loading="lazy"/);
});

test("M-02 envelope reveal avoids expensive blur and hero bounce animations", async () => {
    const { readFile } = await import("node:fs/promises");
    const [envelope, hero] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/EntranceEnvelope.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/modern-minimal/HeroSection.tsx", import.meta.url), "utf8"),
    ]);

    assert.doesNotMatch(envelope, /filter: ['"]blur\(/);
    assert.match(envelope, /y: -8/);
    assert.doesNotMatch(hero, /animate-bounce/);
});

test("M-02 hides the floating music control while the gallery lightbox is open", async () => {
    const { readFile } = await import("node:fs/promises");
    const [gallery, template, music] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/GallerySection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/ModernMinimal.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/modern-minimal/BackgroundMusic.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(gallery, /onLightboxOpenChange\?\.\(true\)/);
    assert.match(gallery, /onLightboxOpenChange\?\.\(false\)/);
    assert.match(template, /showControl=\{!isGalleryLightboxOpen\}/);
    assert.match(music, /if \(!audioUrl \|\| !showControl\) return null/);
});

test("admin master wedding rows show creation date and hour/minute in Cambodia time", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(
        new URL("../src/app/admin/master/weddings/page.tsx", import.meta.url),
        "utf8",
    );

    assert.match(page, /hour: "2-digit",\s*minute: "2-digit",\s*hourCycle: "h23"/);
    assert.match(page, /\\d\{2\}:\\d\{2\}\(\?::\\d\{2\}\(\?:\\\.\\d\+\)\?\)\?\$\/\.test\(timestamp\)\s*\?\s*`\$\{timestamp\}Z`/);
    assert.match(page, /formatCambodiaDate\(date,/);
    assert.match(page, /function formatWeddingCreatedAt\(value: unknown\)/);
    assert.equal((page.match(/formatWeddingCreatedAt\(w\.createdAt\)/g) || []).length, 2);
    assert.equal((page.match(/បង្កើត៖ \{createdAt\}/g) || []).length, 2);
});

test("M-02 countdown handles missing or invalid event dates", async () => {
    const { readFile } = await import("node:fs/promises");
    const countdown = await readFile(new URL("../src/components/templates/modern-minimal/CountdownSection.tsx", import.meta.url), "utf8");

    assert.match(countdown, /const hasValidEventDate = isValid\(eventDate\)/);
    assert.match(countdown, /if \(!hasValidEventDate\) return/);
    assert.match(countdown, /\{hasValidEventDate && \([\s\S]*?eventDate\.toISOString\(\)/);
});

test("M-05 countdown uses a one-line engagement label", async () => {
    const { readFile } = await import("node:fs/promises");
    const countdown = await readFile(new URL("../src/components/templates/modern-minimal/CountdownSection.tsx", import.meta.url), "utf8");

    assert.match(countdown, /const isEngagement = wedding\.eventType === "anniversary"/);
    assert.match(countdown, /whitespace-nowrap[^"]*text-\[clamp\(0\.65rem,3\.8vw,1\.5rem\)\]/);
    assert.match(countdown, /រាប់ថយក្រោយដល់ថ្ងៃភ្ជាប់ពាក្យ/);
    assert.match(countdown, /Countdown to the Engagement/);
});

test("M-02 cover couple names use Suwannaphum", async () => {
    const { readFile } = await import("node:fs/promises");
    const [envelope, styles] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/EntranceEnvelope.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

    assert.equal((envelope.match(/m05-font-name m02-cover-name font-suwannaphum/g) || []).length, 2);
    assert.match(styles, /\.modern-minimal-invitation \.m05-font-name\.m02-cover-name\.font-suwannaphum\s*\{\s*font-family: 'Suwannaphum', 'Kantumruy Pro', sans-serif !important;/);
});

test("M-02 thank-you message uses Suwannaphum", async () => {
    const { readFile } = await import("node:fs/promises");
    const [thankYou, styles] = await Promise.all([
        readFile(new URL("../src/components/templates/modern-minimal/ThankYouSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

    assert.match(thankYou, /m02-thankyou-copy font-suwannaphum[^"]*text-white\/90/);
    assert.match(styles, /\.modern-minimal-content \.m02-thankyou-copy\.font-suwannaphum\s*\{\s*font-family: 'Suwannaphum', 'Kantumruy Pro', sans-serif !important;/);
});

test("template cover and hero headings are exposed consistently to assistive technology", async () => {
    const { readFile } = await import("node:fs/promises");
    const fortuneHero = await readFile(
        new URL("../src/components/templates/fortune-harmony/HeroSection.tsx", import.meta.url),
        "utf8",
    );
    const fortuneEnvelope = await readFile(
        new URL("../src/components/templates/fortune-harmony/EntranceEnvelope.tsx", import.meta.url),
        "utf8",
    );
    const anniversaryHero = await readFile(
        new URL("../src/components/templates/anniversary-elegant/AnniversaryHero.tsx", import.meta.url),
        "utf8",
    );
    const anniversaryTemplate = await readFile(
        new URL("../src/components/templates/AnniversaryElegant.tsx", import.meta.url),
        "utf8",
    );
    const neaTemplate = await readFile(
        new URL("../src/components/templates/NeaM05.tsx", import.meta.url),
        "utf8",
    );
    const previewPage = await readFile(
        new URL("../src/app/preview/page.tsx", import.meta.url),
        "utf8",
    );
    const heroPaths = [
        "../src/components/templates/khmer-legacy/HeroSection.tsx",
        "../src/components/templates/modern-minimal/HeroSection.tsx",
        "../src/components/templates/blossom-romance/HeroSection.tsx",
        "../src/components/templates/emerald-garden/HeroSection.tsx",
    ];
    const coupleHeroes = await Promise.all(heroPaths.map((path) =>
        readFile(new URL(path, import.meta.url), "utf8"),
    ));

    assert.equal([...fortuneHero.matchAll(/<h1\b/g)].length, 1);
    assert.doesNotMatch(fortuneEnvelope, /<h1\b/);
    assert.equal([...anniversaryHero.matchAll(/<h1\b/g)].length, 1);
    assert.match(anniversaryHero, /aria-label=\{`\$\{groomName\} និង \$\{brideName\}`\}/);
    assert.match(anniversaryTemplate, /<h1 className="font-khmer-moul text-base leading-relaxed text-\[#F3E8D0\] drop-shadow-/);
    assert.match(neaTemplate, /role="heading"\s+aria-level=\{1\}/);
    for (const hero of coupleHeroes) {
        assert.equal([...hero.matchAll(/<h1\b/g)].length, 1);
        assert.match(hero, /aria-label=/);
        assert.match(hero, /aria-hidden="true"/);
    }
    assert.match(previewPage, /const ANNIVERSARY_PREVIEW_WEDDING: WeddingData/);
    assert.match(previewPage, /invitationTitle: "សិរីសួស្តី ពិធីភ្ជាប់ពាក្យ"/);
    assert.match(previewPage, /title: "ពិធីបំពាក់ចិញ្ចៀន"/);
});

test("M-07 envelope animates open and respects reduced-motion preferences", async () => {
    const { readFile } = await import("node:fs/promises");
    const anniversaryTemplate = await readFile(
        new URL("../src/components/templates/AnniversaryElegant.tsx", import.meta.url),
        "utf8",
    );

    assert.match(anniversaryTemplate, /useReducedMotion/);
    assert.match(anniversaryTemplate, /setIsOpening\(true\)/);
    assert.match(anniversaryTemplate, /window\.setTimeout\(\(\) => \{\s*setRevealed\(true\)/);
    assert.match(anniversaryTemplate, /animate=\{isOpening\s*\?\s*\{ y: -44, scale: 0\.42, rotate: 28, opacity: 0 \}/);
    assert.match(anniversaryTemplate, /animate=\{isOpening\s*\?\s*\{ y: -560, rotate: -7, opacity: 0 \}/);
    assert.match(anniversaryTemplate, /aspect-\[0\.7\] w-\[min\(70vw,280px\)\]/);
    assert.match(anniversaryTemplate, /សូមអញ្ជើញចូលរួមជាសាក្សី/);
    assert.match(anniversaryTemplate, /strokeDasharray="1 7"/);
    assert.match(anniversaryTemplate, /if \(shouldReduceMotion\) \{\s*setRevealed\(true\)/);
    assert.match(anniversaryTemplate, /const handleForceReveal = \(\) => \{/);
});

test("M-01 entrance UI is visible immediately in the phone preview", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8");
    const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

    assert.equal((source.match(/variants=\{containerVariants\}[\s\S]{0,80}initial=\{false\}/g) || []).length, 1);
    assert.match(source, /សិរីមង្គលអាពាហ៍ពិពាហ៍/);
    assert.match(source, /<h1 className="max-w-full whitespace-nowrap[^"]*text-\[clamp\(9px,3\.5vw,15px\)\]/);
    assert.match(source, /The Wedding Invitation/);
    assert.match(source, /formattedDateHero \|\| "សូមស្វាគមន៍"/);
    assert.match(source, /objectFit: isMobile \? 'contain' : 'cover'/);
    assert.match(source, /isOpeningEnvelope\.current = true/);
    assert.match(source, /setTimeout\(\(\) => \{\s*setRevealed\(true\)/);
    assert.doesNotMatch(source, /onTouchEnd=\{handleOpenEnvelope\}/);
    assert.match(source, /onClick=\{handleOpenEnvelope\}/);
    assert.match(source, /khmer-legacy-revealed-content/);
    assert.match(source, /flex-col items-center justify-center gap-3 sm:gap-5/);
    assert.doesNotMatch(source, /khmer-invite-starter-kit\/elements\/(?:wax-seal|crest)\.svg/);
    assert.doesNotMatch(source, /isEnvelopeOpening|perspective:1400px|rotateX=/);
    assert.match(source, /w-\[min\(88vw,360px\)\].*text-center \[text-shadow:0_2px_10px/);
    assert.doesNotMatch(source, /backgroundImage: "linear-gradient\(145deg,rgba\(255,255,255/);
    assert.match(source, /grid w-full max-w-full grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/);
    assert.match(source, /min-w-0 break-words text-right/);
    assert.match(source, /min-w-0 break-words text-left/);
    assert.match(source, /<Heart\s+aria-hidden="true"\s+className="h-3\.5 w-3\.5 shrink-0 fill-rose-300\/90 text-rose-200/);
    assert.match(source, /max-w-\[85%\] break-words font-kantumruy/);
    assert.match(source, /មានកិត្តិយសសូមគោរពអញ្ជើញ/);
    assert.match(source, /\{guestName\?\.trim\(\) && \([\s\S]{0,300}\{guestName\.trim\(\)\}/);
    assert.ok(source.indexOf('{formattedDateHero || "សូមស្វាគមន៍"}') < source.indexOf("{guestName.trim()}"));
    assert.ok(source.indexOf("{guestName.trim()}") < source.indexOf("មានកិត្តិយសសូមគោរពអញ្ជើញ"));
    assert.match(source, /fill-rose-300\/90 text-rose-200/);
    assert.match(source, /<HeroSection[\s\S]{0,100}guestName=\{guestName\}/);
    const hero = await readFile(new URL("../src/components/templates/khmer-legacy/HeroSection.tsx", import.meta.url), "utf8");
    const invitation = await readFile(new URL("../src/components/templates/khmer-legacy/KhmerInvitation.tsx", import.meta.url), "utf8");
    assert.match(invitation, /w-full max-w-full \[container-type:inline-size\]/);
    assert.match(invitation, /<h2 className="whitespace-nowrap[^"]*text-\[clamp\(12px,5cqi,48px\)\]/);
    assert.doesNotMatch(invitation, /rounded-2xl border border-\[#D4AF37\]\/25 bg-\[#FAF7F0\]/);
    assert.match(invitation, /grid max-w-2xl grid-cols-2 divide-x divide-\[#D4AF37\]\/25/);
    assert.match(invitation, /មាតាបិតាកូនកំលោះ/);
    assert.match(invitation, /មាតាបិតាកូនក្រមុំ/);
    assert.match(invitation, /លោកស្រី /);
    assert.match(hero, /guestName\?: string/);
    assert.match(hero, /guestName\?\.trim\(\)/);
    assert.ok(hero.indexOf("{formattedDateHero}") < hero.indexOf("{guestName.trim()}"));
    assert.ok(hero.indexOf("{guestName.trim()}") < hero.indexOf("<m.button"));
    assert.doesNotMatch(hero, /guestName\.trim\(\)[\s\S]{0,200}wedding\.brideName/);
    assert.match(hero, /!grid w-full grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\][\s\S]{0,120}!text-\[clamp\(13px,4vw,18px\)\]/);
    assert.match(hero, /<h3 className="whitespace-nowrap[^"]*text-\[clamp\(8px,2\.8vw,14px\)\]/);
    assert.match(hero, /min-w-0 break-words text-right/);
    assert.match(hero, /min-w-0 break-words text-left/);
    assert.match(source, /ចុចដើម្បីមើលធៀប/);
    assert.doesNotMatch(source, /Welcome Invitation|ឯកឧត្តម លោកជំទាវ លោក លោកស្រី/);
    assert.match(styles, /\.khmer-legacy-revealed-content \[style\*="opacity: 0;"\]/);
    assert.doesNotMatch(source, /h-16 w-full max-w-\[180px\] rounded-full bg-black\/10/);

    const animations = await readFile(
        new URL("../src/components/templates/khmer-legacy/animations.ts", import.meta.url),
        "utf8",
    );
    assert.match(animations, /pointerEvents: 'none'/);
});

test("maintenance mode checks the API worker and gives visitors a way to recheck service status", async () => {
    const { readFile } = await import("node:fs/promises");
    const [listener, page] = await Promise.all([
        readFile(new URL("../src/components/layout/SystemStatusListener.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/maintenance/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(listener, /fetch\(getApiUrl\("\/system\/status"\)/);
    assert.doesNotMatch(listener, /fetch\("\/api\/system\/status"/);
    assert.match(listener, /window\.location\.replace\('\/maintenance'\)/);
    assert.match(page, /ពិនិត្យស្ថានភាពម្ដងទៀត/);
    assert.match(page, /window\.location\.replace\('\/'\)/);
});

test("M-05 programme content grows with the page instead of clipping in a nested scroller", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
    ]);
    const programmeList = sections.match(/className="([^"]*m05-programme-list[^"]*)"/)?.[1];

    assert.ok(programmeList, "M-05 programme list should be present");
    assert.doesNotMatch(programmeList, /max-h-|overflow-y-auto|overflow-hidden/);
    assert.match(programmeList, /md:pr-4/);
    assert.match(sections, /className="m05-programme-layout relative mx-auto grid max-w-\[1500px\] gap-10"/);
    assert.doesNotMatch(sections, /m05-programme-heading|config\.labels\.scheduleTitle \|\| text\.programmeTitle/);
    assert.doesNotMatch(sections, /md:grid-cols-\[minmax\(0,\.9fr\)_minmax\(0,1\.1fr\)\]/);
    assert.match(template, /#m05-programme \{ container-type: inline-size; \}/);
    assert.match(template, /#m05-programme \.m05-programme-layout \{\s*grid-template-columns: minmax\(0,1fr\);/);
});

test("M-05 countdown numbers size to the invitation section instead of the browser viewport", async () => {
    const { readFile } = await import("node:fs/promises");
    const sections = await readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8");

    assert.match(sections, /id="m05-countdown"[^>]*\[container-type:inline-size\]/);
    assert.match(sections, /m05-countdown-number whitespace-nowrap font-serif-elegant text-\[clamp\(1\.5rem,9cqi,4rem\)\] tabular-nums/);
    assert.match(sections, /<h2 className="m05-section-title m05-khmer-safe whitespace-nowrap font-khmer-moul text-\[clamp\(0\.65rem,5cqi,1\.5rem\)\] text-\[#f6edda\]">\{text\.countdownTitle\}<\/h2>/);
    assert.doesNotMatch(sections, /m05-countdown-number[^"]*sm:text-/);
});

test("M-05 engagement invitation English title stays on one line", async () => {
    const { readFile } = await import("node:fs/promises");
    const template = await readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8");

    assert.match(template, /className="m05-cover-english-title mt-1 max-w-full whitespace-nowrap font-pinyon-script text-\[clamp\(0\.7rem,4vw,1\.125rem\)\] text-\[#e8d3a7\]">\s*\{englishInvitationTitle\}/);
});

test("M-05 revealed controls show the sound button only when music is available", async () => {
    const { readFile } = await import("node:fs/promises");
    const template = await readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8");
    const controls = template.match(/\{stage === 6 && \([\s\S]*?<\/header>\s*\)\}/)?.[0] || "";

    assert.match(controls, /h-7 min-w-9[^"]*text-\[9px\]/);
    assert.match(controls, /\{musicUrl && \([\s\S]*?type="button"[\s\S]*?onClick=\{toggleMusic\}/);
    assert.doesNotMatch(controls, /disabled=\{!musicUrl\}/);
});

test("M-05 candle hint and engagement gallery title stay on one line", async () => {
    const { readFile } = await import("node:fs/promises");
    const sections = await readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8");

    assert.match(sections, /inline-flex w-\[min\(92%,42rem\)\][^"]*whitespace-nowrap[^"]*text-\[clamp\(0\.5rem,2\.7cqi,0\.875rem\)\]/);
    assert.match(sections, /\{text\.candleHint\}/);
    assert.match(sections, /m05-section-title m05-khmer-safe max-w-full whitespace-nowrap font-khmer-moul text-\[clamp\(0\.65rem,4\.5cqi,1\.5rem\)\]/);
    assert.match(sections, /\{wedding\.themeSettings\?\.customLabels\?\.galleryTitle/);
});

test("M-05 guestbook title stays on one line without changing other templates", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, guestbook] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/shared/GuestbookSection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(sections, /<GuestbookSection wedding=\{wedding\} tone="dark" titleOneLine unboxed \/>/);
    assert.match(guestbook, /titleOneLine \? "max-w-full whitespace-nowrap text-\[clamp\(0\.65rem,3\.6vw,1\.5rem\)\]" : "break-words text-xl sm:text-2xl"/);
});

test("activity editor puts time before title and omits the details field", async () => {
    const { readFile } = await import("node:fs/promises");
    const step3 = await readFile(
        new URL("../src/app/dashboard/design/components/Step3Time.tsx", import.meta.url),
        "utf8",
    );

    assert.ok(step3.indexOf('htmlFor={`activity-time-${index}`}') < step3.indexOf('htmlFor={`activity-title-${index}`}'));
    assert.match(step3, /sm:grid-cols-\[150px_minmax\(0,1fr\)\]/);
    assert.doesNotMatch(step3, /activity-description|updateActivity\(index, "description"/);
});

test("photo section cards stay readable in the narrow wizard panel", async () => {
    const { readFile } = await import("node:fs/promises");
    const gallery = await readFile(
        new URL("../src/app/dashboard/design/components/sections/GeneralGallerySection.tsx", import.meta.url),
        "utf8",
    );

    assert.match(gallery, /grid grid-cols-1 gap-2\.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3/);
    assert.match(gallery, /h-28 w-24 shrink-0 bg-muted sm:h-auto sm:w-full/);
    assert.match(gallery, /flex min-w-0 overflow-hidden rounded-xl border border-border bg-background sm:flex-col/);
    assert.match(gallery, /\{filledSectionCount\}\/\{photoLayout\.slots\.length\} ផ្នែកមានរូប/);
    assert.match(gallery, /title=\{slot\.locationHint\}/);
    assert.match(gallery, /line-clamp-2 text-xs font-bold leading-relaxed text-foreground/);
    assert.match(gallery, /min-h-11 w-full items-center justify-center/);
    assert.doesNotMatch(gallery, /min-h-8 text-\[10px\][\s\S]*?slot\.locationHint/);
});

test("mobile wizard navigation does not cover scrollable form content", async () => {
    const { readFile } = await import("node:fs/promises");
    const stepWizard = await readFile(
        new URL("../src/app/dashboard/design/components/StepWizard.tsx", import.meta.url),
        "utf8",
    );

    assert.match(stepWizard, /<div className="min-h-0 flex-1 overflow-y-auto[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Mobile navigation stays outside the scroll area[\s\S]*?<div className="flex flex-none[^"]*md:hidden"/);
    assert.doesNotMatch(stepWizard, /sticky bottom-0[\s\S]*?Mobile navigation stays outside/);
    assert.match(stepWizard, /pb-\[calc\(env\(safe-area-inset-bottom\)\+0\.5rem\)\] md:hidden/);
});

test("mobile template selection keeps its editor header compact and touch targets usable", async () => {
    const { readFile } = await import("node:fs/promises");
    const [designPage, stepWizard, step1] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/StepWizard.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(designPage, /"h-12 bg-white\/95/);
    assert.match(designPage, /className="h-11 w-11/);
    assert.match(stepWizard, /sticky top-0 z-20 flex h-10/);
    assert.match(step1, /hidden text-xs font-medium leading-relaxed text-muted-foreground sm:block/);
    assert.match(step1, /hidden text-center text-xs leading-relaxed text-muted-foreground font-kantumruy sm:block/);
});

test("step one selection always records the event type and selected template", async () => {
    const { readFile } = await import("node:fs/promises");
    const [step1, designPage, khmerLocale, englishLocale] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/km.json", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/en.json", import.meta.url), "utf8"),
    ]);

    assert.match(step1, /availability \? enabledTemplateIds : undefined/);
    assert.match(step1, /if \(wedding\.eventType !== activeEventType\) \{\s*updateEventType\(activeEventType, visibleTemplates\.map/);
    assert.match(designPage, /currentStep === 1\s*\?\s*Boolean\(wedding\.eventType && wedding\.templateId\)/);
    assert.match(khmerLocale, /"wedding": "រៀបការ",\s*"anniversary": "ភ្ជាប់ពាក្យ"/);
    assert.match(englishLocale, /"wedding": "Wedding",\s*"anniversary": "Engagement"/);
});

test("wizard Back buttons remain touchable during loads and uploads", async () => {
    const { readFile } = await import("node:fs/promises");
    const stepWizard = await readFile(
        new URL("../src/app/dashboard/design/components/StepWizard.tsx", import.meta.url),
        "utf8",
    );

    assert.match(stepWizard, /const handleBack = \(\) => \{\s*if \(!savingNext && setStep\) \{\s*setStep\(Math\.max\(1, currentStep - 1\)\)/);
    assert.match(stepWizard, /min-h-12 min-w-0 flex-1 touch-manipulation/);
    assert.match(stepWizard, /min-h-12 touch-manipulation/);
    assert.equal(stepWizard.match(/onClick=\{handleBack\}\s*disabled=\{savingNext\}/g)?.length, 2);
    assert.doesNotMatch(stepWizard, /onClick=\{handleBack\}[\s\S]*?disabled=\{savingNext \|\| loading \|\| isUploading\}/);
});

test("step five does not expose font customization controls", async () => {
    const { readFile } = await import("node:fs/promises");
    const step5 = await readFile(
        new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url),
        "utf8",
    );

    assert.doesNotMatch(step5, /id: 'typography'|step5-typography|NEA_M05_FONT_OPTIONS/);
    assert.doesNotMatch(step5, /updateTheme\('fontStyle'|updateTheme\(key, font\.id\)/);
    assert.match(step5, /activeAccordion === 'theme' \|\| activeAccordion === 'typography'[\s\S]*?\? 'payment'[\s\S]*?: activeAccordion \|\| 'payment'/);
});

test("step five hides theme color customization from users", async () => {
    const { readFile } = await import("node:fs/promises");
    const step5 = await readFile(
        new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url),
        "utf8",
    );

    assert.doesNotMatch(step5, /\{ id: 'theme', label: 'ពណ៌'/);
    assert.match(step5, /id="step5-theme"[\s\S]*?hideWhenClosed[\s\S]*?isOpen=\{false\}/);
    assert.match(step5, /activeAccordion === 'theme' \|\| activeAccordion === 'typography'[\s\S]*?\? 'payment'/);
});

test("lunar date input appears directly under the event date input", async () => {
    const { readFile } = await import("node:fs/promises");
    const step3 = await readFile(
        new URL("../src/app/dashboard/design/components/Step3Time.tsx", import.meta.url),
        "utf8",
    );

    const eventDateIndex = step3.indexOf('{/* 1. Date Picker */}');
    const lunarDateIndex = step3.indexOf('id="wedding-lunar-date"');
    const startTimeIndex = step3.indexOf('{/* 2. Start Time Picker */}');
    assert.ok(eventDateIndex < lunarDateIndex && lunarDateIndex < startTimeIndex);
    assert.match(step3, /value=\{wedding\.themeSettings\?\.lunarDate \|\| ""\}[\s\S]*?onDebouncedChange=\{\(val\) => updateTheme\("lunarDate", val\)\}/);
    assert.doesNotMatch(step3, /showExtraDetails|បន្ថែមព័ត៌មានកម្មវិធី/);
});

test("M-05 couple title stays on one line and layout responds to invitation width", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(sections, /id="m05-couple"[\s\S]*?\[container-type:inline-size\]/);
    assert.match(sections, /m05-section-title m05-khmer-safe mt-3 whitespace-nowrap font-khmer-moul text-\[clamp\(0\.8rem,4\.2cqi,1\.5rem\)\]/);
    assert.match(sections, /<OneLineName name=\{wedding\.groomName\} className="m05-foil m05-khmer-safe mt-2 font-moulpali text-\[clamp\(0\.7rem,3\.5cqi,1rem\)\]" \/>/);
    assert.match(sections, /<OneLineName name=\{wedding\.brideName\} className="m05-foil m05-khmer-safe mt-2 font-moulpali text-\[clamp\(0\.7rem,3\.5cqi,1rem\)\]" \/>/);
    assert.match(template, /@container \(min-width: 760px\) \{\s*#m05-couple \.m05-couple-layout \{\s*grid-template-columns: minmax\(0,\.9fr\) minmax\(0,1\.1fr\);/);
});

test("M-05 cover displays both couple names on one responsive line", async () => {
    const { readFile } = await import("node:fs/promises");
    const template = await readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8");

    assert.match(template, /m05-name-couple-row flex w-full min-w-0 items-center justify-center gap-1/);
    assert.match(template, /m05-name-inline min-w-0 flex-1 whitespace-nowrap text-right text-\[clamp\(8px,4\.7cqi,16px\)\]/);
    assert.match(template, /m05-name-inline min-w-0 flex-1 whitespace-nowrap text-left text-\[clamp\(8px,4\.7cqi,16px\)\]/);
    assert.match(template, /m05-cover-ceremony flex w-full flex-col items-center/);
    assert.match(template, /className="mt-2 w-full"[\s\S]*?<NameMark[\s\S]*?oneLine/);
    assert.match(template, /<NameMark[\s\S]*?groom=\{groomName\}[\s\S]*?bride=\{brideName\}[\s\S]*?oneLine/);
});

test("M-05 candlelight couple names stay on one line at invitation width", async () => {
    const { readFile } = await import("node:fs/promises");
    const sections = await readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8");

    assert.match(sections, /id="m05-candlelight"[^>]*\[container-type:inline-size\]/);
    assert.match(sections, /<CoupleNamesLine groom=\{wedding\.groomName\} bride=\{wedding\.brideName\} separator="♡" className="m05-khmer-safe mt-4 font-moulpali text-\[clamp\(0\.8rem,5cqi,1\.5rem\)\]/);
    assert.doesNotMatch(sections, /m05-khmer-safe mt-4[^"]*sm:text-3xl/);
});

test("M-05 invitation card color control updates the envelope card and live preview", async () => {
    const { readFile } = await import("node:fs/promises");
    const [settings, previewSync, template, wizard, validation, weddingRoute] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/PreviewSync.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/lib/validations/wedding.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/routers/wedding.ts", import.meta.url), "utf8"),
    ]);

    assert.match(settings, /key: "m05CardColor", label: "ពណ៌សំបុត្រ"/);
    assert.match(settings, /m05CardColor: ""/);
    assert.match(previewSync, /const m05CardColor = settings\?\.m05CardColor/);
    assert.match(previewSync, /m05CardColor: currentSettings\.m05CardColor/);
    assert.equal((template.match(/backgroundColor: "var\(--m05-card-surface\)"/g) || []).length, 2);
    assert.match(template, /"--m05-card-surface": cardSurface/);
    assert.match(template, /\.m05-template \.m05-card-couple \{ color: var\(--m05-card-ink\) !important; \}/);
    assert.match(wizard, /themeSettings:\s*data\.themeSettings/);
    assert.match(wizard, /saveChanges\(wedding,\s*\{\s*silent:\s*true\s*\}\)/);
    assert.match(validation, /themeSettings:\s*z\.any\(\)\.optional\(\)/);
    assert.match(weddingRoute, /const mergedTheme: any = sanitizedBody\.themeSettings !== undefined/);
    assert.match(weddingRoute, /updateData\.themeSettings = JSON\.stringify\(mergedTheme\)/);
});

test("M-06 invitation card color updates its main paper surfaces and live preview", async () => {
    const { readFile } = await import("node:fs/promises");
    const [settings, previewSync, template, hero, parents, schedule, gallery, location] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/PreviewSync.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/EmeraldGarden.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/emerald-garden/HeroSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/emerald-garden/ParentsSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/emerald-garden/ScheduleSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/emerald-garden/GallerySection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/emerald-garden/LocationSection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(settings, /isEmeraldGarden && \([\s\S]*?emeraldCardColor/);
    assert.match(previewSync, /const emeraldCardColor = settings\?\.emeraldCardColor/);
    assert.match(previewSync, /emeraldCardColor: currentSettings\.emeraldCardColor/);
    assert.match(template, /"--emerald-card-surface": paperStyles\["--monea-paper-color"\]/);
    for (const section of [template, hero, parents, schedule, gallery, location]) {
        assert.match(section, /backgroundColor: "var\(--emerald-card-surface\)"/);
    }
});

test("M-07 invitation card color updates the formal invitation card with readable text", async () => {
    const { readFile } = await import("node:fs/promises");
    const [settings, previewSync, invitation] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/PreviewSync.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/anniversary-elegant/AnniversaryInvitation.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(settings, /isAnniversaryElegant && \([\s\S]*?m07CardColor/);
    assert.match(previewSync, /const m07CardColor = settings\?\.m07CardColor/);
    assert.match(previewSync, /m07CardColor: currentSettings\.m07CardColor/);
    assert.match(invitation, /const cardColor = getTemplatePaperStyles\(/);
    assert.match(invitation, /backgroundColor: cardColor/);
    assert.match(invitation, /"--anniversary-card-ink": getContrastingTextColor\(cardColor\)/);
});

test("M-08 invitation content sits directly on its editable paper background", async () => {
    const { readFile } = await import("node:fs/promises");
    const [settings, previewSync, template, globalStyles, previewPage] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/PreviewSync.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/GardenEditorial.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
        readFile(new URL("../src/app/preview/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(template, /const paletteStyles = getTemplatePaletteStyles\(wedding\.themeSettings, "#A78337", "#FBF4E8"\)/);
    assert.match(template, /<div style=\{paletteStyles\} className="monea-full-palette/);
    assert.match(settings, /Boolean\(getTemplateConfig\(wedding\.templateId\)\)/);
    assert.doesNotMatch(settings, /gardenCardColor|m08CardColor/);
    assert.doesNotMatch(previewSync, /gardenCardColor|m08CardColor/);
    assert.match(template, /<main className="m08-invitation-page w-full max-w-none overflow-hidden bg-transparent">/);
    assert.doesNotMatch(template, /bg-\[linear-gradient\(180deg,rgba\(255,250,239,\.78\),rgba\(255,250,239,\.88\)\)\]/);
    assert.doesNotMatch(template, /gardenCardColor|m08CardColor|shadow-\[0_16px_70px_rgba\(88,65,35/);
    assert.match(template, /<div className="mx-auto max-w-md p-3 sm:p-4 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-5 lg:p-6">/);
    assert.match(template, /<div className="mb-4 flex items-start gap-3 px-1 py-3 lg:px-2 lg:py-4">/);
    assert.doesNotMatch(template, /rounded-\[1\.6rem\] border border-\[#c9a85a\]\/45 bg-gradient-to-br/);
    assert.doesNotMatch(template, /rounded-2xl border border-\[#c9a85a\]\/40 bg-gradient-to-br/);
    assert.doesNotMatch(template, /relative z-10 mx-auto flex min-h-\[min\(760px,calc\(100dvh-4rem\)\)\] w-full max-w-\[430px\].*rounded-\[2rem\].*shadow/);
    assert.match(template, /relative z-10 mx-auto flex min-h-\[min\(760px,calc\(100dvh-4rem\)\)\] w-full max-w-\[430px\].*rounded-none border-0 bg-transparent.*shadow-none/);
    assert.match(template, /<GuestbookSection wedding=\{wedding\} khmerSpacing unboxed sectionClassName="border-t border-\[#b8944c\]\/35" \/>/);
    assert.match(template, /<footer className="bg-transparent px-6 py-10 text-center text-\[#566049\] sm:py-12 lg:px-12 lg:py-16">/);
    assert.match(globalStyles, /\.monea-paper-canvas section\[class\*="bg-gradient-to-b"\]\[class\*="from-\[#f"\]/);
    assert.match(globalStyles, /\.monea-paper-canvas \.m08-invitation-page > section\[class\] \{\s*background-color: transparent !important;\s*background-image: none !important;/);
    assert.match(previewPage, /const usePhoneFrame = isStandalone && !isApprovalPreview/);
    assert.match(previewPage, /md:max-w-\[448px\] md:rounded-\[3\.25rem\] md:border-\[7px\] md:border-\[#252528\]/);
    assert.match(previewPage, /md:h-\[min\(956px,calc\(100svh-3rem\)\)\]/);
    assert.match(previewPage, /w-\[116px\][\s\S]*?md:block/);
    assert.match(previewPage, /: "relative w-full min-h-screen bg-background"/);
    assert.doesNotMatch(previewPage, /bg-slate-900 flex justify-center py-6 px-3/);
});

test("M-05 thank-you actions use an elegant, width-responsive unboxed layout", async () => {
    const { readFile } = await import("node:fs/promises");
    const sections = await readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8");
    const thankYou = sections.match(/<section id="m05-thank-you"[\s\S]*?(?=<\/section>)/)?.[0];

    assert.ok(thankYou, "M-05 thank-you section should be present");
    assert.match(thankYou, /\[container-type:inline-size\]/);
    assert.match(thankYou, /m05-share-actions mx-auto mt-8 grid w-full max-w-md grid-cols-1/);
    assert.match(thankYou, /@container \(min-width: 360px\)[\s\S]*?m05-share-actions[\s\S]*?grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
    assert.equal((thankYou.match(/border-b border-\[#c2a56f\]\/45/g) || []).length, 4);
    assert.match(thankYou, /<Sparkles className="h-5 w-5" strokeWidth=\{1\.2\} \/>/);
});

test("M-05 invitation words stack on narrow invitation canvases", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(sections, /id="m05-invitation-words"[\s\S]*?\[container-type:inline-size\]/);
    assert.match(sections, /m05-invitation-words-layout relative mx-auto grid max-w-\[1240px\] items-center gap-10/);
    assert.doesNotMatch(sections, /md:grid-cols-\[minmax\(260px,380px\)_minmax\(0,1fr\)\]/);
    assert.match(template, /@container \(min-width: 760px\) \{\s*#m05-invitation-words \.m05-invitation-words-layout \{\s*grid-template-columns: minmax\(260px,380px\) minmax\(0,1fr\);/);
});

test("M-05 venue details use the invitation width to select their layout", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(sections, /id="m05-venue"[^>]*\[container-type:inline-size\]/);
    assert.match(sections, /m05-venue-details relative mx-auto mt-6 grid w-full max-w-4xl gap-5 text-left/);
    assert.doesNotMatch(sections, /m05-venue-details[^"]*sm:grid-cols-2/);
    assert.match(template, /@container \(min-width: 600px\) \{\s*#m05-venue \.m05-venue-details \{\s*grid-template-columns: repeat\(2,minmax\(0,1fr\)\);/);
});

test("M-05 supporting sections avoid decorative cards and retain QR and media actions", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template, guestbook] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/shared/GuestbookSection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(template, /<InvitationEnvelope/);
    assert.match(sections, /<GuestbookSection wedding=\{wedding\} tone="dark" unboxed \/>/);
    assert.doesNotMatch(sections, /rounded-sm border border-\[#c8ad76\]\/35 bg-\[#1d2019\] p-1\.5 shadow-/);
    assert.doesNotMatch(sections, /rounded-sm border border-\[#b99b68\] p-2 shadow-/);
    assert.doesNotMatch(sections, /border border-\[#b89a60\]\/55 bg-\[#1d211b\]\/65 p-4 shadow-/);
    assert.doesNotMatch(sections, /rounded-xl p-\[6px\] shadow-/);
    assert.match(sections, /className="mx-auto flex aspect-square w-full max-w-52 items-center justify-center bg-white p-1"/);
    assert.match(sections, /onClick=\{\(\) => void saveQr\(qrSource, index\)\}/);
    assert.match(sections, /onClick=\{\(\) => setActiveImage\(index\)\}/);
    assert.match(sections, /galleryDisplayStyle === "polaroid" \? "aspect-square"/);
    assert.match(sections, /focus-visible:ring-2/);
    assert.match(sections, /downloadIcsFile\(/);
    assert.match(sections, /<iframe/);
    assert.match(guestbook, /unboxed = false/);
});

test("M-05 venue details use compact Khmer spacing on narrow screens", async () => {
    const { readFile } = await import("node:fs/promises");
    const [sections, template] = await Promise.all([
        readFile(new URL("../src/components/templates/NeaM05Sections.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/NeaM05.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(sections, /m05-venue-copy[^"]*text-sm[^"]*sm:text-base/);
    assert.match(sections, /m05-venue-copy[^"]*text-xs[^"]*sm:text-sm/);
    assert.match(template, /\.m05-template \.m05-venue-copy \{ padding-block: \.12em \.18em; line-height: 1\.7 !important; \}/);
});

test("accent backgrounds select a foreground with readable contrast", () => {
    const contrastRatio = (foreground, background) => {
        const luminance = (color) => {
            const channels = color.match(/[a-f\d]{2}/gi).map((channel) => {
                const value = Number.parseInt(channel, 16) / 255;
                return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
    };

    for (const accent of ["#4a543c", "#b18d55", "#2468ac", "#808080", "#ffffff", "#000000"]) {
        const foreground = getContrastingTextColor(accent);
        assert.ok(contrastRatio(foreground, accent) >= 4.5, `${foreground} is not readable on ${accent}`);
    }
    assert.equal(getContrastingTextColor("#ffffff"), "#000000");
    assert.equal(getContrastingTextColor("#000000"), "#ffffff");
});

test("wedding photo slot crop ratios match the labels shown in the editor", () => {
    assert.equal(getWeddingPhotoSlotAspectRatio("cover", "khmer-legacy"), 3 / 4);
    assert.equal(getWeddingPhotoSlotAspectRatio("couple", "khmer-legacy"), 4 / 3);
    assert.equal(getWeddingPhotoSlotAspectRatio("location", "khmer-legacy"), 4 / 5);
    assert.equal(getWeddingPhotoSlotAspectRatio("editorial1", "khmer-legacy"), 4 / 3);
    assert.equal(getWeddingPhotoSlotAspectRatio("editorial2", "khmer-legacy"), 16 / 9);
    assert.equal(getWeddingPhotoSlotAspectRatio("locationBackup", "khmer-legacy"), 4 / 5);
    assert.equal(getWeddingPhotoSlotAspectRatio("signature1", "khmer-legacy"), 3 / 4);
    assert.equal(getWeddingPhotoSlotAspectRatio("groom", "modern-minimal"), 3 / 4);
    assert.equal(getWeddingPhotoSlotAspectRatio("bride", "anniversary-elegant"), 1);
});

test("main invitation photos keep their configured slot when other slots are empty", () => {
    const wedding = {
        ...createWedding(),
        templateId: "anniversary-elegant",
        galleryItems: [
            { url: "https://cdn.example/cover.jpg", type: "IMAGE" },
            { url: "", type: "IMAGE" },
            { url: "https://cdn.example/location.jpg", publicId: "location", type: "IMAGE" },
            { url: "https://cdn.example/gift.jpg", publicId: "gift", type: "IMAGE" },
        ],
    };

    assert.equal(getWeddingPhotoAtSlot(wedding, "location")?.url, "https://cdn.example/location.jpg");
    assert.equal(getWeddingPhotoAtSlot(wedding, "gift")?.url, "https://cdn.example/gift.jpg");
    assert.equal(getWeddingHeroImage(wedding), "https://cdn.example/cover.jpg");
    assert.deepEqual(getWeddingPhotos(wedding).map(({ url }) => url), [
        "https://cdn.example/cover.jpg",
        "https://cdn.example/location.jpg",
        "https://cdn.example/gift.jpg",
    ]);
});

test("all uploaded photos remain available when some gallery entries lack a public ID", () => {
    const identifiedPhoto = {
        url: "https://cdn.example/identified.jpg",
        publicId: "identified",
        type: "IMAGE",
    };
    const legacyPhoto = {
        url: "https://cdn.example/legacy.jpg",
        type: "IMAGE",
    };
    const wedding = {
        ...createWedding(),
        galleryItems: [identifiedPhoto, legacyPhoto],
    };

    assert.deepEqual(getWeddingPhotos(wedding), [identifiedPhoto, legacyPhoto]);
});

test("main couple photo fills optional template photo slots despite legacy hidden settings", () => {
    const wedding = {
        ...createWedding(),
        galleryItems: [
            { url: "https://cdn.example/cover.jpg", type: "IMAGE" },
            { url: "https://cdn.example/couple.jpg", type: "IMAGE" },
        ],
    };

    assert.equal(getWeddingSectionPhoto(wedding, "location")?.url, "https://cdn.example/couple.jpg");
    assert.equal(getWeddingSectionPhoto(wedding, "signature4")?.url, "https://cdn.example/couple.jpg");
    assert.equal(getWeddingSectionPhoto(wedding, "signature5")?.url, "https://cdn.example/couple.jpg");
    assert.equal(getWeddingSectionPhoto(wedding, "cover")?.url, "https://cdn.example/cover.jpg");
    assert.equal(getWeddingSectionPhoto({
        ...wedding,
        themeSettings: { hiddenPhotoSlots: [2] },
    }, "location")?.url, "https://cdn.example/couple.jpg");
    assert.equal(getWeddingSectionPhoto({
        ...wedding,
        themeSettings: { hiddenPhotoSlots: [1] },
    }, "location")?.url, "https://cdn.example/couple.jpg");
});

test("section photo fallbacks use each template's named secondary featured photo", () => {
    const wedding = {
        ...createWedding(),
        templateId: "modern-minimal",
        galleryItems: [
            { url: "https://cdn.example/cover.jpg", type: "IMAGE" },
            { url: "https://cdn.example/divider.jpg", type: "IMAGE" },
        ],
    };

    assert.equal(getWeddingSectionPhoto(wedding, "groom")?.url, "https://cdn.example/divider.jpg");
    assert.equal(getWeddingSectionPhoto({
        ...wedding,
        themeSettings: { hiddenPhotoSlots: [1] },
    }, "groom")?.url, "https://cdn.example/divider.jpg");
});

test("every template keeps uploaded photos connected to its photo display", async () => {
    const { readFile } = await import("node:fs/promises");
    const templateRoot = new URL("../src/components/templates/", import.meta.url);
    const [blossom, emerald, fortune, modern, anniversary, nea, khmerHook, khmerTemplate] = await Promise.all([
        readFile(new URL("blossom-romance/GallerySection.tsx", templateRoot), "utf8"),
        readFile(new URL("emerald-garden/GallerySection.tsx", templateRoot), "utf8"),
        readFile(new URL("fortune-harmony/GallerySection.tsx", templateRoot), "utf8"),
        readFile(new URL("modern-minimal/GallerySection.tsx", templateRoot), "utf8"),
        readFile(new URL("anniversary-elegant/AnniversaryGallery.tsx", templateRoot), "utf8"),
        readFile(new URL("NeaM05Sections.tsx", templateRoot), "utf8"),
        readFile(new URL("khmer-legacy/useKhmerLegacy.ts", templateRoot), "utf8"),
        readFile(new URL("KhmerLegacy.tsx", templateRoot), "utf8"),
    ]);

    for (const templateGallery of [blossom, emerald, fortune, modern, anniversary, nea]) {
        assert.match(templateGallery, /getWeddingPhotos\(wedding\)/);
    }
    assert.match(khmerHook, /wedding\?\.galleryItems\s*\|\|\s*\[\]/);
    assert.match(khmerTemplate, /<DynamicGallery[\s\S]*?galleryImages=\{galleryImages\}/);
});

test("gallery display choices map to distinct invitation layouts", () => {
    assert.equal(getGalleryDisplayStyle("unknown"), "masonry");
    assert.match(getGalleryContainerClass("masonry"), /grid-cols-2/);
    assert.match(getGalleryContainerClass("slider"), /snap-x.*overflow-x-auto/);
    assert.match(getGalleryContainerClass("polaroid"), /grid-cols-2/);
    assert.match(getGalleryCardClass("slider", 0), /snap-center/);
    assert.match(getGalleryCardClass("polaroid", 0), /pb-8/);
    assert.match(getGalleryImageClass("polaroid"), /absolute left-2 right-2 top-2 bottom-8/);
    assert.match(getGalleryCardClass("masonry", 0), /row-span-2/);
});

test("Google Maps embeds preserve dropped-pin coordinates from shared links", () => {
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps/place/Venue/@11.5564,104.9282,17z", "Venue"),
        "https://maps.google.com/maps?q=11.5564%2C104.9282&t=&z=16&ie=UTF8&iwloc=&output=embed",
    );
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps?ll=11.5564%2C104.9282", "Venue"),
        "https://maps.google.com/maps?q=11.5564%2C104.9282&t=&z=16&ie=UTF8&iwloc=&output=embed",
    );
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps/place/Venue/data=!3d11.5564!4d104.9282", "Venue"),
        "https://maps.google.com/maps?q=11.5564%2C104.9282&t=&z=16&ie=UTF8&iwloc=&output=embed",
    );
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps/place/Venue/@11.5550,104.9200,14z/data=!3d11.5564!4d104.9282", "Venue"),
        "https://maps.google.com/maps?q=11.5564%2C104.9282&t=&z=16&ie=UTF8&iwloc=&output=embed",
        "place coordinates must take precedence over the map viewport center",
    );
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps/@11.5550,104.9200,14z", "Venue"),
        "https://maps.google.com/maps?q=11.555%2C104.92&t=&z=16&ie=UTF8&iwloc=&output=embed",
        "viewport coordinates are only used when the URL has no pin coordinates",
    );
    assert.equal(
        getMapEmbedUrl("https://www.google.com/maps/place/Venue", "Venue"),
        "https://maps.google.com/maps?q=Venue&t=&z=16&ie=UTF8&iwloc=&output=embed",
    );
    assert.equal(
        getMapEmbedUrl(
            "https://www.google.com/maps/place/%E1%9E%9F%E1%9E%BB%E1%9E%81+%E1%9E%85%E1%9E%B7%E1%9E%93%E1%9F%92%E1%9E%8F%E1%9E%B6/@11.5269604,105.5628585,17z/data=!3d11.5269604!4d105.5628585",
            "សុខ ចិន្តា លក់ភេសជ្ជៈគ្រប់មុខ",
        ),
        "https://maps.google.com/maps?q=11.5269604%2C105.5628585&t=&z=16&ie=UTF8&iwloc=&output=embed",
        "the supplied short link's expanded URL must embed its exact pin coordinates",
    );
    assert.equal(
        getMapEmbedUrl(
            "https://www.google.com/maps/place/Venue/data=!4m2!3m1!1s0x310b8f8ef5e8d403:0x7250bef74c366a2a!18m1!1e1",
            "Venue",
        ),
        "https://www.google.com/maps?output=embed&cid=8237293687805471274",
        "place CIDs must be used when the expanded URL has no pin coordinates",
    );
    assert.equal(isGoogleMapsShortLink("https://maps.app.goo.gl/TsqhExYptMi5r4RQ7"), true);
    assert.equal(isGoogleMapsShortLink("https://www.google.com/maps/place/Venue"), false);
});

test("M-02 does not show a guessed map when a Google short link has not resolved", async () => {
    const { readFile } = await import("node:fs/promises");
    const locationSection = await readFile(
        new URL("../src/components/templates/modern-minimal/LocationSection.tsx", import.meta.url),
        "utf8",
    );
    assert.match(locationSection, /!isGoogleMapsShortLink\(mapLink\)/);
    assert.match(locationSection, /getDirectMapUrl\(mapLink, venueName\)/);
});

test("all invitation template location sections embed Google Maps", async () => {
    const { readFile } = await import("node:fs/promises");
    const locationSections = [
        "../src/components/templates/modern-minimal/LocationSection.tsx",
        "../src/components/templates/blossom-romance/LocationSection.tsx",
        "../src/components/templates/GardenEditorial.tsx",
        "../src/components/templates/anniversary-elegant/AnniversaryLocation.tsx",
        "../src/components/templates/fortune-harmony/LocationSection.tsx",
        "../src/components/templates/emerald-garden/LocationSection.tsx",
        "../src/components/templates/khmer-legacy/LocationMap.tsx",
        "../src/components/templates/NeaM05Sections.tsx",
    ];

    const sources = await Promise.all(locationSections.map((path) =>
        readFile(new URL(path, import.meta.url), "utf8"),
    ));
    for (const source of sources) {
        assert.match(source, /getMapEmbedUrl/);
        assert.match(source, /<iframe/);
    }
});

test("design wizard passes the wedding ID to template receipt submission", async () => {
    const { readFile } = await import("node:fs/promises");
    const [designPage, templateStep] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8"),
    ]);
    assert.match(designPage, /<Step1Template[^>]*weddingId=\{wedding\.id\}/);
    assert.match(templateStep, /អ្នកមិនចាំបាច់បញ្ចូល Wedding ID ដោយខ្លួនឯងទេ/);
});

test("template purchase requires confirmation before requesting a payment QR", async () => {
    const { readFile } = await import("node:fs/promises");
    const templateStep = await readFile(
        new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url),
        "utf8",
    );
    assert.match(templateStep, /const beginTemplatePurchase = \(tmpl:[\s\S]*?setPurchaseConfirmationTemplateId\(tmpl\.id\)/);
    assert.match(templateStep, /const confirmTemplatePurchase = \(\) => \{[\s\S]*?initiateTemplatePurchase\(template\)/);
    assert.match(templateStep, /តើអ្នកពិតជាចង់ទិញ Template នេះមែនទេ\?/);
});

test("free templates offer optional coffee support without changing free access", async () => {
    const { readFile } = await import("node:fs/promises");
    const templateStep = await readFile(
        new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url),
        "utf8",
    );
    assert.match(templateStep, /\{isFree && \([\s\S]*?<Coffee/);
    assert.match(templateStep, /moneaClient\.post<\{ qrCode\?: string \}>\("\/api\/payment\/support-qr"/);
    assert.match(templateStep, /Free template នៅតែអាចប្រើបានដោយមិនចាំបាច់បង់ប្រាក់/);
});

test("profile and payment QR controls fit mobile screens", async () => {
    const { readFile } = await import("node:fs/promises");
    const [dashboardShell, step1] = await Promise.all([
        readFile(new URL("../src/app/dashboard/_components/DashboardShell.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(dashboardShell, /className="h-11 w-11 shrink-0[^"]*md:hidden"/);
    assert.match(dashboardShell, /className="h-8 w-8 rounded-lg object-cover"/);
    assert.match(step1, /max-h-\[calc\(100dvh-env\(safe-area-inset-top\)-env\(safe-area-inset-bottom\)-1rem\)\][^"]*w-\[min\(calc\(100vw-1\.5rem\),460px\)\]/);
    assert.match(step1, /w-\[min\(220px,68vw\)\]/);
    assert.match(step1, /w-\[min\(240px,68vw\)\]/);
});

test("gallery is visible separately from optional music and video controls", async () => {
    const { readFile } = await import("node:fs/promises");
    const step4 = await readFile(
        new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url),
        "utf8",
    );

    assert.match(step4, /<GeneralGallerySection[\s\S]*?<button[\s\S]*?តន្ត្រី និងវីដេអូ/);
    assert.match(step4, /\{showExtraMedia && \([\s\S]*?<AudioVideoSection/);
    assert.doesNotMatch(step4, /\{showExtraMedia && <>[\s\S]*?<GeneralGallerySection/);
});

test("background music picker stays compact and usable on phones", async () => {
    const { readFile } = await import("node:fs/promises");
    const widget = await readFile(
        new URL("../src/components/ui/audio-upload-widget.tsx", import.meta.url),
        "utf8",
    );

    assert.match(widget, /role="tablist"/);
    assert.match(widget, /min-h-11 items-center justify-center gap-2 rounded-xl/);
    assert.match(widget, /id="background-song-select"/);
    assert.match(widget, /bg-slate-100 p-1\.5 dark:border-white\/10 dark:bg-slate-900/);
    assert.match(widget, /from-teal-50\/90 via-white to-slate-50[\s\S]*dark:from-teal-950\/40 dark:via-slate-900 dark:to-slate-950/);
    assert.match(widget, /<SelectContent className="max-h-\[min\(60vh,24rem\)\] rounded-xl border-slate-200 bg-white/);
    assert.match(widget, /dark:border-white\/10 dark:bg-slate-900 dark:text-slate-100/);
    assert.match(widget, /<SelectItem key=\{song\.id\} value=\{song\.id\} className="min-h-11 rounded-lg font-kantumruy text-sm/);
    assert.match(widget, /rounded-xl border border-slate-200\/80 bg-white\/80 p-3 dark:border-white\/10 dark:bg-white\/\[0\.04\]/);
    assert.doesNotMatch(widget, /<select[\s>]/);
    assert.match(widget, /preload="none"/);
    assert.match(widget, /selectedSongUrl/);
    assert.match(widget, /onClick=\{\(\) => void togglePreview\(\)\}/);
    assert.match(widget, /ទីតាំងចាក់បទភ្លេង/);
    assert.equal((widget.match(/<audio/g) || []).length, 2);
    assert.match(widget, /type="file"[\s\S]*?accept="audio\/\*"/);
});

test("skipping background music hides music controls across invitation templates", async () => {
    const { readFile } = await import("node:fs/promises");
    const paths = [
        "../src/components/templates/AnniversaryElegant.tsx",
        "../src/components/templates/BlossomRomance.tsx",
        "../src/components/templates/EmeraldGarden.tsx",
        "../src/components/templates/FortuneHarmony.tsx",
        "../src/components/templates/GardenEditorial.tsx",
        "../src/components/templates/NeaM05.tsx",
    ];
    const [templates, modernMusic, legacyMusic, mediaStep] = await Promise.all([
        Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8"))),
        readFile(new URL("../src/components/templates/modern-minimal/BackgroundMusic.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/khmer-legacy/BackgroundMusic.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url), "utf8"),
    ]);

    for (const template of templates) {
        assert.match(template, /musicUrl &&/);
    }
    assert.match(templates[5], /\{musicUrl && \([\s\S]*?aria-label=\{isPlaying \? text\.pauseMusic : text\.playMusic\}/);
    assert.doesNotMatch(templates[5], /disabled=\{!musicUrl\}/);
    assert.match(modernMusic, /if \(!audioUrl \|\| !showControl\) return null/);
    assert.match(legacyMusic, /if \(!audioUrl\) return null/);
    assert.match(mediaStep, /បើរំលង ប៊ូតុងសំឡេងនឹងមិនបង្ហាញលើធៀបការឡើយ/);
});

test("dashboard notification popover stays within the mobile viewport", async () => {
    const { readFile } = await import("node:fs/promises");
    const notificationBell = await readFile(
        new URL("../src/app/dashboard/_components/NotificationBell.tsx", import.meta.url),
        "utf8",
    );

    assert.match(notificationBell, /side="bottom"/);
    assert.match(notificationBell, /sideOffset=\{8\}/);
    assert.match(notificationBell, /collisionPadding=\{12\}/);
    assert.match(notificationBell, /w-\[min\(20rem,calc\(100vw-1\.5rem\)\)\]/);
});

test("invitation center action buttons fit narrow screens", async () => {
    const { readFile } = await import("node:fs/promises");
    const invitationCenter = await readFile(
        new URL("../src/components/dashboard/InvitationCenter.tsx", import.meta.url),
        "utf8",
    );

    assert.match(invitationCenter, /grid min-w-0 grid-cols-2 gap-2/);
    assert.match(invitationCenter, /w-full min-w-0 gap-1 rounded-2xl/);
    assert.match(invitationCenter, /viewPublicShort/);
    assert.match(invitationCenter, /aria-label=\{t\("dashboard\.quickActions\.viewPublic"\)\}/);
});

test("invitation center share button keeps its label on one line", async () => {
    const { readFile } = await import("node:fs/promises");
    const invitationCenter = await readFile(
        new URL("../src/components/dashboard/InvitationCenter.tsx", import.meta.url),
        "utf8",
    );

    assert.match(invitationCenter, /flex flex-col items-stretch gap-3 sm:flex-row/);
    assert.match(invitationCenter, /w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap/);
});

test("brand wordmark defaults to MONEO independently of the UI locale", async () => {
    const { readFile } = await import("node:fs/promises");
    const logo = await readFile(
        new URL("../src/components/ui/MoneaLogo.tsx", import.meta.url),
        "utf8",
    );
    const footer = await readFile(
        new URL("../src/components/landing/StaticSections.tsx", import.meta.url),
        "utf8",
    );

    assert.match(logo, /const brandName = "MONEO"/);
    assert.match(logo, /aria-label=\{showText \? brandName : undefined\}/);
    assert.match(footer, /<MoneaLogoMark className="h-12 w-12" \/>/);
    assert.match(footer, /grid grid-cols-2 items-center justify-items-center gap-x-2 gap-y-3/);
    assert.match(footer, /ធៀបការដែលជាប់ចិត្ត កុំភ្លេច MONEO/);
    assert.doesNotMatch(footer, /វេទិការៀបចំសំបុត្រមង្គលការឌីជីថល/);
});

test("public template gallery shows covers and codes without opening invitations", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(new URL("../src/app/templates/page.tsx", import.meta.url), "utf8");
    assert.match(page, /const TEMPLATES = TEMPLATE_CATALOG/);
    assert.match(page, /moneaClient\.get<unknown>\('\/api\/templates\/metadata'/);
    assert.match(page, /normalizeTemplatePresentationMetadata\(response\.data\)/);
    assert.match(page, /image: metadata\?\.image \?\? template\.image/);
    assert.match(page, /\{template\.image \? \([\s\S]*?src=\{template\.image\}/);
    assert.doesNotMatch(page, /paper-olive\.webp|hasCustomCover/);
    assert.match(page, /Failed to load template metadata/);
    assert.match(page, /dark:bg-\[#0d1210\]/);
    assert.match(page, /dark:bg-\[#171e1a\]/);
    assert.match(page, /<article[\s\S]*?\{template\.code\}/);
    assert.match(page, /loading=\{templateIndex < 2 \? 'eager' : 'lazy'\}/);
    assert.match(page, /fetchPriority=\{templateIndex === 0 \? 'high' : 'auto'\}/);
    assert.doesNotMatch(page, /AnimatePresence|<m\.article|template\.(?:title|description)[\s\S]{0,40}<\/article>/);
    assert.doesNotMatch(page, /selectedTemplate|setSelectedTemplate|role="dialog"|<iframe/);
});

test("template covers come only from admin-uploaded metadata", async () => {
    const { readFile } = await import("node:fs/promises");
    const [adminPage, interactiveGallery, showcase, definitions] = await Promise.all([
        readFile(new URL("../src/app/admin/master/templates/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/landing/InteractiveThemeGallery.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/landing/sections/TemplatesShowcase.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/template-config.ts", import.meta.url), "utf8"),
    ]);

    assert.match(adminPage, /normalizeTemplatePresentationMetadata\(metadataResponse\.data\)/);
    assert.match(adminPage, /onRemove=\{\(\) => setDraft\(\{ \.\.\.draft, image: "" \}\)\}/);
    assert.match(adminPage, /!draft\.image\.trim\(\)/);
    assert.match(interactiveGallery, /moneaClient\.get<unknown>\("\/api\/templates\/metadata"/);
    assert.doesNotMatch(interactiveGallery, /images\.unsplash\.com|image: "https?:/);
    assert.match(showcase, /presentation\?\.image \?\? template\.image/);
    assert.doesNotMatch(definitions, /image: "\//);
});

test("homepage showcases all template covers and links to the full gallery", async () => {
    const { readFile } = await import("node:fs/promises");
    const [page, showcase] = await Promise.all([
        readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/landing/sections/TemplatesShowcase.tsx", import.meta.url), "utf8"),
    ]);
    assert.match(page, /<Hero \/>[\s\S]*?<TemplatesShowcase \/>/);
    assert.match(showcase, /TEMPLATE_CATALOG\.map/);
    assert.match(showcase, /to="\/templates"/);
    assert.match(showcase, /template\.code/);
    assert.match(showcase, /moneaClient\.get<unknown>\("\/api\/templates\/metadata"/);
    assert.doesNotMatch(showcase, /role="dialog"|<iframe|template\.title/);
});

test("upgrade payment modal separates QR payment from receipt submission", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(new URL("../src/app/dashboard/upgrade/page.tsx", import.meta.url), "utf8");
    assert.match(page, /sm:max-w-2xl/);
    assert.match(page, /md:grid-cols-\[minmax\(0,0\.9fr\)_minmax\(0,1\.1fr\)\]/);
    assert.match(page, /<SafeQRCode value=\{qrString\} size=\{220\}/);
    assert.match(page, /id="payment-slip"[\s\S]*?className="peer sr-only"/);
    assert.match(page, /htmlFor="payment-slip"[\s\S]*?border-dashed/);
    assert.match(page, /id="payment-slip-reference"/);
    assert.match(page, /onClick=\{handleSubmitSlip\}/);
});

test("template receipt submission needs only the receipt image and accepts an optional note", async () => {
    const { readFile } = await import("node:fs/promises");
    const [step1, router, adminPage] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/routers/template-purchase.ts", import.meta.url), "utf8"),
        readFile(new URL("../src/app/admin/master/payments/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(step1, /disabled=\{isSubmittingReceipt \|\| !receiptFile\}/);
    assert.match(step1, /កំណត់ចំណាំ \(មិនបាច់សរសេរ\)/);
    assert.match(step1, /note: receiptNote\.trim\(\)/);
    assert.doesNotMatch(step1, /លេខប្រតិបត្តិការ|Transaction ID/);
    assert.match(router, /receiptUrl: z\.string\(\)\.url\(\)\.max\(2048\)/);
    assert.match(router, /note: z\.string\(\)\.trim\(\)\.max\(500\)\.optional\(\)\.default\(''\)/);
    assert.match(router, /receiptReference: parsed\.data\.note \|\| parsed\.data\.reference \|\| null/);
    assert.match(adminPage, /User note/);
    assert.match(adminPage, /កំណត់ចំណាំពីអ្នកប្រើ/);
});

test("signup validation messages remain readable in light and dark themes", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(new URL("../src/app/(auth)/sign-up/page.tsx", import.meta.url), "utf8");
    assert.equal((page.match(/<FormMessage className="text-xs font-semibold leading-5 text-rose-700 dark:text-rose-300" \/>/g) || []).length, 4);
});

test("digital guest pass keeps the full QR code visible in compact mobile dialogs", async () => {
    const { readFile } = await import("node:fs/promises");
    const modal = await readFile(new URL("../src/app/dashboard/guests/components/DigitalPassModal.tsx", import.meta.url), "utf8");
    assert.match(modal, /h-36 xs:h-40 sm:h-44/);
    assert.match(modal, /relative shrink-0 p-2 sm:p-2\.5 bg-white/);
    assert.match(modal, /block aspect-square w-24 xs:w-28 sm:w-32 shrink-0 object-contain/);
    assert.match(modal, /flex aspect-square w-24 xs:w-28 sm:w-32 shrink-0 items-center justify-center/);
});

test("public SEO metadata uses the MONEO site name on moneoez.com", async () => {
    const { readFile } = await import("node:fs/promises");
    const [indexHtml, manifest, landingPage, templatesPage, contactPage, supportPage, legalPage, weddingPage, sitemap, pagesSitemap, sitemapIndex, robots, packageJson, prerender] = await Promise.all([
        readFile(new URL("../index.html", import.meta.url), "utf8"),
        readFile(new URL("../public/manifest.json", import.meta.url), "utf8"),
        readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/templates/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/support/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/legal/LegalDocumentPage.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/w/[id]/_components/WeddingDataView.tsx", import.meta.url), "utf8"),
        readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
        readFile(new URL("../public/sitemap-pages.xml", import.meta.url), "utf8"),
        readFile(new URL("../public/sitemap-index.xml", import.meta.url), "utf8"),
        readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
        readFile(new URL("../package.json", import.meta.url), "utf8"),
        readFile(new URL("../scripts/prerender.mjs", import.meta.url), "utf8"),
    ]);

    assert.match(indexHtml, /<title>ធៀបការឌីជីថល \| TheapKa Digital - Online Invitation Khmer<\/title>/);
    assert.match(indexHtml, /name="description"[\s\S]*?MONEO/);
    assert.match(indexHtml, /rel="icon" type="image\/jpeg" href="\/icons\/logomoneo\.jpg"/);
    assert.match(indexHtml, /"logo":\s*\{[\s\S]*?"url": "https:\/\/moneoez\.com\/icons\/logomoneo\.jpg"/);
    assert.match(indexHtml, /rel="canonical" href="https:\/\/moneoez\.com\/"/);
    assert.match(indexHtml, /"name": "MONEO"/);
    assert.match(manifest, /"name": "MONEO - TheapKa Digital"/);
    assert.match(manifest, /"description": "បង្កើត និងចែករំលែកធៀបអញ្ជើញមង្គលការឌីជីថលជាមួយ MONEO"/);
    assert.match(manifest, /"src": "\/icons\/logomoneo\.jpg"/);
    assert.doesNotMatch(manifest, /Wedding Platform|Platform រៀបចំអាពាហ៍ពិពាហ៍/);
    assert.match(landingPage, /<link rel="canonical" href="https:\/\/moneoez\.com\/"/);
    assert.match(landingPage, /<title>ធៀបការឌីជីថល \| TheapKa Digital - Online Invitation Khmer<\/title>/);
    assert.match(landingPage, /<meta property="og:site_name" content="MONEO"/);
    assert.match(templatesPage, /<title>MONEO \| Khmer Digital Wedding Invitation Templates \| គំរូធៀបការឌីជីថល<\/title>/);
    assert.match(templatesPage, /rel="canonical" href="https:\/\/moneoez\.com\/templates"/);
    assert.match(templatesPage, /<meta name="description" content="មើលគំរូធៀបអាពាហ៍ពិពាហ៍ឌីជីថល/);
    assert.match(contactPage, /rel="canonical" href="https:\/\/moneoez\.com\/contact"/);
    assert.match(supportPage, /rel="canonical" href="https:\/\/moneoez\.com\/support"/);
    assert.match(legalPage, /<title>\{document\.title\} \| MONEO<\/title>/);
    assert.match(legalPage, /const pageUrl = `https:\/\/moneoez\.com\/\$\{documentKey === "privacy" \? "privacy-policy" : "terms-and-conditions"\}`/);
    assert.match(indexHtml, /og:image" content="https:\/\/moneoez\.com\/icons\/logomoneo\.jpg"/);
    assert.match(weddingPage, /\/icons\/logomoneo\.webp/);
    assert.doesNotMatch(indexHtml + landingPage + templatesPage + contactPage + supportPage + legalPage + weddingPage, /\/logo\.png/);
    assert.match(packageJson, /"build": "tsc && node scripts\/build\.mjs && node scripts\/prerender\.mjs"/);
    assert.match(prerender, /INDEXNOW_NOTIFY === 'true'/);
    assert.match(prerender, /keepLastBy\('link\[rel="canonical"\]', 'rel'\)/);
    assert.doesNotMatch(indexHtml, /មនោ/);
    assert.doesNotMatch(landingPage, /មនោ/);
    assert.doesNotMatch(indexHtml + landingPage + templatesPage, /លិខិតអញ្ជើញ/);
    assert.match(sitemap, /<loc>https:\/\/moneoez\.com\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/moneoez\.com\/khmer-digital-wedding-invitation<\/loc>/);
    assert.doesNotMatch(sitemap, /<loc>https:\/\/moneoez\.com\/templates<\/loc>/);
    assert.doesNotMatch(sitemap, /monea-webapp\.pages\.dev/);
    assert.match(pagesSitemap, /<loc>https:\/\/moneoez\.com\/templates<\/loc>/);
    assert.match(pagesSitemap, /<loc>https:\/\/moneoez\.com\/privacy-policy<\/loc>/);
    assert.match(sitemapIndex, /<loc>https:\/\/moneoez\.com\/sitemap\.xml<\/loc>/);
    assert.match(sitemapIndex, /<loc>https:\/\/moneoez\.com\/sitemap-pages\.xml<\/loc>/);
    assert.match(robots, /Sitemap: https:\/\/moneoez\.com\/sitemap-index\.xml/);
    assert.doesNotMatch(robots, /Allow: \/pricing/);
});

test("production CAPTCHA and Telegram configuration supports the custom domain", async () => {
    const { readFile } = await import("node:fs/promises");
    const [buildScript, pagesConfig, apiWorkerConfig, apiHono, apiTurnstile, telegramDocs] = await Promise.all([
        readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8"),
        readFile(new URL("../wrangler.pages.toml", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/wrangler.toml", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/hono.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/lib/turnstile.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/docs/TELEGRAM_OIDC_SETUP.md", import.meta.url), "utf8"),
    ]);

    assert.match(buildScript, /VITE_APP_URL = 'https:\/\/moneoez\.com'/);
    assert.match(pagesConfig, /VITE_APP_URL = "https:\/\/moneoez\.com"/);
    assert.match(apiWorkerConfig, /NEXT_PUBLIC_APP_URL = "https:\/\/moneoez\.com"/);
    assert.match(apiWorkerConfig, /TELEGRAM_REDIRECT_URI = "https:\/\/moneoez\.com\/auth\/telegram\/callback"/);
    assert.match(apiWorkerConfig, /TURNSTILE_ALLOWED_HOSTNAMES = "moneoez\.com"/);
    assert.match(apiHono, /'https:\/\/moneoez\.com'/);
    assert.match(apiTurnstile, /turnstile\/v0\/siteverify/);
    assert.match(apiTurnstile, /data\.success !== true/);
    assert.match(apiTurnstile, /hostname-mismatch/);
    assert.match(apiTurnstile, /action-mismatch/);
    assert.match(telegramDocs, /add `moneoez\.com` to its allowed hostnames/);
    assert.match(telegramDocs, /`https:\/\/moneoez\.com\/auth\/telegram\/callback`/);
});

test("account profile fields keep full-width sections inside one mobile grid column", async () => {
    const { readFile } = await import("node:fs/promises");
    const profileTab = await readFile(
        new URL("../src/app/dashboard/account/components/ProfileTab.tsx", import.meta.url),
        "utf8",
    );

    assert.match(profileTab, /grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2/);
    assert.equal((profileTab.match(/min-w-0 space-y-2 sm:col-span-2/g) || []).length, 2);
    assert.doesNotMatch(profileTab, /className="col-span-2 space-y-2"/);
    assert.doesNotMatch(profileTab, /account\.profile\.telegram\.(?:title|connected|notConnected|description|connect|reconnect)|handleTelegramLink|telegramLoading/);
});

test("2FA setup password prompt is responsive, accessible, and easy to cancel", async () => {
    const { readFile } = await import("node:fs/promises");
    const setup = await readFile(
        new URL("../src/components/admin/TwoFactorSetup.tsx", import.meta.url),
        "utf8",
    );

    assert.match(setup, /w-\[calc\(100vw-2rem\)\] max-w-\[500px\] max-h-\[90dvh\]/);
    assert.match(setup, /htmlFor="two-factor-setup-password"/);
    assert.match(setup, /aria-describedby="two-factor-setup-password-help"/);
    assert.match(setup, /aria-label=\{showPassword \? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់"\}/);
    assert.match(setup, /role="alert"/);
    assert.match(setup, /onClick=\{\(\) => onOpenChange\(false\)\}/);
    assert.match(setup, /disabled=\{!password\.trim\(\) \|\| loading\}/);
    assert.doesNotMatch(setup, /sm:max-w-2xl p-0 overflow-hidden rounded-3xl/);
});

test("account security keeps 2FA while omitting session revocation and security activity UI", async () => {
    const { readFile } = await import("node:fs/promises");
    const [securityTab, accountPage, settingsHook, km, en] = await Promise.all([
        readFile(new URL("../src/app/dashboard/account/components/SecurityTab.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/account/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/account/hooks/useAccountSettings.ts", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/km.json", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/en.json", import.meta.url), "utf8"),
    ]);

    assert.match(securityTab, /account\.security\.twoFactor\.title/);
    assert.match(securityTab, /onShow2FASetup/);
    assert.match(securityTab, /onShowDisable2FA/);
    assert.doesNotMatch(securityTab + accountPage + settingsHook, /account\.security\.(?:sessions|logs)|Active Sessions|ផ្តាច់ឧបករណ៍ទាំងអស់|សកម្មភាពថ្មីៗទាក់ទងនឹងគណនី/);
    assert.doesNotMatch(settingsHook, /\/api\/admin\/security\/(?:logs|revoke)|handleRevokeSessions|fetchLogs/);
    assert.doesNotMatch(JSON.stringify(JSON.parse(km).account.security), /sessions|logs/);
    assert.doesNotMatch(JSON.stringify(JSON.parse(en).account.security), /sessions|logs/);
});

test("SSO users can reach email password setup before managing 2FA", async () => {
    const { readFile } = await import("node:fs/promises");
    const securityTab = await readFile(
        new URL("../src/app/dashboard/account/components/SecurityTab.tsx", import.meta.url),
        "utf8",
    );
    const resetPasswordHandler = await readFile(
        new URL("../../monea-api-worker/auth_handlers/reset-password/handler.ts", import.meta.url),
        "utf8",
    );

    assert.match(securityTab, /!user\?\.hasPassword/);
    assert.match(securityTab, /<Link to="\/forgot-password">/);
    assert.match(securityTab, /account\.security\.setPassword/);
    assert.match(resetPasswordHandler, /password:\s*hashedPassword/);
    assert.match(resetPasswordHandler, /sessionsRevokedAt:\s*now/);
});

test("account avatar help text uses the full profile card width on phones", async () => {
    const { readFile } = await import("node:fs/promises");
    const profileTab = await readFile(
        new URL("../src/app/dashboard/account/components/ProfileTab.tsx", import.meta.url),
        "utf8",
    );

    assert.match(profileTab, /<p className="mt-3 text-xs leading-relaxed text-muted-foreground">/);
    assert.doesNotMatch(profileTab, /<p className="ml-20 text-xs leading-relaxed/);
});

test("photo library provides one clear batch-upload entry point on narrow screens", async () => {
    const { readFile } = await import("node:fs/promises");
    const library = await readFile(
        new URL("../src/app/dashboard/design/components/sections/GeneralGallerySection.tsx", import.meta.url),
        "utf8",
    );

    assert.match(library, /multiple/);
    assert.match(library, /min-h-28 w-full/);
    assert.match(library, /ជ្រើសរើសរូបភាព/);
    assert.match(library, /grid grid-cols-2 gap-2 sm:grid-cols-3/);
    assert.match(library, /PhotoImage/);
    assert.match(library, /removeGalleryItem\(index\)/);
});

test("photo editor can open the live invitation preview from step four", async () => {
    const { readFile } = await import("node:fs/promises");
    const [mediaStep, designPage] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(mediaStep, /onClick=\{onPreviewInvitation\}[\s\S]*?មើលរូបនៅលើធៀប/);
    assert.match(designPage, /<Step4Media[\s\S]*?onPreviewInvitation=\{\(\) => \{[\s\S]*?setIsSheetOpen\(false\)/);
});

test("paper canvas sections reveal the selected texture under light surfaces", async () => {
    const { readFile } = await import("node:fs/promises");
    const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

    assert.match(styles, /\.monea-paper-canvas section\[class\*="bg-white"\]/);
    assert.match(styles, /background-color: var\(--monea-paper-color[^;]*\) !important/);
    assert.match(styles, /background-image: var\(--monea-paper-texture[^;]*\) !important/);
    assert.match(styles, /background-blend-mode: multiply !important/);
});

test("paper settings reach full template canvases and the modern invitation letter", async () => {
    const { readFile } = await import("node:fs/promises");
    const [khmerLegacy, modernLetter, styles] = await Promise.all([
        readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/modern-minimal/LetterSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

    assert.match(khmerLegacy, /monea-paper-canvas w-full min-h-screen relative/);
    assert.doesNotMatch(khmerLegacy, /className="w-full bg-white min-h-screen relative font-serif-elegant/);
    assert.match(modernLetter, /backgroundColor: "var\(--monea-paper-color/);
    assert.match(modernLetter, /backgroundImage: "var\(--monea-paper-texture/);
    assert.match(styles, /\.monea-paper-canvas section\[class\*="bg-\[#E"\]/);
    assert.match(styles, /\.monea-paper-canvas section\[class\*="bg-\[#e"\]/);
});

test("template picker keeps readable cards inside the narrow wizard panel", async () => {
    const { readFile } = await import("node:fs/promises");
    const picker = await readFile(new URL("../src/app/dashboard/design/components/Step1Template.tsx", import.meta.url), "utf8");

    assert.match(picker, /<div className="grid grid-cols-2 gap-3 sm:gap-4">/);
    assert.doesNotMatch(picker, /xl:grid-cols-4|sm:grid-cols-3/);
    assert.match(picker, /aspect-\[4\/3\] w-full overflow-hidden bg-muted/);
    assert.match(picker, /border-t border-border\/70 bg-muted\/20 px-3 py-2/);
    assert.match(picker, /h-10 min-w-0 flex-1 touch-manipulation/);
    assert.match(picker, /បានជ្រើស/);
});

test("design toolbar is translated and sharing waits for a successful save", async () => {
    const { readFile } = await import("node:fs/promises");
    const [page, khmer, english] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/km.json", import.meta.url), "utf8").then(JSON.parse),
        readFile(new URL("../src/i18n/en.json", import.meta.url), "utf8").then(JSON.parse),
    ]);
    const translatedKeys = [
        "previewSize", "moreActions", "openPreview", "help", "share",
        "saving", "unsaved", "saved", "shareTitle", "shareDescription",
        "copy", "copied", "copyError", "previewError", "shareViaTelegram",
    ];

    for (const locale of [khmer, english]) {
        for (const key of translatedKeys) {
            assert.equal(typeof locale.design.wizard[key], "string", `Missing design.wizard.${key}`);
        }
    }

    assert.match(page, /const PHONE_PREVIEW_SIZE = \{ width: 440, height: 956 \} as const/);
    assert.match(page, /aspectRatio: `\$\{PHONE_PREVIEW_SIZE\.width\} \/ \$\{PHONE_PREVIEW_SIZE\.height\}`/);
    assert.doesNotMatch(page, /previewDevice|PHONE_PREVIEW_SIZES/);
    assert.match(page, /const openShareAfterSave = async \(\) => \{[\s\S]*?const saved = await saveChanges\(\);[\s\S]*?if \(saved\) \{\s*setCopyLinkError\(false\);\s*setIsShareModalOpen\(true\);/);
    assert.match(page, /aria-label=\{loading \? t\("design\.wizard\.saving"\) : isDirty \? t\("design\.wizard\.unsaved"\) : t\("design\.wizard\.saved"\)\}/);
});

test("global phone frame appearance is applied to the phone preview", async () => {
    const { readFile } = await import("node:fs/promises");
    const [designPage, adminSettings, publicSettings, adminApi, schema, migration] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/admin/master/settings/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/routers/system.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/routers/adminMaster.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/drizzle/schema.ts", import.meta.url), "utf8"),
        readFile(new URL("../../monea-api-worker/drizzle/migrations/0005_phone_frame_color.sql", import.meta.url), "utf8"),
    ]);

    assert.match(adminSettings, /activeTab === 'appearance'/);
    assert.match(adminSettings, /handleSavePhoneFrameColor/);
    assert.match(adminApi, /if \(phoneFrameColor !== undefined && !isPhoneFrameColor\(phoneFrameColor\)\)/);
    assert.match(publicSettings, /systemRouter\.get\('\/(?:ui-settings|phone-frame-color)'/);
    assert.match(publicSettings, /select\(\{ phoneFrameColor: systemConfig\.phoneFrameColor \}\)/);
    assert.match(schema, /phoneFrameColor: text\('phoneFrameColor'\)\.default\('black'\)\.notNull\(\)/);
    assert.match(migration, /ADD COLUMN IF NOT EXISTS "phoneFrameColor" TEXT NOT NULL DEFAULT 'black'/);
    assert.match(designPage, /moneaClient\.get<\{ phoneFrameColor: unknown \}>\([\s\S]*?\/api\/system\/phone-frame-color/);
    assert.match(designPage, /isPhoneFrameColor\(response\.data\?\.phoneFrameColor\)/);
    assert.match(designPage, /const phoneFrame = PHONE_FRAME_COLORS\[phoneFrameColor\]/);
    assert.match(designPage, /style=\{\{ background: phoneFrame\.side \}\}/);
    assert.match(designPage, /style=\{isM1Preview \? undefined : \{ background: phoneFrame\.gradient \}\}/);
    assert.match(designPage, /rounded-\[3\.5rem\] border border-black\/30 p-\[3px\]/);
    assert.match(designPage, /rounded-\[3\.35rem\] border border-\[#090a0c\][^"]*p-\[2px\]/);
    assert.match(designPage, /h-7 w-\[29%\] max-w-\[120px\]/);
    assert.match(designPage, /const isM1Preview = wedding\?\.templateId === "khmer-legacy"/);
    assert.match(designPage, /isM1Preview\s*\?\s*"overflow-hidden rounded-\[3\.1rem\] bg-background"/);
    assert.match(designPage, /!isM1Preview && \(/);
    assert.match(designPage, /className="h-full w-full border-none bg-background"/);
});

test("M1 invitation preview fills the screen without a blue outer frame", async () => {
    const { readFile } = await import("node:fs/promises");
    const khmerLegacy = await readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8");
    const entranceOverlay = khmerLegacy.match(/key="overlay"[\s\S]*?<\/m\.div>\s*\n\s*\)/)?.[0];

    assert.ok(entranceOverlay, "M1 entrance overlay should exist");
    assert.match(entranceOverlay, /h-\[100dvh\] w-full[^"]*bg-\[#0b0e14\] p-0/);
    assert.match(entranceOverlay, /h-full w-full flex-col[^"]*bg-\[#0b0e14\]/);
    assert.doesNotMatch(entranceOverlay, /bg-\[#0A1226\]|p-4|rounded-\[2rem\] border/);
});

test("public invitations keep a phone-width canvas on every screen size", async () => {
    const { readFile } = await import("node:fs/promises");
    const [renderer, preview] = await Promise.all([
        readFile(new URL("../src/components/templates/TemplateRenderer.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/preview/page.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(renderer, /w-full min-w-0 max-w-\[430px\] bg-white/);
    assert.doesNotMatch(renderer, /sm:max-w-|md:max-w-|lg:max-w-/);
    assert.match(renderer, /template-responsive-canvas /);
    const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
    assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023\.98px\) \{\s*\.template-responsive-canvas \.monea-paper-canvas \{\s*width: 100%;\s*max-width: 720px;/);
    assert.match(renderer, /w-full min-w-0/);
    assert.match(preview, /<TemplateRenderer/);
});

test("public template rendering filters known missing demo photos in every mode", async () => {
    const { readFile } = await import("node:fs/promises");
    const renderer = await readFile(
        new URL("../src/components/templates/TemplateRenderer.tsx", import.meta.url),
        "utf8",
    );

    assert.match(renderer, /groomPhoto: isDemoPhoto\(wedding\.groomPhoto\) \? undefined/);
    assert.match(renderer, /bridePhoto: isDemoPhoto\(wedding\.bridePhoto\) \? undefined/);
    assert.match(renderer, /galleryItems: wedding\.galleryItems\?\.filter\(\(item\) => !isDemoPhoto\(item\.url\)\)/);
    assert.doesNotMatch(renderer, /uploadedImagesOnly\s*\?\s*\{/);
});

test("mobile invitation preview exposes the save-before-share action", async () => {
    const { readFile } = await import("node:fs/promises");
    const [page, preview] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/PreviewSync.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(page, /onClick=\{\(\) => void openShareAfterSave\(\)\}[\s\S]*?t\("design\.wizard\.share"\)/);
    assert.match(page, /disabled=\{!mobilePreviewReady \|\| loading \|\| isMediaUploading \|\| galleryUploading\}/);
    assert.match(page, /onReadyChange=\{setMobilePreviewReady\}/);
    assert.match(page, /aria-label=\{t\("design\.wizard\.previewInvitation"\)\}[\s\S]*?whitespace-nowrap[\s\S]*?previewShort/);
    assert.match(preview, /onReadyChange\(true\)/);
    assert.match(preview, /onReadyChange\(false\)/);
    assert.match(page, /\{mounted && <ShareModal \/>}/);
    assert.match(page, /aria-label=\{t\("design\.wizard\.mobileEditor"\)\}/);
});

test("mobile done action saves successfully before leaving the editor", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8");

    assert.match(page, /const finishEditing = async \(\) => \{[\s\S]*?if \(await saveChanges\(\)\) \{\s*navigate\("\/dashboard"\);/);
    assert.match(page, /onClick=\{\(\) => void finishEditing\(\)\}[\s\S]*?disabled=\{finishing \|\| loading \|\| isMediaUploading \|\| galleryUploading\}/);
    assert.match(page, /else \{\s*setFinishSaveError\(true\);\s*\}/);
    assert.match(page, /role="alert"[\s\S]*?t\("design\.wizard\.finishSaveError"\)/);
});

test("mobile editor back action saves dirty changes before leaving", async () => {
    const { readFile } = await import("node:fs/promises");
    const page = await readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8");

    assert.match(page, /const leaveEditor = async \(\) => \{[\s\S]*?if \(!isDirty \|\| await saveChanges\(\)\) \{\s*navigate\("\/dashboard"\);/);
    assert.match(page, /onClick=\{\(\) => void leaveEditor\(\)\}[\s\S]*?disabled=\{leaving \|\| loading \|\| isMediaUploading \|\| galleryUploading\}/);
});

test("save queue serializes requests and continues after a rejected request", async () => {
    const enqueue = createSerialTaskQueue();
    let releaseFirst;
    const firstGate = new Promise((resolve) => {
        releaseFirst = resolve;
    });
    const events = [];

    const first = enqueue(async () => {
        events.push("first-start");
        await firstGate;
        events.push("first-end");
        return "old";
    });
    const second = enqueue(async () => {
        events.push("second-start");
        throw new Error("simulated save failure");
    });
    const third = enqueue(async () => {
        events.push("third-start");
        return "latest";
    });

    await Promise.resolve();
    assert.deepEqual(events, ["first-start"]);
    releaseFirst();

    assert.equal(await first, "old");
    await assert.rejects(second, /simulated save failure/);
    assert.equal(await third, "latest");
    assert.deepEqual(events, [
        "first-start",
        "first-end",
        "second-start",
        "third-start",
    ]);
});

test("mobile share failures are visible and failed clipboard copies select the link", async () => {
    const { readFile } = await import("node:fs/promises");
    const [page, khmer, english] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/page.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/i18n/km.json", import.meta.url), "utf8").then(JSON.parse),
        readFile(new URL("../src/i18n/en.json", import.meta.url), "utf8").then(JSON.parse),
    ]);

    assert.match(page, /else \{\s*setShareSaveError\(true\);\s*\}/);
    assert.match(page, /role="alert"[\s\S]*?t\("design\.wizard\.shareSaveError"\)/);
    assert.match(page, /onClick=\{\(event\) => event\.currentTarget\.select\(\)\}/);
    assert.match(page, /shareLinkInputRef\.current\?\.focus\(\);[\s\S]*?shareLinkInputRef\.current\?\.select\(\);/);
    assert.match(page, /supportsNativeShare && \([\s\S]*?t\("design\.wizard\.shareViaDevice"\)/);
    assert.match(page, /await navigator\.share\(\{[\s\S]*?text: t\("design\.wizard\.nativeShareText"\),[\s\S]*?url: shareUrl/);
    assert.match(page, /new URL\("https:\/\/t\.me\/share\/url"\)/);
    assert.match(page, /searchParams\.set\("url", shareUrl\)/);
    assert.match(page, /t\("design\.wizard\.shareViaTelegram"\)/);
    assert.match(page, /max-h-\[calc\(100dvh-2rem\)\] overflow-y-auto/);
    assert.match(page, /w-\[min\(180px,55vw\)\]/);
    assert.match(page, /aria-modal="true"/);
    assert.match(page, /bottom-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]/);
    for (const locale of [khmer, english]) {
        assert.equal(typeof locale.design.wizard.previewShort, "string");
        assert.equal(typeof locale.design.wizard.shareSaveError, "string");
        assert.equal(typeof locale.design.wizard.shareLink, "string");
        assert.equal(typeof locale.design.wizard.shareViaDevice, "string");
        assert.equal(typeof locale.design.wizard.shareViaTelegram, "string");
        assert.equal(typeof locale.design.wizard.nativeShareText, "string");
        assert.equal(typeof locale.design.wizard.finishing, "string");
        assert.equal(typeof locale.design.wizard.finishSaveError, "string");
    }
});

test("shared guestbook uses translation keys from the invitation namespace", async () => {
    const { readFile } = await import("node:fs/promises");
    const [source, fortune] = await Promise.all([
        readFile(new URL("../src/components/templates/shared/GuestbookSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/FortuneHarmony.tsx", import.meta.url), "utf8"),
    ]);
    const translations = JSON.parse(await readFile(
        new URL("../src/i18n/km.json", import.meta.url),
        "utf8",
    ));

    for (const [, key] of source.matchAll(/t\("(invitation\.guestbook\.[^"]+)"/g)) {
        const value = key.split(".").reduce((current, part) => current?.[part], translations);
        assert.equal(typeof value, "string", `${key} should resolve to a Khmer translation`);
    }
    assert.doesNotMatch(source, /t\("(?:guestbook|template\.guestbook)\./);
    assert.match(source, /wedding\.id === "preview-default" \|\| wedding\.id === "approval-preview"/);
    assert.match(source, /const requestKey = wedding\.id && !isSamplePreview/);
    assert.match(source, /isSamplePreview \? \[\] : undefined/);
    assert.match(source, /isSamplePreview \? \([\s\S]*?previewOnly[\s\S]*?\) : \(/);
    assert.match(source, /khmerSpacing\?: boolean/);
    assert.match(source, /khmerSpacingClass = khmerSpacing \? "fh-khmer-safe" : ""/);
    assert.match(source, /className=\{`min-h-12 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 \$\{khmerSpacingClass\}/);
    assert.match(source, /<span className=\{khmerSpacingClass\}>\{t\("invitation\.guestbook\.submit"\)\}<\/span>/);
    assert.match(source, /<time dateTime=\{entry\.createdAt\} className=\{`\$\{khmerSpacingClass\} text-xs/);
    assert.match(fortune, /<GuestbookSection wedding=\{wedding\} khmerSpacing unboxed \/>/);
    for (const locale of [
        translations,
        JSON.parse(await readFile(new URL("../src/i18n/en.json", import.meta.url), "utf8")),
    ]) {
        assert.equal(typeof locale.invitation.guestbook.previewOnly, "string");
    }
});

test("gallery photo selection safely skips null and malformed entries", () => {
    const uploadedPhoto = {
        url: "https://example.com/photo.jpg",
        type: "IMAGE",
        publicId: "photo-1",
    };
    const wedding = {
        ...createWedding(),
        galleryItems: [null, { url: null, type: "IMAGE" }, uploadedPhoto],
    };

    assert.deepEqual(getWeddingPhotos(wedding), [uploadedPhoto]);
});

test("photo gallery helpers safely skip null gallery entries", () => {
    const galleryItems = Array.from({ length: 11 }, (_, index) => ({
        url: `https://example.com/photo-${index}.jpg`,
        type: "IMAGE",
    }));
    galleryItems.push(null);

    const wedding = {
        ...createWedding(),
        galleryItems,
    };

    assert.equal(getWeddingPhotos(wedding).length, 11);
});

test("legacy label keys normalize to labels rendered by the templates", () => {
    const { wedding } = normalizeWeddingForTemplate(createWedding({
        customLabels: {
            invite_title: "Legacy title",
            hero_subtitle: "Legacy subtitle",
            hero_button: "Legacy button",
            gallery_title: "Legacy gallery",
            invitationTitle: "Current title",
        },
    }));

    assert.equal(wedding.themeSettings?.customLabels?.invitationTitle, "Current title");
    assert.equal(wedding.themeSettings?.customLabels?.heroSubtitle, "Legacy subtitle");
    assert.equal(wedding.themeSettings?.customLabels?.heroButton, "Legacy button");
    assert.equal(wedding.themeSettings?.customLabels?.galleryTitle, "Legacy gallery");
});

test("registry and selectable catalog are derived from the same definitions", () => {
    assert.equal(Object.keys(TEMPLATE_DEFINITIONS).length, 8);
    assert.equal(Object.keys(TEMPLATE_REGISTRY).length, 8);
    assert.equal(TEMPLATE_CATALOG.length, 8);
    assert.ok(TEMPLATE_CATALOG.every(({ id }) => TEMPLATE_REGISTRY[id]));
    assert.equal(TEMPLATE_DEFINITIONS["emerald-garden"].selectable, true);
    assert.equal(TEMPLATE_DEFINITIONS["anniversary-elegant"].selectable, true);
    assert.ok(TEMPLATE_DEFINITIONS["garden-editorial"].code === "M8" || TEMPLATE_DEFINITIONS["garden-editorial"].code === "M-08");
    assert.equal(TEMPLATE_DEFINITIONS["garden-editorial"].eventType, "wedding");
    assert.equal(TEMPLATE_DEFINITIONS["garden-editorial"].title, "Palace Bloom");
    assert.equal(TEMPLATE_DEFINITIONS["garden-editorial"].image, "");
    assert.equal(TEMPLATE_DEFINITIONS["garden-editorial"].title, "Palace Bloom");
    assert.equal(TEMPLATE_DEFINITIONS["garden-editorial"].image, "");
    assert.ok(getTemplatesForEventType("wedding").some(({ id }) => id === "garden-editorial"));
    assert.equal(getTemplatesForEventType("anniversary").some(({ id }) => id === "garden-editorial"), false);
    for (const [id, definition] of Object.entries(TEMPLATE_DEFINITIONS)) {
        assert.equal(definition.id, id);
        assert.deepEqual(definition.visibilityControls, ["story", "gallery", "timeline", "guestbook"]);
    }
});

test("template picker fills entries missing from an older API response from local defaults", () => {
    const legacyAvailability = Object.fromEntries(
        Object.entries(TEMPLATE_AVAILABILITY_DEFAULTS).filter(([id]) => id !== "garden-editorial"),
    );
    const legacyMetadata = Object.fromEntries(
        Object.entries(TEMPLATE_METADATA_DEFAULTS).filter(([id]) => id !== "garden-editorial"),
    );

    assert.equal(normalizeTemplateAvailability(legacyAvailability)["garden-editorial"], true);
    assert.deepEqual(
        normalizeTemplatePresentationMetadata(legacyMetadata)["garden-editorial"],
        {
            title: TEMPLATE_DEFINITIONS["garden-editorial"].title,
            description: TEMPLATE_DEFINITIONS["garden-editorial"].description,
            image: TEMPLATE_DEFINITIONS["garden-editorial"].image,
            eventType: "wedding",
        },
    );
});

test("template metadata and demo wedding data avoid missing legacy photo assets", () => {
    const staleImage = "/assets/khmer-legacy/621811254_905398285378636_5240747682765358044_n.jpg";
    const metadata = normalizeTemplatePresentationMetadata({
        ...TEMPLATE_METADATA_DEFAULTS,
        "khmer-legacy": {
            ...TEMPLATE_METADATA_DEFAULTS["khmer-legacy"],
            image: staleImage,
        },
    });

    assert.equal(metadata["khmer-legacy"].image, TEMPLATE_DEFINITIONS["khmer-legacy"].image);
    const uploadedCover = "https://res.cloudinary.com/monea/image/upload/template-covers/custom-cover.jpg";
    const normalizedUploaded = normalizeTemplatePresentationMetadata({
        ...TEMPLATE_METADATA_DEFAULTS,
        "khmer-legacy": {
            ...TEMPLATE_METADATA_DEFAULTS["khmer-legacy"],
            image: uploadedCover,
        },
    });
    assert.equal(normalizedUploaded["khmer-legacy"].image, uploadedCover);
    assert.equal(normalizeTemplatePresentationMetadata({
        ...TEMPLATE_METADATA_DEFAULTS,
        "khmer-legacy": {
            ...TEMPLATE_METADATA_DEFAULTS["khmer-legacy"],
            image: "/assets/blossom-romance/blossom-arch-bg.jpg",
        },
    })["khmer-legacy"].image, "");
    assert.equal(DEFAULT_WEDDING.galleryItems?.length, 0);
    assert.doesNotMatch(JSON.stringify(DEFAULT_WEDDING.themeSettings), /\/assets\/khmer-legacy\//);
});

test("template picker still rejects malformed availability and metadata entries", () => {
    assert.throws(
        () => normalizeTemplateAvailability({ "garden-editorial": "true" }),
        /must be a boolean/,
    );
    assert.throws(
        () => normalizeTemplatePresentationMetadata({ "garden-editorial": { title: "Missing fields" } }),
        /is invalid/,
    );
});

test("M-08 gift section uses editable gift copy and the requested KHQR guidance", async () => {
    const { readFile } = await import("node:fs/promises");
    const [templateSource, labelsSource] = await Promise.all([
        readFile(new URL("../src/components/templates/GardenEditorial.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/app/dashboard/design/components/sections/LabelsSection.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(templateSource, /customLabels\?\.giftTitle\s*\|\|\s*"ចំណងដៃ"/);
    assert.match(
        templateSource,
        /customLabels\?\.giftSubtitle[\s\S]*?សម្រាប់ភ្ញៀវកិត្តិយសដែលមិនអាចអញ្ជើញចូលរួមដោយផ្ទាល់ អាចផ្ញើចំណងដៃតាមរយៈ KHQR ខាងក្រោម/,
    );
    assert.match(labelsSource, /key: 'giftSubtitle'.*type: 'textarea'/);
});

test("M-08 invitation arranges family, couple, and event text in a formal invitation layout", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/components/templates/GardenEditorial.tsx", import.meta.url), "utf8");
    const hero = source.match(/<section id="hero"[\s\S]*?<\/section>/)?.[0] || "";
    const calendar = source.match(/function GardenEventCalendar[\s\S]*?(?=\nfunction GardenSectionHeading)/)?.[0] || "";

    assert.match(source, /មាតាបិតាខាងកូនប្រុស/);
    assert.match(source, /មាតាបិតាខាងកូនស្រី/);
    assert.match(source, /កូនប្រុសនាម/);
    assert.match(source, /កូនស្រីនាម/);
    assert.equal((hero.match(/\{wedding\.groomName \|\| "កូនកំលោះ"\}/g) || []).length, 1);
    assert.equal((hero.match(/\{wedding\.brideName \|\| "កូនក្រមុំ"\}/g) || []).length, 1);
    assert.match(source, /wedding\.themeSettings\?\.lunarDate/);
    assert.match(source, /wedding\.time &&/);
    assert.match(source, /function GardenEventCalendar/);
    assert.match(source, /grid grid-cols-7/);
    assert.match(source, /day === eventDay/);
    assert.match(source, /សូមគោរពអញ្ជើញចូលរួម/);
    assert.match(calendar, /<div className="relative mx-auto max-w-lg px-4 py-7 sm:px-7 sm:py-9 lg:max-w-3xl lg:px-12 lg:py-12">/);
    assert.match(calendar, /<div className="mx-auto mt-5 max-w-sm p-3 sm:mt-6 sm:p-4 lg:mt-7 lg:max-w-xl lg:p-6">/);
    assert.doesNotMatch(calendar, /rounded-\[1\.6rem\].*border.*bg-\[#fffaf0\].*shadow/);
    assert.doesNotMatch(calendar, /max-w-sm rounded-2xl border.*bg-\[#fffdf7\]/);
    assert.match(source, /const videoUrl = wedding\.themeSettings\?\.videoUrl\?\.trim\(\)/);
    assert.match(source, /if \(videoUrl\) \{\s*setShowIntroVideo\(true\)/);
    assert.match(source, /រំលងវីដេអូ និងបើកធៀប/);
    assert.match(source, /onEnded=\{enterInvitation\}/);
    assert.match(source, /event\.data === youtubeWindow\.YT\?\.PlayerState\.ENDED/);
    assert.match(source, /enablejsapi=1&origin=/);
});

test("M-08 invitation message layout separates formal copy and links to its event calendar", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/components/templates/GardenEditorial.tsx", import.meta.url), "utf8");

    assert.match(source, /សេចក្តីសូមគោរពអញ្ជើញ/);
    assert.match(source, /ពិធីសិរីមង្គល/);
    assert.match(source, /welcomeMessage \|\|/);
    assert.match(source, /invitationText \|\|/);
    assert.match(source, /href="#event-calendar"/);
    assert.match(source, /id="event-calendar"/);
});

test("runtime availability can activate registered templates outside the static catalog", () => {
    assert.deepEqual(
        getTemplatesForEventType("wedding", new Set(["emerald-garden"])).map(({ id }) => id),
        ["emerald-garden"],
    );
    assert.deepEqual(getTemplatesForEventType("wedding", new Set()), []);
    assert.ok(getTemplatesForEventType("anniversary", new Set(["anniversary-elegant"]))
        .some(({ id }) => id === "anniversary-elegant"));
});

test("frontend registry IDs stay aligned with API availability defaults", () => {
    assert.deepEqual(
        Object.keys(TEMPLATE_AVAILABILITY_DEFAULTS).sort(),
        Object.keys(TEMPLATE_DEFINITIONS).sort(),
    );
    assert.deepEqual(
        Object.entries(TEMPLATE_AVAILABILITY_DEFAULTS)
            .filter(([, enabled]) => enabled)
            .map(([id]) => id)
            .sort(),
        TEMPLATE_CATALOG.map(({ id }) => id).sort(),
    );
    for (const [id, definition] of Object.entries(TEMPLATE_DEFINITIONS)) {
        assert.equal(TEMPLATE_METADATA_DEFAULTS[id].title, definition.title);
        assert.equal(TEMPLATE_METADATA_DEFAULTS[id].description, definition.description);
        assert.equal(TEMPLATE_METADATA_DEFAULTS[id].image, definition.image);
        assert.equal(TEMPLATE_METADATA_DEFAULTS[id].eventType, definition.eventType);
    }
});

test("all template story sections render the configured story image collection", async () => {
    const { readFile } = await import("node:fs/promises");
    const storyTemplates = [
        "../src/components/templates/BlossomRomance.tsx",
        "../src/components/templates/EmeraldGarden.tsx",
        "../src/components/templates/FortuneHarmony.tsx",
        "../src/components/templates/NeaM05Sections.tsx",
        "../src/components/templates/GardenEditorial.tsx",
        "../src/components/templates/anniversary-elegant/AnniversaryStory.tsx",
        "../src/components/templates/khmer-legacy/LoveStorySection.tsx",
        "../src/components/templates/modern-minimal/LoveStorySection.tsx",
    ];

    for (const templatePath of storyTemplates) {
        const source = await readFile(new URL(templatePath, import.meta.url), "utf8");
        assert.match(source, /\.map\(/, `${templatePath} should render each story image`);
        assert.match(source, /storyImageCaptions/, `${templatePath} should render its image caption`);
    }
});

test("story image titles and story text are optional in the design editor", async () => {
    const { readFile } = await import("node:fs/promises");
    const step5 = await readFile(
        new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url),
        "utf8",
    );

    assert.match(step5, /ចំណងជើងរូបភាព \(អាចរំលងបាន\)/);
    assert.match(step5, /placeholder="សរសេរចំណងជើងរូបនេះ\.\.\."/);
    assert.match(step5, /ដំណើររឿងផ្តើមស្នេហ៍ \(អាចរំលងបាន\)/);
});

test("story image uploads are capped at thirty images", async () => {
    const { readFile } = await import("node:fs/promises");
    const step5 = await readFile(
        new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url),
        "utf8",
    );

    assert.match(step5, /const MAX_STORY_IMAGES = 30/);
    assert.match(step5, /files\.slice\(0, remainingSlots\)/);
    assert.match(step5, /currentImages\.filter\(Boolean\)\.length >= MAX_STORY_IMAGES/);
    assert.match(step5, /disabled=\{storyImageUploading \|\| \(storyImages\?\.filter\(Boolean\)\.length \|\| 0\) >= MAX_STORY_IMAGES\}/);
    assert.match(step5, /\{storyImages\?\.filter\(Boolean\)\.length \|\| 0\}\/\{MAX_STORY_IMAGES\} រូប/);
});

test("social links can be shown or hidden on invitation templates", async () => {
    const { readFile } = await import("node:fs/promises");
    const [step5, socialLinks, types, templateSources] = await Promise.all([
        readFile(new URL("../src/app/dashboard/design/components/Step5Extra.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/shared/SocialLinksSection.tsx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/templates/types.ts", import.meta.url), "utf8"),
        Promise.all([
            "../src/components/templates/khmer-legacy/FooterSection.tsx",
            "../src/components/templates/ModernMinimal.tsx",
            "../src/components/templates/fortune-harmony/ThankYouSection.tsx",
            "../src/components/templates/blossom-romance/ThankYouSection.tsx",
            "../src/components/templates/NeaM05Sections.tsx",
            "../src/components/templates/emerald-garden/ThankYouSection.tsx",
            "../src/components/templates/anniversary-elegant/AnniversaryThankYou.tsx",
            "../src/components/templates/GardenEditorial.tsx",
        ].map(async (path) => readFile(new URL(path, import.meta.url), "utf8"))),
    ]);

    const displaySection = step5.match(/id="step5-display"[\s\S]*?<\/AccordionItem>/)?.[0] || "";
    assert.match(displaySection, /តំណ Facebook, Telegram និងលេខទូរស័ព្ទ/);
    assert.match(displaySection, /showSocialLinks !== false/);
    assert.match(displaySection, /updateTheme\("showSocialLinks", checked\)/);
    assert.match(step5, /នៅផ្នែក «ការបង្ហាញ»/);
    assert.match(socialLinks, /settings\?\.showSocialLinks === false/);
    assert.match(socialLinks, /settings\?\.facebookUrl/);
    assert.match(socialLinks, /settings\?\.telegramUrl/);
    assert.match(socialLinks, /settings\?\.phoneNumber/);
    assert.match(types, /showSocialLinks\?: boolean/);
    for (const source of templateSources) {
        assert.match(source, /<SocialLinksSection wedding=\{wedding\} \/>/);
    }
});

test("every invitation template ends with the shared MONEO logo footer", async () => {
    const { readFile } = await import("node:fs/promises");
    const [brand, templateSources] = await Promise.all([
        readFile(new URL("../src/components/templates/shared/MoneaFooterBrand.tsx", import.meta.url), "utf8"),
        Promise.all([
            "../src/components/templates/khmer-legacy/FooterSection.tsx",
            "../src/components/templates/ModernMinimal.tsx",
            "../src/components/templates/fortune-harmony/ThankYouSection.tsx",
            "../src/components/templates/blossom-romance/ThankYouSection.tsx",
            "../src/components/templates/NeaM05Sections.tsx",
            "../src/components/templates/emerald-garden/ThankYouSection.tsx",
            "../src/components/templates/anniversary-elegant/AnniversaryThankYou.tsx",
            "../src/components/templates/GardenEditorial.tsx",
        ].map(async (path) => readFile(new URL(path, import.meta.url), "utf8"))),
    ]);

    assert.match(brand, /<MoneaLogoMark/);
    assert.match(brand, /MONEO/);
    assert.match(brand, /moneoez\.com/);
    for (const source of templateSources) {
        assert.match(source, /<MoneaFooterBrand/);
        assert.ok(source.indexOf("<SocialLinksSection") < source.indexOf("<MoneaFooterBrand"), "social links should appear before the brand footer");
    }
});

test("custom invitation labels render in their matching template sections", async () => {
    const { readFile } = await import("node:fs/promises");
    const templatesRoot = new URL("../src/components/templates/", import.meta.url);
    const files = [
        "modern-minimal/EntranceEnvelope.tsx",
        "modern-minimal/HeroSection.tsx",
        "modern-minimal/LocationSection.tsx",
        "modern-minimal/CountdownSection.tsx",
        "modern-minimal/GallerySection.tsx",
        "modern-minimal/GiftSection.tsx",
        "shared/GuestbookSection.tsx",
        "khmer-legacy/KhmerInvitation.tsx",
        "khmer-legacy/LocationMap.tsx",
        "khmer-legacy/DynamicGallery.tsx",
        "khmer-legacy/GiftSection.tsx",
        "GardenEditorial.tsx",
        "NeaM05.tsx",
        "NeaM05Sections.tsx",
        "anniversary-elegant/AnniversaryCountdown.tsx",
    ];
    const sources = Object.fromEntries(await Promise.all(
        files.map(async (file) => [file, await readFile(new URL(file, templatesRoot), "utf8")]),
    ));

    assert.match(sources["modern-minimal/EntranceEnvelope.tsx"], /customLabels\?\.invitationTitle/);
    assert.match(sources["modern-minimal/EntranceEnvelope.tsx"], /customLabels\?\.heroButton/);
    assert.match(sources["modern-minimal/HeroSection.tsx"], /customLabels\?\.heroSubtitle/);
    assert.match(sources["khmer-legacy/KhmerInvitation.tsx"], /themeSettings\?\.invitationText/);
    assert.match(sources["modern-minimal/LocationSection.tsx"], /customLabels\?\.locationTitle/);
    assert.match(sources["modern-minimal/LocationSection.tsx"], /customLabels\?\.locationSubtitle/);
    assert.match(sources["modern-minimal/CountdownSection.tsx"], /customLabels\?\.countdownLabel/);
    assert.match(sources["modern-minimal/GallerySection.tsx"], /customLabels\?\.galleryTitle/);
    assert.match(sources["shared/GuestbookSection.tsx"], /customLabels\?\.guestbookTitle/);
    assert.match(sources["modern-minimal/GiftSection.tsx"], /labels\?\.giftTitle/);
    assert.match(sources["modern-minimal/GiftSection.tsx"], /labels\.giftSubtitle/);
    assert.match(sources["modern-minimal/GiftSection.tsx"], /labels\.giftBadge/);
    assert.match(sources["GardenEditorial.tsx"], /customLabels\?\.locationTitle/);
    assert.match(sources["GardenEditorial.tsx"], /customLabels\?\.galleryTitle/);
    assert.match(sources["GardenEditorial.tsx"], /customLabels\?\.heroSubtitle/);
    assert.match(sources["GardenEditorial.tsx"], /customLabels\?\.heroButton/);
    assert.match(sources["NeaM05.tsx"], /customLabels\?\.invitationTitle/);
    assert.match(sources["NeaM05Sections.tsx"], /customLabels\?\.locationTitle/);
    assert.match(sources["NeaM05Sections.tsx"], /customLabels\?\.giftTitle/);
    assert.match(sources["anniversary-elegant/AnniversaryCountdown.tsx"], /customLabels\?\.countdownLabel/);
});

test("Rose Garden, Emerald Garden, and Fortune Harmony show the cover or couple photo in the hero", async () => {
    const { readFile } = await import("node:fs/promises");
    const heroFiles = [
        "../src/components/templates/blossom-romance/HeroSection.tsx",
        "../src/components/templates/emerald-garden/HeroSection.tsx",
        "../src/components/templates/fortune-harmony/HeroSection.tsx",
    ];

    for (const file of heroFiles) {
        const source = await readFile(new URL(file, import.meta.url), "utf8");
        assert.match(source, /getWeddingSectionPhoto\(wedding, "cover"\)/, `${file} should select the cover photo by key`);
        assert.match(source, /src=\{couplePhoto\}/, `${file} should render the selected image`);
    }
});

test("every template gallery and editor photo previews show a fallback when an image fails", async () => {
    const { readFile } = await import("node:fs/promises");
    const galleryFiles = [
        "../src/components/templates/modern-minimal/GallerySection.tsx",
        "../src/components/templates/fortune-harmony/GallerySection.tsx",
        "../src/components/templates/blossom-romance/GallerySection.tsx",
        "../src/components/templates/emerald-garden/GallerySection.tsx",
        "../src/components/templates/GardenEditorial.tsx",
        "../src/components/templates/anniversary-elegant/AnniversaryGallery.tsx",
        "../src/components/templates/NeaM05Sections.tsx",
        "../src/app/dashboard/design/components/sections/GeneralGallerySection.tsx",
    ];

    for (const file of galleryFiles) {
        const source = await readFile(new URL(file, import.meta.url), "utf8");
        assert.match(source, /PhotoImage/, `${file} should use the shared image-load fallback`);
    }

    const photoImage = await readFile(
        new URL("../src/components/templates/shared/PhotoImage.tsx", import.meta.url),
        "utf8",
    );
    assert.match(photoImage, /onError=\{\(event\) => \{[\s\S]*?setHasError\(true\)/);
    assert.match(photoImage, /មិនអាចបង្ហាញរូបនេះបាន/);
});

test("automatic photo upload reports persistence results and retries failed files", async () => {
    const { readFile } = await import("node:fs/promises");
    const mediaStep = await readFile(
        new URL("../src/app/dashboard/design/components/Step4Media.tsx", import.meta.url),
        "utf8",
    );
    const galleryUpload = await readFile(
        new URL("../src/hooks/use-cloudinary.ts", import.meta.url),
        "utf8",
    );
    const sectionUpload = await readFile(
        new URL("../src/hooks/use-cloudinary-upload.ts", import.meta.url),
        "utf8",
    );
    const wizard = await readFile(
        new URL("../src/app/dashboard/design/hooks/useDesignWizard.ts", import.meta.url),
        "utf8",
    );
    const gallerySection = await readFile(
        new URL("../src/app/dashboard/design/components/sections/GeneralGallerySection.tsx", import.meta.url),
        "utf8",
    );
    const cropper = await readFile(
        new URL("../src/components/ui/image-cropper-modal.tsx", import.meta.url),
        "utf8",
    );

    assert.match(gallerySection, /រូបវិចិត្រសាលត្រូវបានបន្ថែម និងរក្សាទុករួចរាល់/);
    assert.match(gallerySection, /role="alert"/);
    assert.match(mediaStep, /រូបបានផ្ទុកឡើង ប៉ុន្តែរក្សាទុកមិនបាន/);
    assert.match(wizard, /appendUploadedPhotosToGallery\(/);
    assert.match(wizard, /return saveChanges\(updated, \{ silent: true \}\)/);
    assert.match(wizard, /retryGalleryDirectUpload/);
    assert.match(galleryUpload, /failedUploads\.push\(file\)/);
    assert.match(galleryUpload, /setFailedFiles\(failedUploads\)/);
    assert.match(galleryUpload, /Math\.min\(3, totalFiles\)/);
    assert.match(galleryUpload, /uploadFileToR2\(file, options\.folder/);
    assert.match(sectionUpload, /uploadFileToR2\(file, folder, setProgress\)/);
    assert.match(galleryUpload, /retryFailedUploads: \(\) => failedFiles\.length > 0/);
    assert.match(gallerySection, /សាកដាក់រូបដែលបរាជ័យម្ដងទៀត/);
    assert.doesNotMatch(gallerySection, /toggleGalleryPhotoVisibility|hiddenGalleryPhotoKeys|EyeOff|លាក់រូបនេះពីធៀប/);
    assert.doesNotMatch(mediaStep, /CategorizedSlots|ImageCropperModal|useCloudinaryUpload/);
    assert.doesNotMatch(cropper, /label: '(?:Square|Portrait|Original)'|Flip H|Flip V/);
});

test("M01 informational sections use an unboxed layout while retaining media and QR surfaces", async () => {
    const { readFile } = await import("node:fs/promises");
    const files = {
        story: "khmer-legacy/LoveStorySection.tsx",
        schedule: "khmer-legacy/KhmerSchedule.tsx",
        countdown: "khmer-legacy/EventCountdown.tsx",
        gallery: "khmer-legacy/DynamicGallery.tsx",
        video: "khmer-legacy/VideoSection.tsx",
        location: "khmer-legacy/LocationMap.tsx",
        gift: "khmer-legacy/GiftSection.tsx",
        guestbook: "shared/GuestbookSection.tsx",
        rsvp: "khmer-legacy/RSVPSection.tsx",
        thankYou: "khmer-legacy/ThankYouSection.tsx",
        hero: "khmer-legacy/HeroSection.tsx",
    };
    const source = Object.fromEntries(await Promise.all(
        Object.entries(files).map(async ([key, file]) => [
            key,
            await readFile(new URL(`../src/components/templates/${file}`, import.meta.url), "utf8"),
        ]),
    ));

    assert.match(source.story, /mx-auto max-w-2xl text-center space-y-6/);
    assert.match(source.story, /rounded-2xl object-cover/);
    assert.doesNotMatch(source.story, /object-cover shadow-md/);
    assert.doesNotMatch(source.schedule, /items-center bg-\[#FAF9F6\].*rounded-3xl/);
    assert.match(source.schedule, /rounded-2xl overflow-hidden relative group/);
    assert.doesNotMatch(source.schedule, /overflow-hidden shadow-md border-2 border-white/);
    assert.doesNotMatch(source.countdown, /bg-white p-2 shadow-\[0_15px_40px/);
    assert.doesNotMatch(source.gallery, /bg-white p-1 rounded-2xl.*shadow-\[0_8px_24px/);
    assert.match(source.gallery, /galleryStyle === "polaroid" \? "aspect-square"/);
    assert.doesNotMatch(source.video, /shadow-\[0_50px_100px.*border-\[12px\]/);
    assert.doesNotMatch(source.location, /max-w-sm min-h-36 p-\d+.*bg-white rounded-3xl/);
    assert.doesNotMatch(source.location, /aspect-\[3\/4\].*bg-white p-2 shadow-/);
    assert.doesNotMatch(source.gift, /bg-gradient-to-b from-\[#FFFDF9\].*border-2.*rounded-\[2rem\]/);
    assert.match(source.gift, /bg-white rounded-2xl p-3\.5/);
    assert.match(source.guestbook, /unboxed = false/);
    assert.match(source.guestbook, /unboxed \? "" : `rounded-3xl border p-5 shadow-sm/);
    const m01 = await readFile(new URL("../src/components/templates/KhmerLegacy.tsx", import.meta.url), "utf8");
    assert.match(m01, /<GuestbookSection wedding=\{wedding\} unboxed \/>/);
    assert.doesNotMatch(source.rsvp, /bg-white\/60 backdrop-blur-2xl p-8 md:p-12 rounded-\[3rem\]/);
    assert.match(source.rsvp, /onClick=\{\(\) => handleStatusSelect\('CONFIRMED'\)\}/);
    assert.doesNotMatch(source.thankYou, /bg-white\/80 backdrop-blur-xl shadow-\[0_40px_100px/);
    assert.match(source.thankYou, /p-4 bg-white/);
    assert.doesNotMatch(source.hero, /rounded-full border border-\[#D4AF37\]\/35 bg-black\/20/);
    assert.match(source.hero, /onClick=\{\(\) => \{/);
});

test("M02 invitation content avoids decorative cards without removing interactive media", async () => {
    const { readFile } = await import("node:fs/promises");
    const files = {
        template: "ModernMinimal.tsx",
        hero: "modern-minimal/HeroSection.tsx",
        envelope: "modern-minimal/EntranceEnvelope.tsx",
        letter: "modern-minimal/LetterSection.tsx",
        location: "modern-minimal/LocationSection.tsx",
        gift: "modern-minimal/GiftSection.tsx",
        gallery: "modern-minimal/GallerySection.tsx",
        video: "modern-minimal/VideoSection.tsx",
        guestbook: "shared/GuestbookSection.tsx",
    };
    const source = Object.fromEntries(await Promise.all(
        Object.entries(files).map(async ([key, file]) => [
            key,
            await readFile(new URL(`../src/components/templates/${file}`, import.meta.url), "utf8"),
        ]),
    ));

    assert.match(source.template, /<GuestbookSection wedding=\{wedding\} tone="(?:dark|light)" unboxed accentColorOverride="#(?:d6bd83|9b8055)" \/>/);
    assert.doesNotMatch(source.hero, /rounded-full border border-slate-300\/80 bg-white\/70/);
    assert.match(source.hero, /heroPan\.onStart/);
    assert.doesNotMatch(source.envelope, /bg-white\/10 backdrop-blur-xl border border-white\/20.*rounded-full/);
    assert.doesNotMatch(source.letter, /border border-\[#d6cdb9\].*shadow-\[/);
    assert.match(source.letter, /backgroundImage: "var\(--monea-paper-texture/);
    assert.doesNotMatch(source.location, /rounded-\[32px\].*border border-slate-200.*shadow-\[/);
    assert.doesNotMatch(source.location, /rounded-\[20px\].*bg-slate-50 p-3/);
    assert.doesNotMatch(source.gift, /bg-slate-50\/80 rounded-\[2rem\] border border-slate-200\/80 shadow-sm/);
    assert.match(source.gift, /bg-white p-3 rounded-2xl/);
    assert.doesNotMatch(source.gallery, /shadow-sm hover:shadow-lg/);
    assert.match(source.gallery, /setSelectedIdx\(idx\)/);
    assert.doesNotMatch(source.video, /shadow-2xl border border-white\/10/);
    assert.match(source.video, /<iframe/);
    assert.match(source.guestbook, /unboxed = false/);
});

test("M04 Rose Garden avoids decorative cards while retaining invitation actions", async () => {
    const { readFile } = await import("node:fs/promises");
    const files = {
        template: "BlossomRomance.tsx",
        hero: "blossom-romance/HeroSection.tsx",
        parents: "blossom-romance/ParentsSection.tsx",
        schedule: "blossom-romance/ScheduleSection.tsx",
        location: "blossom-romance/LocationSection.tsx",
        gift: "blossom-romance/GiftSection.tsx",
        gallery: "blossom-romance/GallerySection.tsx",
        guestbook: "shared/GuestbookSection.tsx",
    };
    const source = Object.fromEntries(await Promise.all(
        Object.entries(files).map(async ([key, file]) => [
            key,
            await readFile(new URL(`../src/components/templates/${file}`, import.meta.url), "utf8"),
        ]),
    ));

    assert.match(source.template, /<GuestbookSection wedding=\{wedding\} unboxed \/>/);
    assert.doesNotMatch(source.template, /rounded-\[2rem\].*border border-rose-200.*shadow-/);
    assert.doesNotMatch(source.hero, /border-4 border-white\/90 shadow-xl/);
    assert.doesNotMatch(source.parents, /bg-white\/80 border border-rose-200\/80 rounded-2xl p-4 shadow-sm/);
    assert.doesNotMatch(source.parents, /bg-rose-50\/70 border border-rose-200\/60 rounded-3xl/);
    assert.match(source.schedule, /space-y-3 before:pointer-events-none before:absolute/);
    assert.doesNotMatch(source.schedule, /bg-white\/95 border border-rose-200\/70 rounded-2xl p-4 shadow-sm/);
    assert.match(source.location, /href=\{directUrl\}/);
    assert.doesNotMatch(source.location, /bg-white\/90 border border-rose-200\/80 rounded-3xl/);
    assert.match(source.gift, /bg-white p-2/);
    assert.match(source.gift, /onClick=\{\(\) => acc\.accountNumber && handleCopy/);
    assert.doesNotMatch(source.gift, /bg-white border border-rose-200\/80 rounded-3xl p-5 shadow-sm/);
    assert.doesNotMatch(source.gift, /bg-slate-50 border border-slate-200\/80.*rounded-xl/);
    assert.match(source.gallery, /onClick=\{\(\) => setSelectedPhoto\(idx\)\}/);
    assert.match(source.gallery, /photos\[selectedPhoto\]\.url/);
    assert.doesNotMatch(source.gallery, /shadow-sm border border-rose-100/);
    assert.match(source.guestbook, /unboxed = false/);
});
