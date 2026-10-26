import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { WeddingData } from '../types';
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { PhotoImage } from "../shared/PhotoImage";
import { OneLineName } from "../shared/OneLineName";

interface HeroSectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ wedding, primaryColor }) => {
    const isEngagement = wedding.eventType === 'anniversary';
    const groomName = wedding.groomName || "កូនកំលោះ";
    const brideName = wedding.brideName || "កូនក្រមុំ";
    const coupleNamesLength = Array.from(`${groomName}${brideName}`).length;
    const coupleNameFontSize = Math.min(37, Math.max(15, 300 / coupleNamesLength));
    const eventDate = useMemo(
        () => wedding.date ? new Date(wedding.date) : new Date(),
        [wedding.date],
    );
    const couplePhoto = getWeddingSectionPhoto(wedding, "cover")?.url;

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const toKhmerNumber = (value: number) => {
        const digits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
        return String(value)
            .split("")
            .map((digit) => digits[Number(digit)] ?? digit)
            .join("");
    };

    useEffect(() => {
        const calculateTime = () => {
            const difference = +eventDate - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };
        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [eventDate]);

    const formatKhmerDate = (date: Date) => {
        const monthsKh = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
        const day = date.getDate();
        const month = monthsKh[date.getMonth()];
        const year = date.getFullYear();
        return `ថ្ងៃ ${day} ខែ ${month} ឆ្នាំ ${year}`;
    };

    return (
        <section className="relative w-full min-h-[730px] overflow-visible bg-transparent">
            <div className="relative z-10 mx-auto flex min-h-[730px] max-w-5xl items-center justify-center px-3 pt-24 pb-32 sm:px-5">
                <div className="w-full max-w-[760px] px-4 sm:px-8">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-4"
                        >
                            <span className="fh-khmer-safe block px-2 font-khmer-moul text-lg text-[#4b5648] sm:text-2xl">
                                {wedding.themeSettings?.customLabels?.invitationTitle || (isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍")}
                            </span>
                            {wedding.themeSettings?.customLabels?.heroSubtitle && (
                                <p className="fh-khmer-safe mt-2 px-2 text-xs leading-relaxed text-[#5c665d] sm:text-sm">
                                    {wedding.themeSettings.customLabels.heroSubtitle}
                                </p>
                            )}
                        </motion.div>

                        {couplePhoto && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7, delay: 0.15 }}
                                className="relative mx-auto mb-5 w-full max-w-[240px] overflow-hidden rounded-[7rem]"
                            >
                                <PhotoImage
                                    src={couplePhoto}
                                    alt={`${groomName} និង ${brideName}`}
                                    className="aspect-[4/5] w-full object-cover"
                                    sizes="240px"
                                    loading="eager"
                                    decoding="async"
                                />
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="mb-4 flex items-center justify-center gap-4 text-[#7a8f65]"
                            style={{ fontFamily: 'serif' }}
                        >
                            <span className="h-px w-10 bg-[#8ea07a]" />
                            <span className="text-[26px] leading-none tracking-[0.2em]">◆</span>
                            <span className="h-px w-10 bg-[#8ea07a]" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="space-y-3"
                        >
                            <h1
                                aria-label={`${groomName} និង ${brideName}`}
                                className="fh-khmer-safe m05-font-name flex w-full flex-nowrap items-center justify-center gap-2 text-[#2d352b] sm:gap-3"
                                style={{ fontSize: `${coupleNameFontSize}px` }}
                            >
                                <OneLineName name={groomName} className="min-w-0 flex-1 text-center" />
                                <Heart aria-hidden="true" className="h-3.5 w-3.5 shrink-0 fill-[#5b6a53] text-[#5b6a53] sm:h-4 sm:w-4" />
                                <OneLineName name={brideName} className="min-w-0 flex-1 text-center" />
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-6"
                        >
                            <p className="fh-khmer-safe font-kantumruy text-base text-[#4d5649] sm:text-lg">
                                {formatKhmerDate(eventDate)}
                            </p>
                            {wedding.themeSettings?.lunarDate && (
                                <p className="fh-khmer-safe mt-2 break-words font-kantumruy text-xs text-[#586551]">
                                    {wedding.themeSettings.lunarDate}
                                </p>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="mx-auto mt-8 grid w-full max-w-[340px] grid-cols-4 gap-2.5"
                        >
                            {[
                                { label: "ថ្ងៃ", value: timeLeft.days },
                                { label: "ម៉ោង", value: timeLeft.hours },
                                { label: "នាទី", value: timeLeft.minutes },
                                { label: "វិនាទី", value: timeLeft.seconds },
                            ].map((item, idx) => (
                                <div key={idx} className="flex min-w-0 flex-col items-center justify-center p-1.5 text-center sm:p-2">
                                    <span className="fh-khmer-safe block whitespace-nowrap font-kantumruy text-xl font-bold leading-tight tracking-[-0.04em] text-[#455444] sm:text-2xl">
                                        {toKhmerNumber(item.value).padStart(2, '០')}
                                    </span>
                                    <span className="fh-khmer-safe mt-1.5 block font-kantumruy text-[11px] text-[#556156]">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
