import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeddingData } from '../types';
import { getWeddingPhotos } from "../shared/weddingPhotos";
import { getGalleryCardClass, getGalleryContainerClass, getGalleryDisplayStyle, getGalleryImageClass } from "../shared/gallery-layout";
import { PhotoImage } from "../shared/PhotoImage";

export default function AnniversaryGallery({ wedding }: { wedding: WeddingData }) {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const validItems = getWeddingPhotos(wedding);
    
    const settings = wedding.themeSettings as any;
    const title = settings?.customLabels?.galleryTitle || settings?.customLabels?.gallery_title || "វិចិត្រសាល";
    const galleryStyle = getGalleryDisplayStyle(settings?.galleryStyle);

    const openLightbox = (idx: number) => setSelectedIdx(idx);
    const closeLightbox = () => setSelectedIdx(null);

    if (validItems.length === 0) return null;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIdx === null) return;
        setSelectedIdx((selectedIdx + 1) % validItems.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIdx === null) return;
        setSelectedIdx((selectedIdx - 1 + validItems.length) % validItems.length);
    };

    return (
        <section className="py-16 px-4 bg-[#F1ECE5] font-kantumruy relative overflow-hidden" id="gallery">
            <div className="max-w-xl mx-auto space-y-8">
                
                {/* Section Header */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#F0E3D1] flex items-center justify-center text-[#966B4E] mb-1 shadow-sm">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-khmer-moul text-[#633E42] leading-relaxed">
                        {title}
                    </h2>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#CBAF78] to-transparent mx-auto mt-1" />
                </div>

                {/* 2-Column Responsive Masonry Collage */}
                <div className={getGalleryContainerClass(galleryStyle)}>
                    {validItems.map((item, idx) => (
                        <m.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.06 }}
                            onClick={() => openLightbox(idx)}
                            className={`relative rounded-2xl overflow-hidden shadow-sm cursor-pointer group border border-white hover:border-[#CBAF78] transition-all ${getGalleryCardClass(galleryStyle, idx)}`}
                        >
                            <PhotoImage
                                src={item.url}
                                alt={`Gallery item ${idx + 1}`}
                                className={`${getGalleryImageClass(galleryStyle)} transform group-hover:scale-105 transition-transform duration-500`}
                                sizes={galleryStyle === "slider"
                                    ? "(max-width: 640px) 82vw, 60vw"
                                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"}
                                loading="lazy"
                            />
                        </m.div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedIdx !== null && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                        >
                            <X size={24} />
                        </button>

                        {/* Navigation Previous */}
                        {validItems.length > 1 && (
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                            >
                                <ChevronLeft size={28} />
                            </button>
                        )}

                        {/* Navigation Next */}
                        {validItems.length > 1 && (
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                            >
                                <ChevronRight size={28} />
                            </button>
                        )}

                        {/* Active Image */}
                        <m.div
                            key={selectedIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-lg max-h-[80vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PhotoImage
                                src={validItems[selectedIdx].url}
                                alt={`Gallery expanded ${selectedIdx + 1}`}
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
