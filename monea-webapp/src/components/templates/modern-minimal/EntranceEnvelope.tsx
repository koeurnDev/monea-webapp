import React, { useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { WeddingData } from "../types";
import { getWeddingHeroImage } from "../shared/weddingPhotos";
import { OneLineName } from "../shared/OneLineName";

interface EntranceEnvelopeProps {
    wedding: WeddingData;
    guestName?: string;
    onReveal: () => void;
    onStartOpen?: () => void;
    audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const EntranceEnvelope = ({ wedding, guestName, onReveal, onStartOpen, audioRef }: EntranceEnvelopeProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exitMotion, setExitMotion] = useState({ bySwipe: false, width: 0, velocity: 0 });
    const sliderRef = useRef<HTMLDivElement>(null);
    const suppressSliderClick = useRef(false);
    const displayedGuestName = (guestName || wedding.guestName)?.trim() || "ភ្ញៀវកិត្តិយស";
    const heroImage = getWeddingHeroImage(wedding, '/images/bg_tunnel.webp');
    const isEngagement = wedding.eventType === 'anniversary';

    const handleOpen = (swipeMotion?: { width: number; velocity: number }) => {
        setExitMotion({
            bySwipe: Boolean(swipeMotion),
            width: swipeMotion?.width || 0,
            velocity: swipeMotion?.velocity || 0,
        });
        if (audioRef?.current && wedding.themeSettings?.musicUrl) {
            audioRef.current.play().catch((err) => {
                console.log("Autoplay blocked:", err);
            });
        }
        if (onStartOpen) {
            onStartOpen();
        }
        setIsOpen(true);
        setTimeout(() => {
            onReveal();
        }, 800);
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
        const sliderWidth = sliderRef.current?.getBoundingClientRect().width || 0;
        const passedDistance = info.offset.x >= Math.max(52, (sliderWidth - 60) * 0.62);
        const fastSwipe = info.offset.x >= 36 && info.velocity.x >= 520;
        if (passedDistance || fastSwipe) {
            handleOpen({
                width: window.innerWidth,
                velocity: info.velocity.x,
            });
        }
        window.setTimeout(() => {
            suppressSliderClick.current = false;
        }, 250);
    };

    return (
        <AnimatePresence custom={exitMotion}>
            {!isOpen && (
                <m.div
                    key="envelope"
                    initial={{ opacity: 1 }}
                    variants={{
                        exit: (motion: typeof exitMotion) => motion.bySwipe
                            ? {
                                x: motion.width,
                                transition: {
                                    type: "spring",
                                    stiffness: 170,
                                    damping: 28,
                                    mass: 0.85,
                                    velocity: motion.velocity,
                                },
                            }
                            : {
                                opacity: 0,
                                y: -8,
                                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                            },
                    }}
                    exit="exit"
                    className="fixed inset-0 z-[100] flex touch-pan-y select-none flex-col items-center justify-between overflow-hidden bg-[#0A0D14] p-6 py-10 text-center"
                    style={{
                        isolation: 'isolate',
                        paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
                        paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
                    }}
                >
                    {/* Full-bleed Pre-Wedding Photo Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        {heroImage && <img
                            src={heroImage}
                            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.98] transition-transform duration-1000"
                            style={{ objectPosition: 'center 20%' }}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            alt="Pre-wedding Cover"
                        />}
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#08090c]/65 via-[#08090c]/30 to-[#08090c]/70" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_100%)]" />
                    </div>
                    
                    {/* Top: Minimalist Header */}
                    <m.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 pt-2"
                    >
                        <h1 className="font-kantumruy font-bold text-base sm:text-lg text-[#f3d68a] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wider">
                            {wedding.themeSettings?.customLabels?.invitationTitle || (isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍")}
                        </h1>
                    </m.div>

                    {/* Middle: Open for couple photo */}
                    <div className="flex-1" />

                    {/* Bottom: Names + Clean Guest Pill + Sleek Button */}
                    <m.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-xs space-y-4 pb-2"
                    >
                        <div className="flex max-w-full flex-col items-center gap-1.5 text-[#f3d68a] drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]">
                            <OneLineName name={wedding.groomName} className="m05-font-name m02-cover-name font-suwannaphum text-2xl sm:text-3xl" />
                            <Heart size={16} className="fill-rose-200 text-rose-200" aria-hidden="true" />
                            <OneLineName name={wedding.brideName} className="m05-font-name m02-cover-name font-suwannaphum text-2xl sm:text-3xl" />
                        </div>

                        <div className="flex flex-col items-center gap-0.5 font-kantumruy text-xs text-[#f3d68a] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:text-sm">
                            <span className="font-light text-[#f3d68a]/80">សូមគោរពអញ្ជើញ</span>
                            <span className="font-bold text-[#ffe8ad]">{displayedGuestName}</span>
                        </div>
                            
                        {/* Invitation entry button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (suppressSliderClick.current) {
                                    e.preventDefault();
                                    return;
                                }
                                handleOpen();
                            }}
                            className="relative flex min-h-14 w-full items-center justify-start rounded-full border border-[#f3d68a]/80 bg-gradient-to-b from-[#fffdf7] to-[#f1e2bc] py-3 pl-16 pr-3 font-kantumruy text-xs font-bold text-[#624b20] shadow-[0_8px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-200 hover:from-white hover:to-[#f6e8c6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d68a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17130c] active:scale-[0.98]"
                        >
                            <span className="min-w-0 flex-1 text-center leading-relaxed">
                                {wedding.themeSettings?.customLabels?.heroButton || "អូសទៅស្តាំដើម្បីបើក"}
                            </span>
                            <div ref={sliderRef} className="absolute inset-0 overflow-hidden rounded-full">
                                <m.span
                                    aria-hidden="true"
                                    drag="x"
                                    dragConstraints={sliderRef}
                                    dragElastic={0.08}
                                    dragMomentum={false}
                                    dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
                                    onDragStart={() => {
                                        suppressSliderClick.current = true;
                                    }}
                                    onDragEnd={handleDragEnd}
                                    className="absolute left-1 top-1 flex h-12 w-12 cursor-grab touch-pan-y items-center justify-center rounded-full bg-[#765817] text-[#fff8e8] shadow-md active:cursor-grabbing"
                                >
                                    <ArrowRight size={18} />
                                </m.span>
                            </div>
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[10px] font-kantumruy tracking-wider text-[#f3d68a]/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                            <span>ចាប់រង្វង់ខាងឆ្វេង ហើយអូសទៅស្តាំ</span>
                            <m.span
                                aria-hidden="true"
                                animate={{ x: [0, 7, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ArrowRight size={13} />
                            </m.span>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
};
