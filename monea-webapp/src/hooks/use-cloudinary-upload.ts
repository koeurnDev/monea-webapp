import { useState } from "react";
import { uploadFileToR2 } from "@/lib/r2-upload";

interface UseCloudinaryUploadProps {
    onSuccess: (url: string, publicId?: string, type?: "IMAGE" | "VIDEO") => void | Promise<void>;
    onError?: (error: unknown) => void;
    resourceType?: "auto" | "image" | "video" | "raw";
    folder?: string;
}

export function useCloudinaryUpload({
    onSuccess,
    onError,
    resourceType = "auto",
    folder,
}: UseCloudinaryUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [lastFile, setLastFile] = useState<File | null>(null);

    const uploadFile = async (file: File) => {
        setLastFile(file);
        setError(null);
        setUploading(true);
        setProgress(0);

        try {
            const result = await uploadFileToR2(file, folder, setProgress);
            const isVideo = result.contentType.startsWith("video/")
                || (resourceType === "video" && result.contentType.startsWith("audio/"));
            await onSuccess(result.url, result.publicId, isVideo ? "VIDEO" : "IMAGE");
            setProgress(100);
        } catch (uploadError) {
            console.error("R2 upload failed:", uploadError);
            setError(uploadError instanceof Error ? uploadError.message : "ការបញ្ចូលឯកសារបរាជ័យ។");
            onError?.(uploadError);
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        progress,
        error,
        uploadFile,
        retryUpload: () => lastFile ? uploadFile(lastFile) : undefined,
    };
}
