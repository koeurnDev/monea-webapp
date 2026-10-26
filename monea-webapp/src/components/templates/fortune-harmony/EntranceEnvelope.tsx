import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeddingData } from '../types';
import { getWeddingHeroImage } from "../shared/weddingPhotos";
import { OneLineName } from "../shared/OneLineName";

interface EntranceEnvelopeProps {
    wedding: WeddingData;
    guestName?: string;
    revealed: boolean;
    onOpen: () => void;
    primaryColor: string;
}

export const EntranceEnvelope: React.FC<EntranceEnvelopeProps> = ({
    wedding,
    guestName,
    revealed,
    onOpen,
    primaryColor
}) => {
    const isEngagement = wedding.eventType === 'anniversary';
    const groomName = wedding.groomName || "កូនកំលោះ";
    const brideName = wedding.brideName || "កូនក្រមុំ";
    const heroImage = getWeddingHeroImage(wedding, '/assets/fortune-harmony/fortune-crimson-bg.jpg');

    return (
        <AnimatePresence>
            {!revealed && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    onClick={onOpen}
                    className="fixed inset-0 z-[100] flex flex-col justify-between items-center p-6 py-10 text-center select-none overflow-hidden bg-[#3B070E] cursor-pointer"
                    style={{ isolation: 'isolate' }}
                >
                    {/* Full-bleed Pre-Wedding Photo Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        {heroImage && (
                            <>
                                <img
                                    src={heroImage}
                                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70"
                                    style={{ objectPosition: 'center 20%' }}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <img
                                    src={heroImage}
                                    className="relative w-full h-full object-cover filter brightness-[0.92] transition-transform duration-1000"
                                    style={{ objectPosition: 'center 20%' }}
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    alt="Pre-wedding Cover"
                                />
                            </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />
                    </div>

                    {/* Top: Delicate Title */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 flex items-center justify-center gap-2 px-2 pt-2"
                    >
                        <span className="shrink-0 text-amber-300 text-xs font-bold font-serif">囍</span>
                        <p className="fh-khmer-safe min-w-0 whitespace-nowrap text-center font-khmer-moul text-[clamp(0.75rem,4.2vw,1.125rem)] text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            {isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍"}
                        </p>
                        <span className="shrink-0 text-amber-300 text-xs font-bold font-serif">囍</span>
                    </motion.div>

                    {/* Middle: Open for couple photo */}
                    <div className="flex-1" />

                    {/* Bottom: Names + Khmer Moul Guest Pill + Imperial Gold Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-xs space-y-4 pb-2"
                    >
                        <div className="w-full border-y border-amber-200/30 py-2">
                            <div
                                aria-label={`${groomName} និង ${brideName}`}
                                className="fh-khmer-safe m05-font-name flex w-full items-center justify-center gap-2 text-[clamp(0.9rem,4.5vw,1.25rem)] text-amber-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] sm:gap-3 sm:text-2xl"
                            >
                                <OneLineName name={groomName} className="min-w-0 flex-1 text-center" />
                                <span aria-hidden="true" className="shrink-0 text-amber-300">♡</span>
                                <OneLineName name={brideName} className="min-w-0 flex-1 text-center" />
                            </div>
                        </div>

                        <div className="px-2 py-2.5 font-khmer-moul text-amber-100">
                            <span className="fh-khmer-safe block text-[10px] text-amber-300/80 sm:text-xs">សូមគោរពអញ្ជើញ</span>
                            <span className="fh-khmer-safe m05-font-name mt-1 block break-words text-xs sm:text-sm">
                                {guestName || "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី"}
                            </span>
                        </div>

                        {/* Imperial Gold Ingot Button in Khmer Moul */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                            }}
                            className="fh-khmer-safe w-full rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 px-6 py-3 text-xs text-[#540913] shadow-[0_4px_25px_rgba(217,119,6,0.45)] transition-all hover:from-amber-200 hover:to-yellow-200 active:scale-95 sm:text-sm"
                        >
                            ✨ សូមចុចបើកធៀប
                        </button>

                        <p className="fh-khmer-safe font-kantumruy text-[10px] text-amber-200/70">
                            (ចុចត្រង់ណាក៏បាន ឬ អូសឡើងលើដើម្បីបើក)
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
