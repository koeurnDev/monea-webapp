import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
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
    const heroImage = getWeddingHeroImage(wedding, '/assets/blossom-romance/blossom-arch-bg.jpg');

    return (
        <AnimatePresence>
            {!revealed && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    onClick={onOpen}
                    className="fixed inset-0 z-[100] flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-black/45 text-center"
                    style={{ isolation: 'isolate' }}
                >
                    <div className="relative flex h-full w-full max-w-[430px] flex-col items-center justify-between overflow-hidden bg-[#2D0A14] px-6 py-10 select-none cursor-pointer md:rounded-3xl md:shadow-2xl">
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
                        <div className="absolute inset-0 bg-gradient-to-b from-[#2D0A14]/60 via-[#2D0A14]/15 to-[#2D0A14]/85" />
                        <div className="absolute inset-4 rounded-[2rem] border border-rose-100/30" aria-hidden="true" />
                    </div>

                    {/* Top: Delicate Title */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 pt-2"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Heart aria-hidden="true" className="h-5 w-5 fill-rose-200/25 text-rose-200" strokeWidth={1.5} />
                            <h1 className="whitespace-nowrap font-khmer-moul text-[clamp(0.75rem,4.2vw,1.125rem)] text-rose-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                {isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍"}
                            </h1>
                            <span className="font-playfair text-[9px] uppercase tracking-[0.28em] text-rose-100/75">Rose Garden</span>
                        </div>
                    </motion.div>

                    {/* Middle: Open for couple photo */}
                    <div className="flex-1" />

                    {/* Bottom: Names + Clean Guest Pill + Sleek Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-sm space-y-4 pb-2"
                    >
                        <div className="rounded-[1.75rem] border border-rose-100/35 bg-[#2D0A14]/35 px-4 py-5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                            <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
                                <span className="h-px w-9 bg-rose-100/45" />
                                <Heart className="h-4 w-4 fill-rose-200/35 text-rose-200" strokeWidth={1.5} />
                                <span className="h-px w-9 bg-rose-100/45" />
                            </div>
                            <div className="space-y-1">
                                <OneLineName name={groomName} className="m05-font-name font-khmer-moul text-2xl text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] sm:text-3xl" />
                                <p className="font-playfair text-sm text-rose-200">&</p>
                                <OneLineName name={brideName} className="m05-font-name font-khmer-moul text-2xl text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] sm:text-3xl" />
                            </div>
                        </div>

                        {/* Clean One-Line Guest Pill */}
                        <div className="px-2 py-2 text-xs font-kantumruy text-white/95 drop-shadow-md sm:text-sm">
                            <span className="text-rose-200/80 mr-1.5 font-light">សូមគោរពអញ្ជើញ៖</span>
                            <span className="font-bold text-white">{guestName || "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី"}</span>
                        </div>

                        {/* Ultra Clean Sleek Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                            }}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-100/50 bg-rose-700/90 px-6 py-3.5 font-kantumruy text-sm font-bold text-white shadow-[0_8px_24px_rgba(45,10,20,0.28)] transition-colors hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D0A14] active:scale-[0.98]"
                        >
                            <Heart aria-hidden="true" className="h-4 w-4 fill-white/20" />
                            <span>សូមចុចបើកធៀប</span>
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </button>

                        <p className="text-[10px] text-rose-200/70 font-kantumruy tracking-wider">
                            (ចុចត្រង់ណាក៏បាន ឬ អូសឡើងលើដើម្បីបើក)
                        </p>
                    </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
