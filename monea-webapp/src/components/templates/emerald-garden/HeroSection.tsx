import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { WeddingData } from '../types';
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { PhotoImage } from "../shared/PhotoImage";
import { OneLineName } from "../shared/OneLineName";

interface HeroSectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ wedding }) => {
    const isEngagement = wedding.eventType === 'anniversary';
    const groomName = wedding.groomName || "កូនកំលោះ";
    const brideName = wedding.brideName || "កូនក្រមុំ";
    const eventDate = wedding.date ? new Date(wedding.date) : new Date();
    const couplePhoto = getWeddingSectionPhoto(wedding, "cover")?.url;

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

    const formatKhmerDate = (date: Date) => {
        const monthsKh = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
        const day = date.getDate();
        const month = monthsKh[date.getMonth()];
        const year = date.getFullYear();
        return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
    };

    return (
        <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#f4f6ef] px-5 py-12 text-center" style={{ backgroundColor: "var(--emerald-card-surface)" }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(104,130,93,.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,.5),transparent_48%,rgba(104,130,93,.06))]" />

            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-2"
                >
                    <span className="block font-khmer-moul text-base leading-relaxed text-[#1B4332] sm:text-xl">
                        {wedding.themeSettings?.customLabels?.invitationTitle || (isEngagement ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍")}
                    </span>
                    {wedding.themeSettings?.customLabels?.heroSubtitle && (
                        <p className="max-w-sm text-xs leading-relaxed text-emerald-900/75 sm:text-sm">
                            {wedding.themeSettings.customLabels.heroSubtitle}
                        </p>
                    )}
                    <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-emerald-700/55 to-transparent" />
                </motion.div>

                {couplePhoto && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="relative w-full max-w-[250px] overflow-hidden rounded-t-[9rem] rounded-b-3xl"
                    >
                        <PhotoImage
                            src={couplePhoto}
                            alt={`${groomName} និង ${brideName}`}
                            className="aspect-[4/4.7] w-full object-cover"
                            sizes="250px"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-full space-y-1"
                >
                    <h1
                        aria-label={`${groomName} និង ${brideName}`}
                        className="font-khmer-moul text-[clamp(1rem,5vw,1.75rem)] leading-[1.8] text-[#173d2d]"
                    >
                        <OneLineName name={groomName} />
                        <span aria-hidden="true" className="my-1 flex items-center justify-center gap-3">
                            <span className="h-px w-8 bg-emerald-700/30" />
                            <Heart size={14} className="fill-emerald-700 text-emerald-700" />
                            <span className="h-px w-8 bg-emerald-700/30" />
                        </span>
                        <OneLineName name={brideName} ariaHidden />
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-1"
                >
                    <p className="font-kantumruy text-sm font-semibold text-slate-800 sm:text-base">
                        {formatKhmerDate(eventDate)}
                    </p>
                    {wedding.themeSettings?.lunarDate && (
                        <p className="text-xs text-emerald-900/80 font-kantumruy">
                            {wedding.themeSettings.lunarDate}
                        </p>
                    )}
                </motion.div>

                {/* Live Countdown Timer */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="grid w-full max-w-xs grid-cols-4 divide-x divide-emerald-900/20 pt-1"
                >
                    {[
                        { label: "ថ្ងៃ", value: timeLeft.days },
                        { label: "ម៉ោង", value: timeLeft.hours },
                        { label: "នាទី", value: timeLeft.minutes },
                        { label: "វិនាទី", value: timeLeft.seconds },
                    ].map((item, idx) => (
                        <div key={idx} className="px-1 py-1.5 text-center">
                            <span className="block font-mono text-lg font-bold text-[#1B4332] sm:text-xl">
                                {item.value < 10 ? `0${item.value}` : item.value}
                            </span>
                            <span className="block font-kantumruy text-[10px] text-slate-600">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
