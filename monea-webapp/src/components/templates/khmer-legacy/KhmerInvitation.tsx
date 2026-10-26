import * as React from "react";
import { WeddingData } from "../types";
import { RevealSection } from '../shared/CinematicComponents';
import { useTranslation } from "@/i18n/LanguageProvider";
import { OneLineName } from "../shared/OneLineName";

export function KhmerInvitation({
    wedding,
    smartColors
}: {
    wedding: WeddingData;
    smartColors: { primary: string; secondary: string; dark: string };
}) {
    const { t } = useTranslation();
    const isAnniversary = wedding.eventType === 'anniversary';

    const groomFather = wedding.themeSettings?.parents?.groomFather ?? wedding.groomFather;
    const groomMother = wedding.themeSettings?.parents?.groomMother ?? wedding.groomMother;
    const brideFather = wedding.themeSettings?.parents?.brideFather ?? wedding.brideFather;
    const brideMother = wedding.themeSettings?.parents?.brideMother ?? wedding.brideMother;

    const toKhmerNum = (num: number | string) => {
        const khmerNumbers = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
        return num.toString().split('').map(digit => {
            const d = parseInt(digit);
            return isNaN(d) ? digit : khmerNumbers[d];
        }).join('');
    };

    const formattedKhmerDate = React.useMemo(() => {
        if (!wedding.date) return "";
        try {
            const d = new Date(wedding.date);
            if (isNaN(d.getTime())) return "";
            const khmerDays = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
            const khmerMonths = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
            
            const dayName = khmerDays[d.getDay()];
            const day = toKhmerNum(d.getDate());
            const month = khmerMonths[d.getMonth()];
            const year = toKhmerNum(d.getFullYear());
            
            return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`;
        } catch {
            return "";
        }
    }, [wedding.date]);

    const titleText = wedding.themeSettings?.customLabels?.invitationTitle || 
                      (isAnniversary ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍");

    const honorText = wedding.themeSettings?.customLabels?.invitationHonorTitle || "មានកិត្តិយសសូមគោរពអញ្ជើញ";

    const bodyText = wedding.themeSettings?.invitationText ||
        wedding.themeSettings?.customLabels?.invitationBody ||
        "ឯកឧត្តម ឧកញ៉ា លោកជំទាវ លោក លោកស្រី អ្នកនាង កញ្ញា និងប្រិយមិត្តអញ្ជើញចូលរួមជាអធិបតីនិងជាភ្ញៀវកិត្តិយសដើម្បីប្រសិទ្ធពរជ័យសិរីសួស្តីជ័យមង្គលក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍ កូនប្រុស / កូនស្រី របស់យើងខ្ញុំ";

    return (
        <section id="invitation-khmer" className="py-12 md:py-20 px-4 sm:px-6 text-center bg-white relative overflow-hidden font-kantumruy w-full max-w-full [container-type:inline-size]">
            {/* Background subtle luxury watermark */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.04)_0%,_transparent_70%)] pointer-events-none" />

            <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 relative z-10">
                <RevealSection>
                    {/* 1. Header Title */}
                    <div className="space-y-3 mb-8 md:mb-12">
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-10 h-[1.5px] bg-gradient-to-r from-transparent to-[#D4AF37]" />
                            <span className="font-kantumruy text-[11px] sm:text-xs text-[#805C00] tracking-wide font-bold">
                                {wedding.themeSettings?.customLabels?.invitationBadge || "សិរីសួស្ដីជ័យមង្គល"}
                            </span>
                            <span className="w-10 h-[1.5px] bg-gradient-to-l from-transparent to-[#D4AF37]" />
                        </div>
                        <h2 className="whitespace-nowrap font-khmer-moul text-[clamp(12px,5cqi,48px)] text-gold-gradient text-gold-embossed tracking-wide leading-tight py-1">
                            {titleText}
                        </h2>
                    </div>

                    {/* 2. Parents of Groom & Bride (Traditional 2-Column Format) */}
                    {(groomFather?.trim() || groomMother?.trim() || brideFather?.trim() || brideMother?.trim()) && (
                    <div className="mx-auto mb-8 grid max-w-2xl grid-cols-2 divide-x divide-[#D4AF37]/25 md:mb-12">
                        {[
                            {
                                title: "មាតាបិតាកូនកំលោះ",
                                father: groomFather,
                                mother: groomMother,
                            },
                            {
                                title: "មាតាបិតាកូនក្រមុំ",
                                father: brideFather,
                                mother: brideMother,
                            },
                        ].map(({ title, father, mother }) => (
                            <div key={title} className="min-w-0 px-2 py-2 text-center sm:px-3 sm:py-3">
                                <h3 className="font-khmer-moul text-[11px] leading-[1.9] text-[#9b7844] sm:text-sm">
                                    {title}
                                </h3>
                                <div className="mt-2 space-y-1">
                                    {father?.trim() && (
                                        <p className="break-words font-kantumruy text-[10px] leading-[1.9] text-slate-700 [overflow-wrap:anywhere] sm:text-sm">
                                            <span className="text-[#805C00]/75">លោក </span>
                                            <span className="font-semibold">{father.trim()}</span>
                                        </p>
                                    )}
                                    {mother?.trim() && (
                                        <p className="break-words font-kantumruy text-[10px] leading-[1.9] text-slate-700 [overflow-wrap:anywhere] sm:text-sm">
                                            <span className="text-[#805C00]/75">លោកស្រី </span>
                                            <span className="font-semibold">{mother.trim()}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    )}

                    {/* 3. Honorific Greeting & Invitation Text */}
                    <div className="space-y-4 max-w-2xl mx-auto my-8 md:my-12">
                        <h3 className="font-khmer-moul text-sm sm:text-base md:text-xl text-gold-gradient text-gold-embossed leading-relaxed">
                            {honorText}
                        </h3>
                        <p className="font-kantumruy text-xs sm:text-sm md:text-base leading-[2.2] sm:leading-[2.6] text-slate-700 font-medium px-2 sm:px-6">
                            {bodyText}
                        </p>
                    </div>

                    {/* 4. Couple Official Names (កូនប្រុសនាម ... ជាគូនឹង ... កូនស្រីនាម) */}
                    {wedding.themeSettings?.customMonogramUrl ? (
                        <div className="flex justify-center items-center max-w-2xl mx-auto py-8 my-4 border-y border-[#D4AF37]/25">
                            <img 
                                src={wedding.themeSettings.customMonogramUrl} 
                                alt={`${wedding.groomName} and ${wedding.brideName}`} 
                                className="h-16 sm:h-20 md:h-24 w-auto object-contain"
                                style={{ 
                                    transform: `scale(${(wedding.themeSettings.customMonogramScale || 100) / 100}) translateY(${wedding.themeSettings.customMonogramY || 0}px)`,
                                    filter: `drop-shadow(${wedding.themeSettings.customMonogramDropShadow || '0px 2px 4px rgba(0,0,0,0.5)'})` 
                                }}
                            />
                        </div>
                    ) : (
                        <div className="mx-auto my-4 grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[1cqi] border-y border-[#D4AF37]/25 py-6">
                        {/* Groom */}
                        <div className="flex min-w-0 flex-col items-center space-y-1 text-center">
                            <span className="whitespace-nowrap font-kantumruy text-[clamp(8px,2.5cqi,12px)] font-bold text-[#805C00]">
                                កូនប្រុសនាម
                            </span>
                            <h3 className="w-full font-khmer-moul text-[clamp(9px,3.1cqi,20px)] leading-snug tracking-wide text-gold-gradient text-gold-embossed">
                                <OneLineName name={wedding.groomName} />
                            </h3>
                        </div>

                        {/* Center Bridge */}
                        <div className="flex flex-col items-center justify-center">
                            <span className="whitespace-nowrap font-khmer-moul text-[clamp(8px,2.8cqi,15px)] text-gold-gradient text-gold-embossed">
                                ជាគូនឹង
                            </span>
                        </div>

                        {/* Bride */}
                        <div className="flex min-w-0 flex-col items-center space-y-1 text-center">
                            <span className="whitespace-nowrap font-kantumruy text-[clamp(8px,2.5cqi,12px)] font-bold text-[#805C00]">
                                កូនស្រីនាម
                            </span>
                            <h3 className="w-full font-khmer-moul text-[clamp(9px,3.1cqi,20px)] leading-snug tracking-wide text-gold-gradient text-gold-embossed">
                                <OneLineName name={wedding.brideName} />
                            </h3>
                        </div>
                    </div>
                )}

                    {/* 5. Reception Details (ដែលនឹងពិសាភោជនាហារនៅ...) */}
                    <div className="space-y-3 pt-6 max-w-2xl mx-auto">
                        <h4 className="font-khmer-moul text-xs sm:text-sm md:text-base text-gold-gradient text-gold-embossed leading-relaxed">
                            {wedding.themeSettings?.customLabels?.receptionTitle || "ដែលនឹងពិសាភោជនាហារនៅ"}
                        </h4>
                        
                        <div className="space-y-1.5 font-kantumruy text-xs sm:text-sm md:text-base text-slate-700 leading-[2.2] sm:leading-[2.5] font-normal px-2">
                            {wedding.themeSettings?.lunarDate && (
                                <p className="text-[#805C00] font-medium">
                                    {wedding.themeSettings.lunarDate} ត្រូវនឹង
                                </p>
                            )}
                            <p className="break-words whitespace-normal leading-relaxed">
                                {formattedKhmerDate}<br />
                                {wedding.time ? `វេលាម៉ោង ${wedding.time}` : "វេលាម៉ោង ៤:០០ រសៀល"} ស្ថិតនៅ
                            </p>
                            <p className="font-medium text-slate-800">
                                {wedding.location || "គេហដ្ឋានខាងស្រី"} {wedding.themeSettings?.customLabels?.receptionClosing || "ដោយមេត្រីភាព។"}
                            </p>
                        </div>

                        {/* 6. Closing (សូមអរគុណ!) */}
                        <div className="pt-4">
                            <p className="font-khmer-moul text-xs sm:text-sm text-gold-gradient text-gold-embossed tracking-wide">
                                {wedding.themeSettings?.customLabels?.invitationThankYou || "សូមអរគុណ!"}
                            </p>
                        </div>
                    </div>
                </RevealSection>
            </div>
        </section>
    );
}
