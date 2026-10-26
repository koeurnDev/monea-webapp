export type WeddingPhotoSlotKey =
    | "cover"
    | "couple"
    | "location"
    | "locationBackup"
    | "editorial1"
    | "editorial2"
    | "editorial3"
    | "editorial4"
    | "signature1"
    | "signature2"
    | "signature3"
    | "signature4"
    | "signature5"
    | "signature6"
    | "divider1"
    | "divider2"
    | "thankYou"
    | "groom"
    | "bride"
    | "countdown"
    | "gift"
    | "story"
    | "gallery1"
    | "gallery2"
    | "gallery3"
    | "gallery4"
    | "gallery5"
    | "gallery6"
    | "gallery7"
    | "gallery8"
    | "gallery9"
    | "gallery10";

export interface WeddingPhotoSlot {
    key: WeddingPhotoSlotKey;
    index: number;
    title: string;
    locationHint: string;
    aspectRatio: number;
    display: "section" | "gallery";
}

export interface WeddingPhotoLayout {
    slots: WeddingPhotoSlot[];
    featuredSlotKeys: WeddingPhotoSlotKey[];
    categoryTitles: {
        featured: string;
        additional: string;
    };
}

type SlotDefinition = Omit<WeddingPhotoSlot, "index">;

const GALLERY_CATEGORY_TITLES = {
    featured: "រូបសម្រាប់ផ្នែកសំខាន់",
    additional: "រូបវិចិត្រសាល",
};

const createLayout = (
    slots: SlotDefinition[],
    featuredSlotKeys: WeddingPhotoSlotKey[],
    categoryTitles = GALLERY_CATEGORY_TITLES,
): WeddingPhotoLayout => ({
    slots: slots.map((slot, index) => ({ index, ...slot })),
    featuredSlotKeys,
    categoryTitles,
});

const sectionSlot = (
    key: WeddingPhotoSlotKey,
    title: string,
    locationHint: string,
    aspectRatio: number,
): SlotDefinition => ({ key, title, locationHint, aspectRatio, display: "section" });

const GALLERY_SLOT_KEYS = [
    "gallery1",
    "gallery2",
    "gallery3",
    "gallery4",
    "gallery5",
    "gallery6",
    "gallery7",
    "gallery8",
    "gallery9",
    "gallery10",
] as const satisfies readonly WeddingPhotoSlotKey[];

const gallerySlot = (number: number): SlotDefinition => {
    const key = GALLERY_SLOT_KEYS[number - 1];
    if (!key) throw new Error(`Unknown gallery photo slot ${number}`);
    return {
        key,
        title: `រូបវិចិត្រសាល ${number}`,
        locationHint: "បង្ហាញក្នុងវិចិត្រសាលរូបភាព",
        aspectRatio: 4 / 3,
        display: "gallery",
    };
};

const gallerySlots = (count: number, startNumber = 1): SlotDefinition[] =>
    Array.from({ length: count }, (_, index) => gallerySlot(startNumber + index));

const SIGNATURE_SLOT_KEYS = [
    "signature1",
    "signature2",
    "signature3",
    "signature4",
    "signature5",
    "signature6",
] as const satisfies readonly WeddingPhotoSlotKey[];

const signatureSlot = (number: number): SlotDefinition => {
    const key = SIGNATURE_SLOT_KEYS[number - 1];
    if (!key) throw new Error(`Unknown signature photo slot ${number}`);
    return sectionSlot(key, `រូប Signature ${number}`, `ផ្នែក Signature Moments ${number}`, 3 / 4);
};

