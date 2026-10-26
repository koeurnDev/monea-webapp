import React from 'react';
import { m } from 'framer-motion';
import { ChevronDown, Heart } from 'lucide-react';
import { WeddingData } from "../types";
import { useImagePan } from '../shared/CinematicComponents';
import { getWeddingHeroImage } from "../shared/weddingPhotos";
import { PhotoImage } from "../shared/PhotoImage";
import { OneLineName } from "../shared/OneLineName";

export const HeroSection = ({ wedding }: { wedding: WeddingData }) => {
    const { groomName, brideName } = wedding;
    const heroImage = getWeddingHeroImage(wedding, "/images/bg_tunnel.webp");
    const isWedding = wedding.eventType === 'wedding';

    const heroPan = useImagePan(
        wedding.themeSettings?.heroImageX || '50%',
        wedding.themeSettings?.heroImagePosition || '50%',
        'heroImageX',
        'heroImagePosition'
    );

    return (
        <section id="hero" className="relative min-h-[92vh] sm:min-h-screen w-full flex flex-col justify-between items-center overflow-hidden bg-[#f7f1ea] text-slate-900 font-kantumruy select-none">
            {/* Full-bleed Pre-wedding Cover Photo with Interactive Pan */}
            <div 
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
                onMouseDown={heroPan.onStart}
                onTouchStart={heroPan.onStart}
                title="អូសដើម្បីតម្រឹមរូប (Drag to adjust)"
            >
                {heroImage && <PhotoImage
                    src={heroImage}
                    alt="Cover" 
                    className="w-full h-full object-cover opacity-90 transform scale-[1.04] transition-transform duration-1000 pointer-events-none"
                    style={{ objectPosition: `${heroPan.localX} ${heroPan.localY}` }}
                    sizes="100vw"
                    loading="eager"
                    fetchPriority="high"
                />}
                
                {/* Soft cream and blue overlay for the M3 look */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#f7f1ea]/75 via-[#f7f1ea]/50 to-[#f7f1ea]/85 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(59,130,246,0.08)_38%,rgba(247,241,234,0.80)_100%)] pointer-events-none" />
            </div>

            {/* Top: Event Subheader */}
            <div
                className="relative z-10 pt-12 sm:pt-14 text-center px-4"
            >
                <div className="inline-flex items-center justify-center">
                    <p className="max-w-full break-words font-khmer-moul text-sm leading-relaxed text-slate-700 sm:text-base">
                        {wedding.themeSettings?.customLabels?.invitationTitle || (isWedding ? "សិរីមង្គលអាពាហ៍ពិពាហ៍" : "សិរីមង្គលពិធីភ្ជាប់ពាក្យ")}
                    </p>
                    {wedding.themeSettings?.customLabels?.heroSubtitle && (
                        <p className="mt-2 max-w-md break-words font-kantumruy text-xs leading-relaxed text-slate-600 sm:text-sm">
                            {wedding.themeSettings.customLabels.heroSubtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Content Area: Couple Names */}
            <div
                className="relative z-10 w-full max-w-lg min-w-0 text-center px-4 pb-10 sm:pb-14 flex flex-col items-center space-y-5 mx-auto"
            >
                <div className="flex max-w-full flex-col items-center gap-2 text-slate-900 drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]">
                    <h1
                        aria-label={`${groomName} និង ${brideName}`}
                        className="m05-font-name w-full min-w-0 max-w-full text-2xl sm:text-4xl"
                    >
                        <OneLineName name={groomName} />
                        <span aria-hidden="true" className="my-2 flex justify-center">
                            <Heart size={18} className="fill-[#9b8055] text-[#9b8055]" />
                        </span>
                        <OneLineName name={brideName} ariaHidden />
                    </h1>
                </div>

                {/* Scroll Indicator */}
                <div className="pt-3 flex flex-col items-center opacity-80 text-slate-700">
                    <ChevronDown size={18} />
                </div>
            </div>
        </section>
    );
};
