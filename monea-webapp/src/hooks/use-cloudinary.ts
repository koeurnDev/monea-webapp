import { useState } from 'react';
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/network-errors";
import { uploadFileToR2 } from "@/lib/r2-upload";

interface UseCloudinaryOptions {
    onSuccess?: (items: { url: string; publicId: string; type?: "IMAGE" | "VIDEO" }[]) => void;
    onError?: (error: any) => void;
    folder?: string;
}

export function useCloudinary(options: UseCloudinaryOptions = {}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [failedFiles, setFailedFiles] = useState<File[]>([]);

    const uploadFiles = async (files: File[]) => {
        setUploading(true);
        setProgress(0);
        setError(null);
        setFailedFiles([]);

        const filesArray = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (filesArray.length === 0) {
            if (files.length > 0) setError("សូមជ្រើសរើសឯកសាររូបភាព ឬវីដេអូ។");
            setUploading(false);
            return [];
        }

        const totalFiles = filesArray.length;
        const fileProgress = new Array<number>(totalFiles).fill(0);
        const failedUploads: File[] = [];
        let networkFailure = false;

        try {
            const results: ({ url: string; publicId: string; type: "IMAGE" | "VIDEO" } | null)[] = new Array(totalFiles).fill(null);
            let nextFileIndex = 0;
            const worker = async () => {
                while (nextFileIndex < totalFiles) {
                    const fileIndex = nextFileIndex++;
                    const file = filesArray[fileIndex];
                    try {
                    const isVideo = file.type.startsWith('video/');
                    const result = await uploadFileToR2(file, options.folder, (percent) => {
                            fileProgress[fileIndex] = percent;
                            setProgress(Math.round(fileProgress.reduce((total, value) => total + value, 0) / totalFiles));
                        });
                        fileProgress[fileIndex] = 100;
                        results[fileIndex] = {
                            url: result.url,
                            publicId: result.publicId,
                            type: isVideo ? 'VIDEO' : 'IMAGE',
                        };
                    } catch (err) {
                        console.error("Single file upload failed", err);
                        if (isNetworkError(err)) networkFailure = true;
                        failedUploads.push(file);
                        fileProgress[fileIndex] = 100;
                    }
                    setProgress(Math.round(fileProgress.reduce((total, value) => total + value, 0) / totalFiles));
                }
            };

            await Promise.all(
                Array.from({ length: Math.min(3, totalFiles) }, () => worker()),
            );

            const successItems = results.filter(
                (item): item is { url: string; publicId: string; type: "IMAGE" | "VIDEO" } => item !== null,
            );
            setFailedFiles(failedUploads);
            if (failedUploads.length > 0) {
                setError(networkFailure
                    ? NETWORK_ERROR_MESSAGE
                    : `បង្ហោះបាន ${successItems.length}/${totalFiles} ឯកសារ។ ${failedUploads.length} ឯកសារបរាជ័យ។`);
            }

            if (options.onSuccess) {
                options.onSuccess(successItems);
            }

            return successItems;

        } catch (err) {
            console.error("Upload error:", err);
            setError(isNetworkError(err)
                ? NETWORK_ERROR_MESSAGE
                : err instanceof Error ? err.message : "ការបង្ហោះឯកសារបរាជ័យ។");
            if (options.onError) {
                options.onError(err);
            }
            return [];
        } finally {
            setUploading(false);
        }
    };

    return {
        uploadFiles,
        retryFailedUploads: () => failedFiles.length > 0 ? uploadFiles(failedFiles) : undefined,
        uploading,
        progress,
        error,
        failedFileCount: failedFiles.length,
    };
}