export const WEDDING_PHOTO_LAYOUTS: Record<string, WeddingPhotoLayout> = {
    "khmer-legacy": createLayout([
        sectionSlot("cover", "រូបក្របធំ", "ផ្ទៃក្របធៀប", 3 / 4),
        sectionSlot("couple", "រូបគូ", "ផ្នែករាប់ថយក្រោយ", 4 / 3),
        sectionSlot("location", "រូបទីតាំងកម្មវិធី", "រូបទីតាំងក្នុងផ្នែក Location", 4 / 5),
        sectionSlot("editorial1", "រូប Editorial ១", "រូបភាពផ្នែក Editorial ១", 4 / 3),
        sectionSlot("editorial2", "រូប Editorial ២", "រូបភាពធំផ្នែក Editorial ២", 16 / 9),
        sectionSlot("locationBackup", "រូបទីតាំងបម្រុង", "ប្រើនៅផ្នែក Location ពេលគ្មានរូបទីតាំងសំខាន់", 4 / 5),
        ...Array.from({ length: 6 }, (_, index) => signatureSlot(index + 1)),
    ], ["cover", "couple"], {
        featured: "រូបក្រប និងរូបគូ",
        additional: "រូបទីតាំង, Editorial និង Signature Moments",
    }),
    "modern-minimal": createLayout([
        sectionSlot("cover", "រូបក្របធំ", "រូបផ្ទៃខាងក្រោយ Hero", 3 / 4),
        sectionSlot("divider1", "រូបបែងចែកផ្នែក ១", "ផ្នែក Parallax Divider ១", 16 / 9),
        gallerySlot(1),
        gallerySlot(2),
        sectionSlot("thankYou", "រូបអំណរគុណ", "ផ្ទៃខាងក្រោយផ្នែក Thank You", 16 / 9),
        gallerySlot(3),
        sectionSlot("divider2", "រូបបែងចែកផ្នែក ២", "ផ្នែក Parallax Divider ២", 16 / 9),
        gallerySlot(4),
        gallerySlot(5),
        sectionSlot("groom", "រូបកូនកំលោះ", "រូបបញ្ឈរផ្នែកឈ្មោះគូ", 3 / 4),
        sectionSlot("bride", "រូបកូនក្រមុំ", "រូបបញ្ឈរផ្នែកឈ្មោះគូ", 3 / 4),
    ], ["cover", "divider1", "divider2"], {
        featured: "រូបក្រប និងរូបបែងចែកផ្នែក",
        additional: "រូបវិចិត្រសាល, Thank You និងរូបកូនកំលោះ/កូនក្រមុំ",
    }),
    "fortune-harmony": createLayout([
        sectionSlot("cover", "រូបគូផ្នែក Hero", "រូបបញ្ឈរផ្នែកដើមធៀប", 4 / 5),
        ...gallerySlots(10),
    ], ["cover"], {
        featured: "រូបក្រប",
        additional: "រូបវិចិត្រសាល",
    }),
    "blossom-romance": createLayout([
        sectionSlot("cover", "រូបគូផ្នែក Hero", "រូបបញ្ឈរផ្នែកដើមធៀប", 4 / 5),
        ...gallerySlots(10),
    ], ["cover"], {
        featured: "រូបក្រប",
        additional: "រូបវិចិត្រសាល",
    }),
    "nea-m05": createLayout([
        sectionSlot("cover", "រូបក្របធំ", "ផ្ទៃខាងក្រោយក្រប NEA", 3 / 4),
        ...gallerySlots(10),
    ], ["cover"], {
        featured: "រូបក្រប",
        additional: "រូបវិចិត្រសាល",
    }),
    "emerald-garden": createLayout([
        sectionSlot("cover", "រូបគូផ្នែក Hero", "រូបបញ្ឈរផ្នែកដើមធៀប", 4 / 5),
        ...gallerySlots(10),
    ], ["cover"], {
        featured: "រូបក្រប",
        additional: "រូបវិចិត្រសាល",
    }),
    "anniversary-elegant": createLayout([
        sectionSlot("cover", "រូបក្របធំ", "រូបផ្ទៃខាងក្រោយ Hero", 3 / 4),
        sectionSlot("countdown", "រូប Countdown", "រូបធំផ្នែករាប់ថយក្រោយ", 16 / 9),
        sectionSlot("location", "រូបទីតាំងកម្មវិធី", "រូបក្នុងផ្នែកទីតាំង", 4 / 5),
        sectionSlot("gift", "រូបចំណងដៃ", "រូបគូក្នុងផ្នែកចំណងដៃ", 4 / 5),
        sectionSlot("thankYou", "រូបថ្លែងអំណរគុណ", "រូបបញ្ឈរផ្នែក Thank You", 3 / 4),
        gallerySlot(1),
        sectionSlot("story", "រូបរឿងរ៉ាវ", "រូបធំផ្នែករឿងរ៉ាវពេលមិនមាន story image ផ្ទាល់ខ្លួន", 16 / 10),
        gallerySlot(2),
        gallerySlot(3),
        sectionSlot("groom", "រូបថតស្វាមី", "រូបមូលផ្នែកពាក្យសន្យា", 1),
        sectionSlot("bride", "រូបថតភរិយា", "រូបមូលផ្នែកពាក្យសន្យា", 1),
    ], ["cover", "countdown"], {
        featured: "រូបក្រប និង Countdown",
        additional: "រូបទីតាំង, រឿងរ៉ាវ, ពាក្យសន្យា និងវិចិត្រសាល",
    }),
    "garden-editorial": createLayout([
        sectionSlot("cover", "រូបក្របធំ", "ផ្ទៃរូបភាព Hero និងសំបុត្រអញ្ជើញ", 3 / 4),
        sectionSlot("location", "រូបទីតាំងកម្មវិធី", "រូបក្នុងផ្នែកទីតាំង", 4 / 3),
        sectionSlot("story", "រូបរឿងរ៉ាវ", "រូបផ្នែករឿងរ៉ាវពេលមិនមានរូប story", 16 / 10),
        ...gallerySlots(8),
    ], ["cover"], {
        featured: "រូបក្រប",
        additional: "រូបទីតាំង, រឿងរ៉ាវ និងវិចិត្រសាល",
    }),
};

