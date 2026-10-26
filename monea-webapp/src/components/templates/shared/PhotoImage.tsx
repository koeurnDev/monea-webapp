import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

import { buildSrcSet, getOriginalMediaUrl, MEDIA_WIDTHS, optimizeMediaUrl } from "@/lib/media";

type PhotoImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export function PhotoImage({ src, alt, className, onError, loading, decoding, sizes, srcSet, ...props }: PhotoImageProps) {
    const [hasError, setHasError] = useState(false);
    const [useOriginal, setUseOriginal] = useState(false);

    useEffect(() => {
        setHasError(false);
        setUseOriginal(false);
    }, [src]);

    const originalSrc = typeof src === "string" ? getOriginalMediaUrl(src) : null;
    const imageSource = originalSrc || src;
    const optimizedSrc = typeof imageSource === "string"
        ? optimizeMediaUrl(imageSource, { width: 1200, quality: 78 })
        : imageSource;
    const responsiveSrcSet = srcSet ?? (typeof imageSource === "string"
        ? buildSrcSet(imageSource, MEDIA_WIDTHS.lightbox, { quality: 78 })
        : undefined);

    return (
        <>
            <img
                loading={loading ?? "lazy"}
                decoding={decoding ?? "async"}
                sizes={sizes ?? "(max-width: 430px) 100vw, 430px"}
                srcSet={useOriginal ? undefined : responsiveSrcSet}
                {...props}
                src={useOriginal ? originalSrc || optimizedSrc : optimizedSrc}
                alt={alt}
                className={className}
                aria-hidden={hasError || undefined}
                onError={(event) => {
                    if (!useOriginal && originalSrc && originalSrc !== optimizedSrc) {
                        setUseOriginal(true);
                        event.currentTarget.srcset = "";
                    } else {
                        setHasError(true);
                    }
                    onError?.(event);
                }}
            />
            {hasError && (
                <span
                    role="img"
                    aria-label={alt ? `មិនអាចបង្ហាញរូបភាព៖ ${alt}` : "មិនអាចបង្ហាញរូបភាព"}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100 px-3 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                >
                    <ImageOff aria-hidden="true" className="h-7 w-7" />
                    <span className="text-xs font-semibold">មិនអាចបង្ហាញរូបនេះបាន</span>
                </span>
            )}
        </>
    );
}
