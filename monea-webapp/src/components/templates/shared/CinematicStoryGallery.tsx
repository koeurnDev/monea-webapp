import * as React from 'react';
import { m, useScroll, useTransform, useSpring } from 'framer-motion';
import { Camera, Heart, Sparkles, Film } from 'lucide-react';

interface GalleryItem {
    url: string;
    type: string;
}

interface CinematicStoryGalleryProps {
    items?: GalleryItem[];
    labels?: Record<string, string>;
    theme?: 'dark' | 'light';
}

const KenBurnsImage = React.memo(({ src }: { src: string }) => (
    <div className="relative w-full h-full overflow-hidden">
        <m.div
            initial={{ scale: 1 }}
            animate={typeof window !== 'undefined' && window.innerWidth >= 768 ? { scale: 1.1, x: "1%", y: "1%" } : {}}
            transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
            className="w-[102%] h-[102%] relative will-change-transform"
        >
            {src.startsWith('/') ? (
                <img src={src}  className="object-cover" alt=""  />
            ) : (
                <img src={src}  className="object-cover" alt="Statement" sizes="100vw" />
            )}
        </m.div>
        <div className="absolute inset-0 bg-black/20" />
    </div>
));
KenBurnsImage.displayName = 'KenBurnsImage';

const ParallaxImage = React.memo(({ src, speed, className = "" }: { src: string; speed: number; className?: string }) => {
    return (
        <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`relative rounded-2xl overflow-hidden shadow-2xl ${className}`}
        >
            {src.startsWith('/') ? (
                <img src={src} className="object-cover w-full h-full" alt="" loading="lazy" />
            ) : (
                <img src={src} className="object-cover w-full h-full" alt="Gallery" sizes="(max-width: 768px) 50vw, 33vw" loading="lazy" />
            )}
        </m.div>
    );
});
ParallaxImage.displayName = 'ParallaxImage';

const DEFAULT_STORY_IMAGES = [
    "/assets/blossom-romance/blossom-arch-bg.jpg",
];

