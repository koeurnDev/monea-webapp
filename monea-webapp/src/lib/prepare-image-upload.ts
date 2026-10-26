const MAX_IMAGE_DIMENSION = 1600;
const COMPRESSION_THRESHOLD = 512 * 1024;
const OPTIMIZABLE_IMAGE_TYPES = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"]);

export function getOptimizedImageDimensions(width: number, height: number) {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

export async function prepareImageForUpload(file: File): Promise<File> {
    if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type.toLowerCase())) return file;

    const bitmap = await createImageBitmap(file);
    try {
        const dimensions = getOptimizedImageDimensions(bitmap.width, bitmap.height);
        const resized = dimensions.width !== bitmap.width || dimensions.height !== bitmap.height;
        if (!resized && file.size <= COMPRESSION_THRESHOLD) return file;

        const canvas = document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare image for upload");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const compressed = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error("Could not compress image for upload")),
                "image/webp",
                0.8,
            );
        });
        if (compressed.type !== "image/webp") {
            throw new Error("This browser could not convert the image to WebP");
        }
        if (!resized && compressed.size >= file.size) return file;

        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([compressed], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: file.lastModified,
        });
    } finally {
        bitmap.close();
    }
}
