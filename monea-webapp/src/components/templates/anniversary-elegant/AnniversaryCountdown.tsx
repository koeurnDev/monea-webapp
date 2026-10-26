import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { WeddingData } from '../types';
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { CoupleNamesLine } from "../shared/OneLineName";

export const AnniversaryCountdown = ({ wedding }: { wedding: WeddingData }) => {
    const { date } = wedding;
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isPast: boolean;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

    // Convert to Khmer numbers
    const toKhmerNum = (num: number | string) => {
        const khmerDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
        return String(num).padStart(2, '0').split('').map(d => /\d/.test(d) ? khmerDigits[parseInt(d)] : d).join('');
    };

    useEffect(() => {
        if (!date) return;
        const target = new Date(date).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds, isPast: false });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [date]);

    const countdownPhoto = getWeddingSectionPhoto(wedding, "countdown")?.url
        || (!wedding.previewUploadedImagesOnly ? '/assets/blossom-romance/blossom-arch-bg.jpg' : undefined);

    if (!date) return null;

    const timerCards = [
        { label: 'ថ្ងៃ', val: timeLeft.days },
        { label: 'ម៉ោង', val: timeLeft.hours },
        { label: 'នាទី', val: timeLeft.minutes },
        { label: 'វិនាទី', val: timeLeft.seconds },
    ];

    return (
        <section className="py-16 px-4 bg-gradient-to-b from-[#F1ECE5] to-[#FBF9F5] font-kantumruy text-center">
            <div className="max-w-md mx-auto space-y-6">
                
                {/* Header */}
                <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-khmer-moul text-[#633E42] flex items-center justify-center gap-2">
                        <Clock size={18} className="text-[#966B4E]" />
                        <span>{wedding.themeSettings?.customLabels?.countdownLabel || "រាប់ថយក្រោយ"}</span>
                    </h3>
                </div>

                {/* Pre-wedding Moment Photo Banner */}
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-[16/9] sm:aspect-[2/1] rounded-3xl overflow-hidden shadow-md border-2 border-white bg-slate-100 group"
                >
                    {countdownPhoto && (
                        <img
                            src={countdownPhoto}
                            alt="Countdown Couple Moment"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 text-white text-left font-serif italic text-xs sm:text-sm drop-shadow-md">
                        <CoupleNamesLine groom={wedding.groomName} bride={wedding.brideName} className="text-left" />
                    </div>
                </m.div>

                {/* 4 Countdown Timer Boxes */}
                <div className="grid grid-cols-4 items-stretch gap-2 sm:gap-3">
                    {timerCards.map((card, idx) => (
                        <m.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.08 }}
                            className="min-w-0 overflow-hidden rounded-2xl border border-[#D9C6AA] bg-gradient-to-b from-white to-[#F0E3D1] p-2 text-center shadow-md sm:p-3.5"
                        >
                            <span className="block whitespace-nowrap font-kantumruy text-lg font-black leading-tight tabular-nums tracking-tight text-[#633E42] sm:text-2xl">
                                {toKhmerNum(card.val)}
                            </span>
                            <span className="block whitespace-nowrap text-[10px] font-bold leading-tight text-[#966B4E] sm:text-xs">
                                {card.label}
                            </span>
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