export const getWeddingPhotoLayout = (templateId?: string | null): WeddingPhotoLayout =>
    WEDDING_PHOTO_LAYOUTS[templateId || ""] || WEDDING_PHOTO_LAYOUTS["khmer-legacy"];

export const assignUploadedPhotosToSlots = <T extends { url?: string; type?: string }>(
    currentItems: T[],
    uploadedPhotos: T[],
    templateId?: string | null,
): T[] => {
    const nextItems = [...currentItems];
    const photoLayout = getWeddingPhotoLayout(templateId);

    for (const photo of uploadedPhotos) {
        const nextSlot = photoLayout.slots.find((slot) => {
            const current = nextItems[slot.index];
            return !current?.url && current?.type?.toUpperCase() !== "CERTIFICATE";
        });

        if (nextSlot) {
            nextItems[nextSlot.index] = photo;
        } else {
            nextItems.push(photo);
        }
    }

    return nextItems;
};

export const appendUploadedPhotosToGallery = (
    currentItems: readonly { url?: string; publicId?: string; type?: string }[],
    uploadedPhotos: readonly { url?: string; publicId?: string; type?: string }[],
    templateId?: string | null,
): { url: string; publicId?: string; type: string }[] => {
    const nextItems = currentItems.map((item) => ({
        ...item,
        url: item.url || "",
        type: item.type || "IMAGE",
    }));
    const slotCount = getWeddingPhotoLayout(templateId).slots.length;
    while (nextItems.length < slotCount) {
        nextItems.push({ url: "", type: "IMAGE" });
    }

    for (const photo of uploadedPhotos) {
        if (!photo.url?.trim() || photo.type?.toUpperCase() === "VIDEO" || photo.type?.toUpperCase() === "CERTIFICATE") {
            continue;
        }
        const isDuplicate = nextItems.some((item) =>
            (photo.publicId && item.publicId === photo.publicId)
            || item.url === photo.url
        );
        if (!isDuplicate) {
            nextItems.push({ ...photo, url: photo.url, type: photo.type || "IMAGE" });
        }
    }

    return nextItems;
};

