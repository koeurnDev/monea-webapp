import React from 'react';
import { m } from 'framer-motion';
import { WeddingData } from "../types";
import { CoupleNamesLine } from "../shared/OneLineName";
import { getWeddingHeroImage, getWeddingPhotoAtSlot } from "../shared/weddingPhotos";

export const ThankYouSection = ({ wedding }: { wedding: WeddingData }) => {
    const imageUrl = getWeddingPhotoAtSlot(wedding, "thankYou")?.url || getWeddingHeroImage(wedding);

    return (
        <section className="relative min-h-[min(82svh,680px)] w-full overflow-hidden flex items-center justify-center bg-slate-950">
            {/* Background Image with Zoom In Transition */}
            {imageUrl ? (
                <m.div
                    initial={{ scale: 1.08, opacity: 0.8 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src={imageUrl}
                        alt=""
                        className="w-full h-full object-cover object-center filter grayscale-[30%] brightness-75"
                    />
                </m.div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#171923] via-slate-950 to-[#332b22]" aria-hidden="true" />
            )}

            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-slate-950/60" />
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-slate-950/80 to-transparent" />

            {/* Content */}
            <m.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="relative z-10 text-center px-5 py-12 sm:px-6 max-w-3xl flex flex-col items-center w-full"
            >
                <div className="w-px h-12 md:h-20 bg-white/30 mb-5 md:mb-6" />
                
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-khmer-moul text-[#D4AF37] leading-tight mb-5 md:mb-6 drop-shadow-md">
                    សូមអំណរគុណ
                </h2>
                
                <p className="m02-thankyou-copy font-suwannaphum text-sm md:text-base text-white/90 font-light max-w-2xl leading-8">
                    យើងខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅបំផុតចំពោះវត្តមានរបស់អ្នកក្នុងពិធីនេះ និងសូមជូនពរឱ្យទទួលបាននូវពុទ្ធពរទាំងបួនប្រការគឺ៖ អាយុ វណ្ណៈ សុខៈ ពលៈ កុំបីឃ្លៀងឃ្លាតឡើយ។
                </p>

                <div className="mt-6 w-full min-w-0 max-w-full border-t border-white/20 pt-5 md:mt-8 md:pt-6">
                    <CoupleNamesLine
                        groom={wedding.groomName}
                        bride={wedding.brideName}
                        className="m05-font-name w-full min-w-0 max-w-full text-xl font-bold text-white md:text-2xl"
                    />
                </div>
            </m.div>
        </section>
    );
};
