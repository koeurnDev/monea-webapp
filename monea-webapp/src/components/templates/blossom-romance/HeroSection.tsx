import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Heart } from 'lucide-react';
import { WeddingData } from '../types';
import { getWeddingHeroImage, getWeddingSectionPhoto } from "../shared/weddingPhotos";
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
    const eventDate = wedding.date ? new Date(wedding.date) : new Date();
    const couplePhoto = getWeddingSectionPhoto(wedding, "cover")?.url
        || getWeddingHeroImage(wedding, "/assets/blossom-romance/blossom-arch-bg.jpg");

    // Countdown State
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const targetDate = wedding.date ? new Date(wedding.date) : new Date();
        const calculateTime = () => {
            const difference = +targetDate - +new Date();
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
    }, [wedding.date]);

    // Format Khmer Date
    const toKhmerDigits = (value: number | string) =>
        String(value).replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]);

    const formatKhmerDate = (date: Date) => {
        const monthsKh = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
        const day = toKhmerDigits(date.getDate());
        const month = monthsKh[date.getMonth()];
        const year = toKhmerDigits(date.getFullYear());
        return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
    };

    return (
        <section className="relative isolate flex min-h-[min(100svh,780px)] w-full flex-col items-center justify-center overflow-hidden bg-[#fbf4f1] px-5 py-8 text-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,190,190,0.28),transparent_48%),radial-gradient(ellipse_at_bottom,rgba(180,83,9,0.08),transparent_44%)]" />
            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-3.5 sm:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-2"
                >
                    <span className="block font-playfair text-[9px] font-medium uppercase tracking-[0.3em] text-[#a66a71]">
                        Rose Garden
                    </span>
                    <h2 className="block font-khmer-moul text-base text-[#5d604e] sm:text-lg">
                        {wedding.themeSettings?.customLabels?.invitationTitle || (isEngagement ? "សិរីសួស្តី ពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍")}
                    </h2>
                    {wedding.themeSettings?.customLabels?.heroSubtitle && (
                        <p className="max-w-sm text-xs leading-relaxed text-[#7a6261] sm:text-sm">
                            {wedding.themeSettings.customLabels.heroSubtitle}
                        </p>
                    )}
                    <div className="mx-auto h-px w-12 bg-gradient-to-r from-transparent via-[#c48b88] to-transparent" />
                </motion.div>

                {couplePhoto && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="relative w-full max-w-[230px] rounded-t-[8rem] rounded-b-[1.5rem] border border-[#c48b88]/45 bg-white p-1.5 shadow-[0_16px_38px_rgba(120,65,65,0.14)]"
                    >
                        <PhotoImage
                            src={couplePhoto}
                            alt={`${groomName} និង ${brideName}`}
                            className="aspect-[4/5] w-full rounded-t-[7.5rem] rounded-b-[1.1rem] object-cover"
                            sizes="230px"
                            loading="eager"
                            decoding="async"
                        />
                        <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-t-[7rem] rounded-b-[0.9rem] border border-white/70" />
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex w-full items-center justify-center gap-3 text-[#a66a71]"
                    aria-hidden="true"
                >
                    <span className="h-px w-8 bg-[#d6b0a5]" />
                    <Heart size={14} className="fill-[#c48b88]/20" />
                    <span className="h-px w-8 bg-[#d6b0a5]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-2"
                >
                    <h1
                        aria-label={`${groomName} និង ${brideName}`}
                        className="m05-font-name font-khmer-moul text-2xl leading-relaxed text-[#3e3b37] sm:text-3xl"
                    >
                        <OneLineName name={groomName} />
                        <span aria-hidden="true" className="my-1 block font-playfair text-base font-normal text-[#a66a71]">&amp;</span>
                        <OneLineName name={brideName} ariaHidden />
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col items-center gap-1"
                >
                    <p className="inline-flex items-center gap-2 font-khmer-moul text-xs font-medium text-[#5d604e] sm:text-sm">
                        <CalendarDays aria-hidden="true" size={14} style={{ color: primaryColor }} />
                        {formatKhmerDate(eventDate)}
                    </p>
                    {wedding.themeSettings?.lunarDate && (
                        <p className="font-khmer-moul text-[10px] text-[#8a7773] sm:text-xs">
                            {wedding.themeSettings.lunarDate}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="grid w-full max-w-[330px] grid-cols-4 divide-x divide-[#ead9d2] rounded-2xl border border-[#ead9d2] bg-white/70 px-2 py-3 shadow-sm"
                >
                    {[
                        { label: "ថ្ងៃ", value: timeLeft.days },
                        { label: "ម៉ោង", value: timeLeft.hours },
                        { label: "នាទី", value: timeLeft.minutes },
                        { label: "វិនាទី", value: timeLeft.seconds },
                    ].map((item, idx) => (
                        <div key={idx} className="min-w-0 text-center">
                            <span className="block font-khmer-moul text-base font-bold tabular-nums leading-none text-[#881337] sm:text-lg">
                                {toKhmerDigits(item.value < 10 ? `0${item.value}` : item.value)}
                            </span>
                            <span className="mt-1 block font-khmer-moul text-[9px] text-[#7a6c67]">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