const CinematicStoryGallery = React.memo(({ items, labels, theme = 'dark' }: CinematicStoryGalleryProps) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const horizontalRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: horizontalRef, offset: ["start end", "end start"] });
    const xMove = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
    const springXMove = useSpring(xMove, { stiffness: 100, damping: 30 });
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Filter for images and ensure we have enough items
    const safeItems = React.useMemo(() => {
        const imageItems = (items || [])
            .filter(i => i?.type === 'IMAGE' && typeof i?.url === 'string' && i.url.trim() !== '')
            .map(i => ({ url: i.url.trim(), type: 'IMAGE' }));

        const sourceList = imageItems.length > 0 
            ? imageItems 
            : DEFAULT_STORY_IMAGES.map(u => ({ url: u, type: 'IMAGE' }));

        const list = [...sourceList];
        let i = 0;
        while (list.length < 24) {
            list.push(sourceList[i % sourceList.length]);
            i++;
        }
        return list.slice(0, 24);
    }, [items]);

    const t = {
        statement: labels?.gallery_statement || "The Statement",
        collection: labels?.gallery_collection || "The Collection",
        intimacy: labels?.gallery_intimacy || "The Intimacy",
        journey: labels?.gallery_journey || "Cinematic Journey",
        collage: labels?.gallery_collage || "The Collage",
        final: labels?.gallery_final || "Forever Begins Now",
        statement_sub: labels?.gallery_statement_sub || "A First Glimpse Into Forever",
        collection_sub: labels?.gallery_collection_sub || "Moments captured in time",
        collage_sub: labels?.gallery_collage_sub || "Small details, big stories",
        final_sub: labels?.gallery_final_sub || "Thank you for being part of our story"
    };

    return (
        <div ref={containerRef} className={`relative ${theme === 'dark' ? 'bg-[#0A0A0A] text-white' : 'bg-white text-slate-900'} transition-colors duration-1000`}>

            {/* Page 1: The Statement */}
            <section className="h-screen relative flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <KenBurnsImage src={safeItems[0].url} />
                </div>
                <div className="relative z-10 text-white text-center px-6">
                    <m.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        <Camera className="mx-auto mb-6 opacity-60" size={48} />
                        <h2 className="font-moul text-4xl md:text-7xl mb-4">{t.statement}</h2>
                        <p className="font-khmer tracking-widest uppercase text-xs opacity-80">{t.statement_sub}</p>

                    </m.div>
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
                    <div className="w-px h-16 bg-white/20 mx-auto" />
                </div>
            </section>

            {/* Page 2: The Collection (Masonry Parallax) */}
            <section className="py-32 px-6 max-w-7xl mx-auto relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
                    <div className="space-y-3 md:space-y-8 pt-4 md:pt-20">
                        <ParallaxImage src={safeItems[1].url} speed={-0.2} className="aspect-[3/4]" />
                        <ParallaxImage src={safeItems[2].url} speed={-0.1} className="aspect-square" />
                    </div>
                    <div className="space-y-3 md:space-y-8">
                        <ParallaxImage src={safeItems[3].url} speed={0.1} className="aspect-square" />
                        <ParallaxImage src={safeItems[4].url} speed={0.2} className="aspect-[3/4]" />
                        <ParallaxImage src={safeItems[5].url} speed={0.05} className="aspect-square" />
                    </div>
                    <div className="space-y-3 md:space-y-8 pt-2 md:pt-12">
                        <ParallaxImage src={safeItems[6].url} speed={-0.15} className="aspect-[4/5]" />
                        <ParallaxImage src={safeItems[7].url} speed={0.1} className="aspect-square" />
                    </div>
                    <div className="space-y-3 md:space-y-8 pt-6 md:pt-32">
                        <ParallaxImage src={safeItems[8].url} speed={0.25} className="aspect-square" />
                        <ParallaxImage src={safeItems[9].url} speed={-0.1} className="aspect-[3/4]" />
                    </div>
                </div>
                <div className="mt-20 text-center">
                    <h3 className="font-moul text-3xl text-slate-400">{t.collection}</h3>
                    <p className="font-khmer tracking-widest uppercase text-xs mt-2">{t.collection_sub}</p>
                </div>
            </section>

            {/* Page 3: The Intimacy (Split Screen) */}
            <section className="h-[40vh] md:h-screen flex flex-row overflow-hidden bg-slate-50 relative">
                <m.div
                    initial={{ x: "-100%" }}
                    whileInView={{ x: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="flex-1 h-full relative grayscale hover:grayscale-0 transition-all duration-1000"
                >
                    {safeItems[5].url.startsWith('/') ? (
                        <img src={safeItems[5].url}  className="object-cover" alt=""  loading="eager" />
                    ) : (
                        <img src={safeItems[5].url}  className="object-cover" alt="Intimacy 1" sizes="50vw" loading="eager" />
                    )}
                    <div className="absolute inset-0 bg-rose-900/10" />
                </m.div>
                <m.div
                    initial={{ x: "100%" }}
                    whileInView={{ x: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="flex-1 h-full relative grayscale hover:grayscale-0 transition-all duration-1000"
                >
                    {safeItems[6].url.startsWith('/') ? (
                        <img src={safeItems[6].url}  className="object-cover" alt=""  loading="eager" />
                    ) : (
                        <img src={safeItems[6].url}  className="object-cover" alt="Intimacy 2" sizes="50vw" loading="eager" />
                    )}
                    <div className="absolute inset-0 bg-rose-900/10" />
                </m.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-white text-center pointer-events-none w-full px-4">
                    <Heart className="mx-auto mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" fill="white" />
                    <h2 className="font-moul text-lg md:text-5xl drop-shadow-lg leading-tight">{t.intimacy}</h2>
                </div>
            </section>

            {/* Page 4: Cinematic Scroll (Horizontal Move) */}
            <section ref={horizontalRef} className="h-[200vh] relative">
                <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
                    <m.div 
                        style={{ x: isMobile ? 0 : springXMove }} 
                        className={`flex gap-4 md:gap-8 px-4 md:px-20 ${isMobile ? 'overflow-x-auto snap-x snap-mandatory no-scrollbar' : 'min-w-[200vw]'} will-change-transform`}
                    >
                        {[safeItems[10], safeItems[11], safeItems[12], safeItems[13]].map((item, i) => (
                            <div key={i} className={`flex-shrink-0 w-[80vw] h-[50vh] sm:w-[60vw] sm:h-[60vh] md:w-[45vw] md:h-[70vh] rounded-3xl overflow-hidden shadow-2xl relative ${isMobile ? 'snap-center' : ''}`}>
                                {item.url.startsWith('/') ? (
                                    <img src={item.url}  className="object-cover" alt=""  loading="lazy" />
                                ) : (
                                    <img src={item.url}  className="object-cover" alt="Journey" sizes="50vw" loading="lazy" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <div className="absolute bottom-8 left-8 text-white">
                                    <span className="text-4xl font-serif italic">0{i + 1}</span>
                                </div>
                            </div>
                        ))}
                    </m.div>
                </div>
                <div className="absolute top-20 left-12 md:left-24 z-10">
                    <h2 className={`font-moul text-4xl md:text-6xl ${theme === 'dark' ? 'text-white/10' : 'text-slate-800/10'} select-none`}>{t.journey}</h2>
                </div>
            </section>

            {/* Page 5: The Collage */}
            <section className="py-32 px-6 bg-slate-900 text-white relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-12 md:grid-rows-6 gap-3 md:gap-4 h-auto md:h-[120vh]">
                        <m.div whileHover={{ scale: 0.98 }} className="col-span-2 md:col-span-8 md:row-span-4 rounded-lg overflow-hidden border border-white/20 p-2 relative aspect-[4/3] md:aspect-auto">
                            {safeItems[14].url.startsWith('/') ? (
                                <img src={safeItems[14].url}  className="object-cover rounded shadow-lg" alt=""  loading="eager" />
                            ) : (
                                <img src={safeItems[14].url}  className="object-cover rounded shadow-lg" alt="Collage 1" sizes="50vw" loading="eager" />
                            )}
                        </m.div>
                        <m.div whileHover={{ scale: 1.02 }} className="col-span-1 md:col-span-4 md:row-span-2 rounded-lg overflow-hidden border border-amber-400/30 p-2 relative aspect-square md:aspect-auto">
                            {safeItems[15].url.startsWith('/') ? (
                                <img src={safeItems[15].url}  className="object-cover rounded shadow-lg" alt=""  loading="eager" />
                            ) : (
                                <img src={safeItems[15].url}  className="object-cover rounded shadow-lg" alt="Collage 2" sizes="25vw" loading="eager" />
                            )}
                        </m.div>
                        <m.div whileHover={{ scale: 1.05 }} className="col-span-1 md:col-span-4 md:row-span-3 rounded-lg overflow-hidden border border-white/20 p-2 relative aspect-square md:aspect-auto">
                            {safeItems[16].url.startsWith('/') ? (
                                <img src={safeItems[16].url}  className="object-cover rounded shadow-lg" alt=""  loading="eager" />
                            ) : (
                                <img src={safeItems[16].url}  className="object-cover rounded shadow-lg" alt="Collage 3" sizes="25vw" loading="eager" />
                            )}
                        </m.div>
                        <m.div whileHover={{ scale: 0.95 }} className="col-span-1 md:col-span-4 md:row-span-2 rounded-lg overflow-hidden border border-white/20 p-2 relative aspect-square md:aspect-auto">
                            {safeItems[17].url.startsWith('/') ? (
                                <img src={safeItems[17].url}  className="object-cover rounded shadow-lg" alt=""  loading="eager" />
                            ) : (
                                <img src={safeItems[17].url}  className="object-cover rounded shadow-lg" alt="Collage 4" sizes="25vw" loading="eager" />
                            )}
                        </m.div>
                        <m.div whileHover={{ scale: 1.02 }} className="col-span-1 md:col-span-4 md:row-span-1 rounded-lg overflow-hidden border border-amber-400/30 p-2 relative aspect-square md:aspect-auto">
                            {safeItems[18].url.startsWith('/') ? (
                                <img src={safeItems[18].url}  className="object-cover rounded shadow-lg" alt=""  />
                            ) : (
                                <img src={safeItems[18].url}  className="object-cover rounded shadow-lg" alt="Collage 5" sizes="25vw" />
                            )}
                        </m.div>
                    </div>
                </div>
                <div className="mt-12 text-center">
                    <Sparkles className="mx-auto text-amber-400 mb-4" />
                    <h2 className="font-moul text-3xl">{t.collage}</h2>
                    <p className={`${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} font-khmer tracking-widest mt-2 uppercase text-xs`}>{t.collage_sub}</p>
                </div>
            </section>

            {/* Page 6: Floating Film */}
            <section className="h-screen bg-white flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-64 md:h-80 flex gap-3 md:gap-12 px-4 md:px-10">
                    {[safeItems[18], safeItems[19], safeItems[2]].map((item, i) => (
                        <m.div
                            key={i}
                            animate={{
                                y: [0, -20, 0, 20, 0],
                                rotate: [0, 2, 0, -2, 0]
                            }}
                            transition={{
                                duration: 5 + i,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                            }}
                            className="flex-1 relative aspect-[3/4] bg-slate-900 border-[12px] md:border-[20px] border-slate-900 shadow-2xl"
                        >
                            {/* Film Sprockets */}
                            <div className="absolute -left-4 top-0 bottom-0 flex flex-col justify-around py-4">
                                {Array(6).fill(0).map((_, j) => <div key={j} className="w-2 h-4 bg-white/10 rounded-sm" />)}
                            </div>
                            <div className="absolute -right-4 top-0 bottom-0 flex flex-col justify-around py-4">
                                {Array(6).fill(0).map((_, j) => <div key={j} className="w-2 h-4 bg-white/10 rounded-sm" />)}
                            </div>
                            {item.url.startsWith('/') ? (
                                <img src={item.url}  className="object-cover brightness-75 sepia-[0.3]" alt=""  />
                            ) : (
                                <img src={item.url}  className="object-cover brightness-75 sepia-[0.3]" alt="Film" sizes="33vw" />
                            )}
                        </m.div>
                    ))}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
                        <Film size={400} />
                    </div>
                </div>
            </section>

            {/* Page 7: Final Frame */}
            <section className="h-screen relative flex items-center justify-center text-center">
                <div className="absolute inset-0 z-0">
                    {safeItems[safeItems.length - 1].url.startsWith('/') ? (
                        <img src={safeItems[safeItems.length - 1].url}  className="object-cover" alt=""  />
                    ) : (
                        <img src={safeItems[safeItems.length - 1].url}  className="object-cover" alt="Final" sizes="100vw" />
                    )}
                    <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="relative z-10 space-y-8 px-6">
                    <m.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <h2 className="font-moul text-4xl md:text-7xl text-white mb-4">{t.final}</h2>
                        <div className="w-32 h-px bg-white/30 mx-auto mb-12" />
                        <p className="font-khmer text-white/60 tracking-widest text-lg uppercase italic max-w-xl mx-auto">
                            {t.final_sub}
                        </p>
                    </m.div>
                </div>
            </section>
        </div>
    );
});

CinematicStoryGallery.displayName = 'CinematicStoryGallery';
export default CinematicStoryGallery;
