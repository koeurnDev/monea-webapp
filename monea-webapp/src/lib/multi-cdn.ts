import { moneaClient } from "@/lib/api-client";
import { uploadFileToR2 } from "@/lib/r2-upload";

export interface UnifiedUploadResult {
    success: boolean;
    url: string;
    publicId: string;
    provider: "r2";
    size?: number;
    error?: string;
}

export interface UploadMediaOptions {
    folder?: string;
    preferredProvider?: "r2" | "auto";
    onProgress?: (percent: number) => void;
}

export async function uploadMedia(
    file: File,
    options: UploadMediaOptions = {},
): Promise<UnifiedUploadResult> {
    const result = await uploadFileToR2(file, options.folder, options.onProgress);
    return {
        success: true,
        url: result.url,
        publicId: result.publicId,
        provider: "r2",
        size: result.size,
    };
}

function getR2PublicId(urlOrPublicId: string): string | null {
    if (urlOrPublicId.startsWith("r2:")) return urlOrPublicId;
    try {
        const url = new URL(urlOrPublicId);
        if (url.hostname !== "media.moneoez.com") return null;
        const key = url.pathname.split("/").filter(Boolean).map(decodeURIComponent).join("/");
        return key ? `r2:${key}` : null;
    } catch {
        return null;
    }
}

export async function deleteMedia(
    urlOrPublicId: string,
    resourceType: "image" | "video" = "image",
): Promise<boolean> {
    if (!urlOrPublicId) return true;

    try {
        const r2PublicId = getR2PublicId(urlOrPublicId);
        if (r2PublicId) {
            const response = await moneaClient.post<{ success?: boolean }>("/api/r2/delete", {
                publicId: r2PublicId,
            });
            return !response.error && response.data?.success === true;
        }

        if (urlOrPublicId.includes("imagekit.io") || urlOrPublicId.startsWith("ik_")) {
            const fileId = urlOrPublicId.includes("/") ? urlOrPublicId.split("/").pop() : urlOrPublicId;
            const response = await moneaClient.post<{ success?: boolean }>("/api/imagekit/delete", { fileId });
            return !response.error && response.data?.success === true;
        }

        const publicId = urlOrPublicId.includes("cloudinary.com")
            ? (urlOrPublicId.split("/upload/")[1]?.replace(/^v\d+\//, "").split(".")[0] || urlOrPublicId)
            : urlOrPublicId;
        const response = await moneaClient.post<{ success?: boolean }>("/api/cloudinary/delete", {
            public_id: publicId,
            resource_type: resourceType,
        });
        return !response.error && response.data?.success === true;
    } catch (error) {
        console.warn("[Media Delete Error]:", error);
        return false;
    }
}
