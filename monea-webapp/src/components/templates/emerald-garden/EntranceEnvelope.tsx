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
    const heroImage = getWeddingHeroImage(wedding, '/assets/emerald-garden/emerald-garden-bg.jpg');

    return (
        <AnimatePresence>
            {!revealed && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    onClick={onOpen}
                    className="fixed inset-0 z-[100] flex flex-col justify-between items-center p-6 py-10 text-center select-none overflow-hidden bg-[#071710] cursor-pointer"
                    style={{ isolation: 'isolate' }}
                >
                    {/* Full-bleed Pre-Wedding Photo Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        {heroImage && <img
                            src={heroImage}
                            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.82]"
                            style={{ objectPosition: 'center 20%' }}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            alt="Pre-wedding Cover"
                        />}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#06110c]/55 via-[#071710]/20 to-[#06110c]/80" />
                    </div>

                    {/* Top: Delicate Title */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 pt-2"
                    >
                        <h1 className="font-khmer-moul text-base sm:text-lg text-emerald-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wider">
                            {isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍"}
                        </h1>
                    </motion.div>

                    {/* Middle: Open for couple photo */}
                    <div className="flex-1" />

                    {/* Bottom: Names + Khmer Moul Guest Pill + Emerald Jade Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-sm space-y-4 px-2 pb-6 sm:px-4"
                    >
                        {/* Couple Names in Khmer Moul */}
                        <div className="space-y-1">
                            <OneLineName name={groomName} className="font-khmer-moul text-[clamp(0.875rem,4.5vw,1.5rem)] leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.8)] sm:text-2xl" />
                            <p className="flex items-center justify-center gap-3 text-xs text-emerald-200 font-khmer-moul">
                                <span aria-hidden="true" className="h-px w-8 bg-emerald-200/50" />
                                និង
                                <span aria-hidden="true" className="h-px w-8 bg-emerald-200/50" />
                            </p>
                            <OneLineName name={brideName} className="font-khmer-moul text-[clamp(0.875rem,4.5vw,1.5rem)] leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.8)] sm:text-2xl" />
                        </div>

                        <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />

                        <div className="px-2 py-1 font-khmer-moul text-xs leading-relaxed text-white/95 sm:text-sm">
                            <span className="block text-[10px] text-emerald-200 sm:text-xs">សូមគោរពអញ្ជើញ</span>
                            <span className="mt-1 block">{guestName || "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី"}</span>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                            }}
                            className="w-full rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3.5 font-khmer-moul text-sm text-white shadow-[0_8px_24px_rgba(5,150,105,.24)] transition hover:from-emerald-600 hover:to-teal-600 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071710] sm:py-4"
                        >
                            <span>សូមចុចបើកធៀប</span>
                        </button>

                        <p className="text-[10px] text-emerald-100/75 font-kantumruy">
                            ចុចត្រង់ណាក៏បានដើម្បីបើកធៀប
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
