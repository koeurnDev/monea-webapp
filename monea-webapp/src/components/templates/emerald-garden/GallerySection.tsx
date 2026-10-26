import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { WeddingData } from '../types';
import { getWeddingPhotos } from "../shared/weddingPhotos";
import { getGalleryContainerClass, getGalleryDisplayStyle } from "../shared/gallery-layout";
import { PhotoImage } from "../shared/PhotoImage";

interface GallerySectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ wedding, primaryColor }) => {
    const photos = getWeddingPhotos(wedding);
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
    const galleryTitle = wedding.themeSettings?.customLabels?.galleryTitle
        || wedding.themeSettings?.customLabels?.gallery_title
        || "កម្រងរូបភាពអនុស្សាវរីយ៍";
    const galleryStyle = getGalleryDisplayStyle(wedding.themeSettings?.galleryStyle);
    const galleryContainerClass = galleryStyle === "slider"
        ? getGalleryContainerClass(galleryStyle)
        : "grid grid-cols-2 gap-3";
    if (photos.length === 0) return null;

    return (
        <section className="py-14 px-4 sm:px-6 bg-white font-kantumruy relative overflow-hidden" style={{ backgroundColor: "var(--emerald-card-surface)" }}>
            <div className="max-w-md mx-auto space-y-6 relative z-10">
                <div className="text-center space-y-1">
                    <span className="text-xl sm:text-2xl font-khmer-moul text-[#1B4332] block">
                        {galleryTitle}
                    </span>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-600 to-transparent mx-auto" />
                </div>

                <div className={galleryContainerClass}>
                    {photos.map((photo, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPhoto(idx)}
                            className={`relative cursor-pointer overflow-hidden ${galleryStyle === "slider"
                                ? "h-56 w-[82%] shrink-0 snap-center rounded-2xl sm:h-72 sm:w-[60%]"
                                : galleryStyle === "polaroid"
                                    ? "aspect-square"
                                    : "aspect-[4/5]"
                            }`}
                        >
                            <PhotoImage
                                src={photo.url}
                                alt={`Photo ${idx + 1}`}
                                className="h-full w-full object-cover"
                                sizes={galleryStyle === "slider"
                                    ? "(max-width: 640px) 82vw, 60vw"
                                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2.5">
                                <span className="text-[11px] text-white font-bold truncate">
                                    អនុស្សាវរីយ៍
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedPhoto !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
                        >
                            <X size={20} />
                        </button>
                        <div 
                            className="max-w-lg w-full max-h-[80vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PhotoImage
                                src={photos[selectedPhoto].url}
                                alt="Enlarged moment"
                                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
