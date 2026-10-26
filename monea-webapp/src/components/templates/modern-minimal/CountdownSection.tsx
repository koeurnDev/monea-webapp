import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { km } from 'date-fns/locale';
import { WeddingData } from "../types";
import { useTranslation } from "@/i18n/LanguageProvider";

export const CountdownSection = ({ wedding }: { wedding: WeddingData }) => {
    const { locale } = useTranslation();
    const isKhmer = locale === "km";
    const isEngagement = wedding.eventType === "anniversary";
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const eventDate = new Date(wedding.date);
    const hasValidEventDate = isValid(eventDate);

    useEffect(() => {
        if (!hasValidEventDate) return;

        const target = new Date(wedding.date).getTime();
        const update = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, target - now);
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [hasValidEventDate, wedding.date]);

    const formattedEventDate = hasValidEventDate
        ? format(eventDate, "EEEE 'ទី' d 'ខែ' MMMM 'ឆ្នាំ' yyyy", { locale: km })
            .replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)])
        : "";
    const countdownUnits = isKhmer
        ? ["ថ្ងៃ", "ម៉ោង", "នាទី", "វិនាទី"]
        : ["Days", "Hours", "Minutes", "Seconds"];

    return (
        <section className="flex flex-col items-center justify-center border-y border-slate-100 bg-slate-50 px-4 py-12 sm:px-6 sm:py-20">
            <h2 className="mb-8 max-w-full whitespace-nowrap text-center font-khmer-moul text-[clamp(0.65rem,3.8vw,1.5rem)] leading-relaxed text-[#77613a] sm:mb-10">
                {wedding.themeSettings?.customLabels?.countdownLabel || (
                    isKhmer
                        ? isEngagement ? "រាប់ថយក្រោយដល់ថ្ងៃភ្ជាប់ពាក្យ" : "រាប់ថយក្រោយដល់ថ្ងៃមង្គល"
                        : isEngagement ? "Countdown to the Engagement" : "Countdown to the Wedding"
                )}
            </h2>
            <div className="grid w-full max-w-3xl grid-cols-4 gap-1.5 text-center sm:gap-4 md:gap-12">
                {[
                    { label: countdownUnits[0], value: timeLeft.days },
                    { label: countdownUnits[1], value: timeLeft.hours },
                    { label: countdownUnits[2], value: timeLeft.minutes },
                    { label: countdownUnits[3], value: timeLeft.seconds }
                ].map((item, idx) => (
                    <m.div 
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                        viewport={{ once: true }}
                        className="flex min-w-0 flex-col items-center"
                    >
                        <div className="mb-1 whitespace-nowrap font-suwannaphum text-[clamp(1rem,7vw,2rem)] font-semibold leading-tight tabular-nums text-slate-900 sm:mb-2 md:text-5xl">
                            {String(item.value).padStart(2, '0').replace(/\d/g, (digit) => (
                                isKhmer ? "០១២៣៤៥៦៧៨៩"[Number(digit)] : digit
                            ))}
                        </div>
                        <div className="whitespace-nowrap font-kantumruy text-[clamp(0.625rem,2.8vw,0.75rem)] font-bold leading-tight text-slate-500 sm:text-xs md:tracking-[0.12em]">
                            {item.label}
                        </div>
                    </m.div>
                ))}
            </div>

            {formattedEventDate && (
                <p className="mt-6 max-w-full px-2 text-center font-khmer-moul text-[clamp(0.7rem,3vw,0.875rem)] leading-relaxed text-[#77613a] sm:mt-8 sm:px-4">
                    {formattedEventDate}
                </p>
            )}

            {hasValidEventDate && (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mt-10 w-full text-center sm:mt-14"
                >
                    <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Wedding of ${wedding.groomName} and ${wedding.brideName}`)}&dates=${eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(eventDate.getTime() + 6*60*60*1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}&location=${encodeURIComponent(wedding.location || "Cambodia")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="m02-calendar-link inline-flex items-center gap-2 rounded-full border border-[#9b8055]/30 bg-white/75 px-7 py-3 font-suwannaphum text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm transition-colors hover:border-[#9b8055]/55 hover:bg-white hover:text-[#806744] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055] focus-visible:ring-offset-2 active:scale-[0.98]"
                    >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        រក្សាទុកក្នុងប្រតិទិន
                    </a>
                </m.div>
            )}
        </section>
    );
};
