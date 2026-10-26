import React from 'react';
import { m } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import type { WeddingData } from '../types';
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { CoupleNamesLine } from "../shared/OneLineName";
import { MoneaFooterBrand } from "../shared/MoneaFooterBrand";
import { SocialLinksSection } from "../shared/SocialLinksSection";

export const AnniversaryThankYou = ({ wedding }: { wedding: WeddingData }) => {
    const thankYouPhoto = getWeddingSectionPhoto(wedding, "thankYou")?.url;

    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#24191B] via-[#3A2527] to-[#1B1415] text-white py-16 sm:py-20 px-4 text-center font-kantumruy">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-300/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto space-y-6 flex flex-col items-center">
                
                {/* Top Icon Badge */}
                <m.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-lg"
                >
                    <Heart className="w-5 h-5 fill-amber-300" />
                </m.div>

                {/* Section Title */}
                <div className="space-y-1.5">
                    <h2 className="text-2xl sm:text-3xl font-khmer-moul text-amber-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tracking-wide">
                        សូមថ្លែងអំណរគុណ
                    </h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto" />
                </div>

                {/* Clear, Beautiful Couple Keepsake Portrait without Text Overlay */}
                {thankYouPhoto && <m.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative w-64 sm:w-72 aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.6)] border border-[#E7C783]/60 p-1 bg-gradient-to-b from-[#E7C783]/30 via-rose-300/15 to-transparent group"
                >
                    <div className="w-full h-full rounded-[22px] overflow-hidden relative bg-slate-900">
                        <img
                            src={thankYouPhoto}
                            alt="Couple Thank You"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </m.div>}

                {/* Heartfelt Thank You Body Text */}
                <m.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-md mx-auto drop-shadow-md pt-2 px-2"
                >
                    យើងខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅបំផុត ចំពោះវត្តមាន ការអញ្ជើញចូលរួម និងពាក្យជូនពរដ៏មានតម្លៃរបស់ <strong>ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា</strong> ព្រមទាំងប្រិយមិត្តជិតឆ្ងាយទាំងអស់ ដែលបានញ៉ាំងឱ្យពិធីមង្គលនេះកាន់តែមានភាពអធិកអធម និងពោរពេញដោយក្តីសោមនស្សរីករាយ។
                </m.p>

                {/* Couple Official Names */}
                <div className="pt-2">
                    <p className="font-khmer-moul text-sm sm:text-base text-amber-300 drop-shadow-md flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-amber-400" />
                        <CoupleNamesLine groom={wedding.groomName} bride={wedding.brideName} />
                        <Sparkles size={14} className="text-amber-400" />
                    </p>
                </div>

                <SocialLinksSection wedding={wedding} />
                <MoneaFooterBrand className="rounded-2xl bg-[#f7f1ea] px-4 py-2" />
            </div>
        </section>
    );
};
