import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { WeddingData } from "../types";
import { getWeddingPhotos } from "../shared/weddingPhotos";
import { getGalleryCardClass, getGalleryContainerClass, getGalleryDisplayStyle, getGalleryImageClass } from "../shared/gallery-layout";
import { PhotoImage } from "../shared/PhotoImage";
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

function GalleryThumbnail({
    url,
    alt,
    className,
    sizes,
}: {
    url: string;
    alt: string;
    className: string;
    sizes: string;
}) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <PhotoImage
            src={url}
            alt={alt}
            className={`${className} opacity-0 transition-[opacity,transform] duration-500 ${isLoaded ? "opacity-100" : ""}`}
            sizes={sizes}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
        />
    );
}

export const GallerySection = ({
    wedding,
    onLightboxOpenChange,
}: {
    wedding: WeddingData;
    onLightboxOpenChange?: (open: boolean) => void;
}) => {
    const validImages = getWeddingPhotos(wedding).map((item) => item.url.trim());
    const galleryStyle = getGalleryDisplayStyle(wedding.themeSettings?.galleryStyle);

    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const titleText = wedding.themeSettings?.customLabels?.galleryTitle
        || wedding.themeSettings?.customLabels?.gallery_title
        || "វិចិត្រសាល";

    if (validImages.length === 0) return null;

    return (
        <section className="relative overflow-hidden bg-[#fbfaf7] px-4 py-16 sm:px-6 md:py-24" id="gallery-modern">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mb-8 flex flex-col items-center space-y-2.5 text-center sm:mb-10"
                >
                    <h2 className="text-2xl md:text-3xl font-khmer-moul text-slate-900 tracking-tight leading-relaxed">
                        {titleText}
                    </h2>
                    <div className="w-12 h-1 bg-slate-900/80 rounded-full mx-auto" />
                </m.div>

                <div className={getGalleryContainerClass(galleryStyle)}>
                    {validImages.map((url, idx) => (
                        <button
                            key={`${url}-${idx}`}
                            type="button"
                            aria-label={`រូបទី ${idx + 1} - ចុចដើម្បីពង្រីកមើល`}
                            onClick={() => {
                                setSelectedIdx(idx);
                                onLightboxOpenChange?.(true);
                            }}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-sm transition-[transform,box-shadow] duration-200 active:scale-[0.98] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055] focus-visible:ring-offset-2 ${getGalleryCardClass(galleryStyle, idx)}`}
                        >
                            <GalleryThumbnail
                                url={url}
                                alt={`Gallery ${idx + 1}`}
                                className={`${getGalleryImageClass(galleryStyle)} group-hover:scale-[1.03]`}
                                sizes={galleryStyle === "slider"
                                    ? "(max-width: 640px) 82vw, 60vw"
                                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedIdx !== null && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setSelectedIdx(null);
                                onLightboxOpenChange?.(false);
                            }}
                            className="absolute top-6 right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Navigation Previous */}
                        {validImages.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIdx((selectedIdx - 1 + validImages.length) % validImages.length);
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {/* Navigation Next */}
                        {validImages.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIdx((selectedIdx + 1) % validImages.length);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        {/* Active Image */}
                        <m.div
                            key={selectedIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center p-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PhotoImage
                                src={validImages[selectedIdx]}
                                alt="Full preview"
                                className="max-w-full max-h-[82vh] object-contain"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </m.div>

                        {/* Image Counter */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono tracking-widest font-bold">
                            {selectedIdx + 1} / {validImages.length}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};
