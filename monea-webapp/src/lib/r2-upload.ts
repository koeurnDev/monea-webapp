import { moneaClient } from "@/lib/api-client";
import { getApiUrl } from "@/lib/api-url";
import { prepareImageForUpload } from "@/lib/prepare-image-upload";

export interface R2UploadResult {
    success: true;
    url: string;
    publicId: string;
    size: number;
    contentType: string;
}

interface R2PresignResponse {
    mode: "proxy" | "direct";
    uploadUrl?: string;
    url?: string;
    publicId?: string;
    contentType?: string;
}

function parseUploadResult(xhr: XMLHttpRequest): R2UploadResult {
    let response: unknown;
    try {
        response = JSON.parse(xhr.responseText);
    } catch {
        throw new Error("R2 returned an invalid upload response");
    }

    if (xhr.status < 200 || xhr.status >= 300) {
        const message = response && typeof response === "object" && "error" in response
            && typeof response.error === "string"
            ? response.error
            : `R2 upload failed (${xhr.status})`;
        throw new Error(message);
    }

    if (
        !response
        || typeof response !== "object"
        || !("success" in response && response.success === true)
        || !("url" in response && typeof response.url === "string")
        || !("publicId" in response && typeof response.publicId === "string")
        || !("size" in response && typeof response.size === "number")
        || !("contentType" in response && typeof response.contentType === "string")
    ) {
        throw new Error("R2 returned an incomplete upload response");
    }

    return response as R2UploadResult;
}

export async function uploadFileToR2(
    file: File,
    folder?: string,
    onProgress?: (percent: number) => void,
): Promise<R2UploadResult> {
    const uploadFile = await prepareImageForUpload(file);
    const presignResponse = await moneaClient.post<R2PresignResponse>("/api/r2/presign", {
        folder,
        fileName: uploadFile.name || "upload",
        contentType: uploadFile.type,
        size: uploadFile.size,
    });
    if (presignResponse.error || !presignResponse.data) {
        throw new Error(presignResponse.error || "Could not prepare R2 upload");
    }

    if (presignResponse.data.mode === "direct") {
        const { uploadUrl, url, publicId, contentType } = presignResponse.data;
        if (!uploadUrl || !url || !publicId || !contentType) {
            throw new Error("R2 returned an incomplete direct upload response");
        }
        await uploadToUrl(uploadUrl, uploadFile, contentType, onProgress);
        return {
            success: true,
            url,
            publicId,
            size: uploadFile.size,
            contentType,
        };
    }
    if (presignResponse.data.mode !== "proxy") {
        throw new Error("R2 returned an unsupported upload mode");
    }

    return uploadThroughWorker(uploadFile, folder, onProgress);
}

function uploadToUrl(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void,
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
                return;
            }
            reject(new Error(`Direct R2 upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error while uploading directly to R2"));
        xhr.onabort = () => reject(new Error("R2 upload was cancelled"));
        xhr.send(file);
    });
}

async function uploadThroughWorker(
    file: File,
    folder?: string,
    onProgress?: (percent: number) => void,
): Promise<R2UploadResult> {
    const csrfResponse = await moneaClient.get<{ token?: string }>("/api/auth/csrf");
    const csrfToken = csrfResponse.data?.token;
    if (csrfResponse.error || !csrfToken) {
        throw new Error(csrfResponse.error || "Could not obtain a CSRF token for upload");
    }
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    return new Promise<R2UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${getApiUrl("/api/r2/upload")}${query}`);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("X-CSRF-Token", csrfToken);
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name || "upload"));

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
            try {
                resolve(parseUploadResult(xhr));
            } catch (error) {
                reject(error);
            }
        };
        xhr.onerror = () => reject(new Error("Network error while uploading to R2"));
        xhr.onabort = () => reject(new Error("R2 upload was cancelled"));
        xhr.send(file);
    });
}
