import * as React from 'react';
import { m } from 'framer-motion';
import { WeddingData } from '../types';
import { RevealSection } from '../shared/CinematicComponents';
import { getGalleryCardClass, getGalleryContainerClass, getGalleryDisplayStyle, getGalleryImageClass } from "../shared/gallery-layout";

interface DynamicGalleryProps {
    wedding: WeddingData;
    galleryImages: string[];
    dynamicPool: string[];
    preWeddingPan1: any;
    preWeddingPan2: any;
    preWeddingPan3: any;
    preWeddingPan4: any;
    preWeddingPan5: any;
    preWeddingPan6: any;
}

export function DynamicGallery({ 
    wedding, 
    galleryImages = [],
    dynamicPool = [],
    preWeddingPan1,
    preWeddingPan2,
    preWeddingPan3,
    preWeddingPan4,
    preWeddingPan5,
    preWeddingPan6
}: DynamicGalleryProps) {
    const pans = [preWeddingPan1, preWeddingPan2, preWeddingPan3, preWeddingPan4, preWeddingPan5, preWeddingPan6];
    
    // Aggregate all unique images
    const allRawImages = [...(galleryImages || []), ...(dynamicPool || [])];
    let images = Array.from(new Set(allRawImages.filter(Boolean)));
    if (images.length === 0) return null;

    // Group into alternating 2-image pairs
    const imagePairs: { left: string; right?: string; leftIdx: number; rightIdx?: number }[] = [];
    for (let i = 0; i < images.length; i += 2) {
        imagePairs.push({
            left: images[i],
            right: images[i + 1] || undefined,
            leftIdx: i,
            rightIdx: images[i + 1] ? i + 1 : undefined,
        });
    }

    const titleText = wedding.themeSettings?.customLabels?.galleryTitle
        || wedding.themeSettings?.customLabels?.gallery_title
        || "វិចិត្រសាល";
    const galleryStyle = getGalleryDisplayStyle(wedding.themeSettings?.galleryStyle);

    return (
        <section id="gallery-sections" className="relative overflow-hidden bg-white px-3 py-10 font-kantumruy">
            {/* Background subtle luxury watermark */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] md:w-[1000px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.04)_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 mx-auto w-full max-w-sm space-y-6">
                {/* Section Title */}
                <RevealSection>
                    <div className="text-center space-y-2 mb-6 sm:mb-8">
                        <h2 className="py-1 font-khmer-moul text-2xl leading-relaxed tracking-wide text-gold-gradient text-gold-embossed">
                            {titleText}
                        </h2>
                        <div className="w-16 md:w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mx-auto" />
                    </div>
                </RevealSection>

                {galleryStyle === "masonry" ? (
                <div className="space-y-3">
                    {imagePairs.map((pair, pairIdx) => {
                        const isEven = pairIdx % 2 === 0;

                        // Single trailing image if odd count
                        if (!pair.right) {
                            return (
                                <RevealSection key={pairIdx} delay={0.1}>
                                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl group">
                                        <img 
                                            src={pair.left} 
                                            className={`w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105 ${pans[pair.leftIdx % pans.length]?.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                            style={{
                                                objectPosition: `${pans[pair.leftIdx % pans.length]?.localX} ${pans[pair.leftIdx % pans.length]?.localY}`,
                                                userSelect: 'none',
                                                touchAction: 'none'
                                            }}
                                            onMouseDown={pans[pair.leftIdx % pans.length]?.onStart}
                                            onTouchStart={pans[pair.leftIdx % pans.length]?.onStart}
                                            draggable={false}
                                            alt={`Gallery ${pair.leftIdx}`}
                                        />
                                    </div>
                                </RevealSection>
                            );
                        }

                        return (
                            <RevealSection key={pairIdx} delay={0.06 * (pairIdx % 4)}>
                                <div className="grid grid-cols-2 items-center gap-2.5">
                                    {isEven ? (
                                        <>
                                            {/* Left photo */}
                                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl group">
                                                <img 
                                                    src={pair.left} 
                                                    className={`w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105 ${pans[pair.leftIdx % pans.length]?.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                                    style={{
                                                        objectPosition: `${pans[pair.leftIdx % pans.length]?.localX} ${pans[pair.leftIdx % pans.length]?.localY}`,
                                                        userSelect: 'none',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={pans[pair.leftIdx % pans.length]?.onStart}
                                                    onTouchStart={pans[pair.leftIdx % pans.length]?.onStart}
                                                    draggable={false}
                                                    alt={`Gallery ${pair.leftIdx}`}
                                                />
                                            </div>

                                            {/* Right photo */}
                                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl group">
                                                <img 
                                                    src={pair.right} 
                                                    className={`w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105 ${pans[pair.rightIdx! % pans.length]?.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                                    style={{
                                                        objectPosition: `${pans[pair.rightIdx! % pans.length]?.localX} ${pans[pair.rightIdx! % pans.length]?.localY}`,
                                                        userSelect: 'none',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={pans[pair.rightIdx! % pans.length]?.onStart}
                                                    onTouchStart={pans[pair.rightIdx! % pans.length]?.onStart}
                                                    draggable={false}
                                                    alt={`Gallery ${pair.rightIdx}`}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Left photo */}
                                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl group">
                                                <img 
                                                    src={pair.left} 
                                                    className={`w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105 ${pans[pair.leftIdx % pans.length]?.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                                    style={{
                                                        objectPosition: `${pans[pair.leftIdx % pans.length]?.localX} ${pans[pair.leftIdx % pans.length]?.localY}`,
                                                        userSelect: 'none',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={pans[pair.leftIdx % pans.length]?.onStart}
                                                    onTouchStart={pans[pair.leftIdx % pans.length]?.onStart}
                                                    draggable={false}
                                                    alt={`Gallery ${pair.leftIdx}`}
                                                />
                                            </div>

                                            {/* Right: Portrait 5/12 */}
                                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl group">
                                                <img 
                                                    src={pair.right} 
                                                    className={`w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105 ${pans[pair.rightIdx! % pans.length]?.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                                    style={{
                                                        objectPosition: `${pans[pair.rightIdx! % pans.length]?.localX} ${pans[pair.rightIdx! % pans.length]?.localY}`,
                                                        userSelect: 'none',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={pans[pair.rightIdx! % pans.length]?.onStart}
                                                    onTouchStart={pans[pair.rightIdx! % pans.length]?.onStart}
                                                    draggable={false}
                                                    alt={`Gallery ${pair.rightIdx}`}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </RevealSection>
                        );
                    })}
                </div>
                ) : (
                    <div className={getGalleryContainerClass(galleryStyle)}>
                        {images.map((image, index) => {
                            const pan = pans[index % pans.length];
                            return (
                                <div
                                    key={`${image}-${index}`}
                                    className={`relative overflow-hidden rounded-2xl ${galleryStyle === "polaroid" ? "aspect-square" : getGalleryCardClass(galleryStyle, index)}`}
                                >
                                    <img
                                        src={image}
                                        alt={`Gallery ${index + 1}`}
                                        className={`${galleryStyle === "polaroid" ? "h-full w-full object-cover" : getGalleryImageClass(galleryStyle)} cursor-grab`}
                                        style={{
                                            objectPosition: `${pan?.localX} ${pan?.localY}`,
                                            userSelect: "none",
                                            touchAction: "none",
                                        }}
                                        onMouseDown={pan?.onStart}
                                        onTouchStart={pan?.onStart}
                                        draggable={false}
                                        loading="lazy"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