export const swapWeddingPhotoSlots = <T extends { url?: string; type?: string }>(
    currentItems: readonly T[],
    fromIndex: number,
    toIndex: number,
    templateId?: string | null,
): T[] | null => {
    const photoLayout = getWeddingPhotoLayout(templateId);
    const isPhoto = (item: T | undefined) =>
        Boolean(item?.url?.trim())
        && item?.type?.toUpperCase() !== "VIDEO"
        && item?.type?.toUpperCase() !== "CERTIFICATE";

    if (
        fromIndex === toIndex
        || fromIndex < 0
        || toIndex < 0
        || fromIndex >= currentItems.length
        || toIndex >= currentItems.length
        || !isPhoto(currentItems[fromIndex])
    ) {
        return null;
    }

    const target = currentItems[toIndex];
    const targetIsEmptySlot = toIndex < photoLayout.slots.length
        && !target?.url?.trim()
        && target?.type?.toUpperCase() !== "VIDEO"
        && target?.type?.toUpperCase() !== "CERTIFICATE";
    if (!isPhoto(target) && !targetIsEmptySlot) return null;

    const nextItems = [...currentItems];
    [nextItems[fromIndex], nextItems[toIndex]] = [nextItems[toIndex], nextItems[fromIndex]];
    return nextItems;
};

export const getWeddingPhotoSlotIndex = (
    templateId: string | null | undefined,
    key: WeddingPhotoSlotKey,
): number | undefined => getWeddingPhotoLayout(templateId).slots.find((slot) => slot.key === key)?.index;

export const getWeddingPhotoSlotKey = (
    templateId: string | null | undefined,
    index: number,
): WeddingPhotoSlotKey | undefined => getWeddingPhotoLayout(templateId).slots[index]?.key;

export const getWeddingPhotoSlotAspectRatio = (
    key: WeddingPhotoSlotKey,
    templateId?: string | null,
): number => getWeddingPhotoLayout(templateId).slots.find((slot) => slot.key === key)?.aspectRatio ?? 3 / 4;

export const migrateWeddingPhotoSlots = (
    items: readonly { url: string; publicId?: string; type: string }[] | undefined,
    fromTemplateId: string | null | undefined,
    toTemplateId: string | null | undefined,
    hiddenPhotoSlots: readonly number[] = [],
    hiddenGalleryPhotoKeys: readonly string[] = [],
) => {
    const sourceLayout = getWeddingPhotoLayout(fromTemplateId);
    const targetLayout = getWeddingPhotoLayout(toTemplateId);
    const sourceItems = items || [];
    const sourceHiddenSlots = new Set(hiddenPhotoSlots);
    const nextHiddenSlots = new Set<number>();
    const nextHiddenGalleryPhotos = new Set(hiddenGalleryPhotoKeys);
    const targetItems = Array.from({ length: targetLayout.slots.length }, () => ({
        url: "",
        type: "IMAGE",
    }));
    const overflowItems: typeof sourceItems[number][] = [];
    let movedToGalleryCount = 0;
    const targetIndexesByKey = new Map(targetLayout.slots.map((slot) => [slot.key, slot.index]));

    for (const sourceSlot of sourceLayout.slots) {
        const item = sourceItems[sourceSlot.index];
        const targetIndex = targetIndexesByKey.get(sourceSlot.key);
        const isHidden = sourceHiddenSlots.has(sourceSlot.index);

        if (targetIndex !== undefined) {
            if (item?.url) targetItems[targetIndex] = item;
            if (isHidden) nextHiddenSlots.add(targetIndex);
            continue;
        }

        if (item?.url) {
            overflowItems.push(item);
            movedToGalleryCount += 1;
            if (isHidden) nextHiddenGalleryPhotos.add(item.publicId || item.url);
        }
    }

    const sourceGeneralItems = sourceItems.slice(sourceLayout.slots.length);
    return {
        galleryItems: [...targetItems, ...overflowItems, ...sourceGeneralItems],
        hiddenPhotoSlots: [...nextHiddenSlots].sort((a, b) => a - b),
        hiddenGalleryPhotoKeys: [...nextHiddenGalleryPhotos],
        movedToGalleryCount,
    };
};
