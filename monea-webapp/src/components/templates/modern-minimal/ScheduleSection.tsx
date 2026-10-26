import React, { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { km } from 'date-fns/locale';
import { WeddingData } from "../types";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Flower2, Gift, Heart, Landmark, Music2, Scissors, Sparkles, Utensils, Users, X, type LucideIcon } from 'lucide-react';

const ACTIVITY_ICONS = new Map<string, LucideIcon>([
    ["flower", Flower2],
    ["users", Users],
    ["gift", Gift],
    ["landmark", Landmark],
    ["heart", Heart],
    ["scissors", Scissors],
    ["music", Music2],
    ["utensils", Utensils],
]);

export const ScheduleSection = ({ wedding, title }: { wedding: WeddingData; title?: string }) => {
    const activities = wedding.activities || [];
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const eventDate = new Date(wedding.date);
    const formattedEventDate = isValid(eventDate)
        ? format(eventDate, "EEEE 'ទី' d 'ខែ' MMMM 'ឆ្នាំ' yyyy", { locale: km })
            .replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)])
        : "";

    if (activities.length === 0) return null;

    const pageIndex = Math.min(currentPage, activities.length - 1);
    const currentActivity = activities[pageIndex];
    let displayTime = currentActivity.time || "";
    displayTime = displayTime.replace(/^វេលាម៉ោង\s*/, '').replace(/^ម៉ោង\s*/, '');
    const isHeader = currentActivity.icon === "header" || (!displayTime && !currentActivity.description && activities.length > 1);
    const ActivityIcon = currentActivity.icon
        ? ACTIVITY_ICONS.get(currentActivity.icon.toLowerCase()) || Sparkles
        : Sparkles;

    return (
        <section className="relative overflow-hidden bg-[#fbfaf7] px-4 py-12 sm:px-6 sm:py-16" id="schedule-modern">
            <div className="relative mx-auto max-w-xl">
                <header className="mb-7 text-center sm:mb-9">
                    <CalendarDays aria-hidden="true" className="mx-auto mb-3 h-11 w-11 text-[#704858] sm:h-12 sm:w-12" strokeWidth={1.6} />
                    <h2 className="break-words font-khmer-moul text-xl leading-relaxed text-[#704858] sm:text-2xl">
                        {title || (wedding.eventType === "anniversary" ? "កម្មវិធីពិធីភ្ជាប់ពាក្យ" : "កម្មវិធីអាពាហ៍ពិពាហ៍")}
                    </h2>
                    {formattedEventDate && (
                        <p className="mt-1 break-words font-suwannaphum text-sm font-semibold leading-7 text-[#5d4b52] sm:text-base">
                            {formattedEventDate}
                        </p>
                    )}
                    <div className="mx-auto mt-4 h-px w-16 bg-[#704858]/30" />
                </header>
                <div className="mx-auto max-w-md" style={{ perspective: "1200px" }}>
                    {!isBookOpen ? (
                        <m.button
                            type="button"
                            onClick={() => setIsBookOpen(true)}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-r-2xl rounded-l-md border border-[#d6c6a4] bg-gradient-to-br from-[#805b45] via-[#684638] to-[#49352f] px-8 py-10 text-center text-[#fff8e8] shadow-[8px_12px_24px_rgba(55,38,28,0.22),inset_8px_0_0_rgba(255,255,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055] focus-visible:ring-offset-4"
                            aria-label="បើកមើលសៀវភៅកម្មវិធី"
                        >
                            <span aria-hidden="true" className="absolute inset-y-0 left-4 w-px bg-[#e8d5aa]/40" />
                            <span aria-hidden="true" className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#ead9b5]/55 bg-black/10 text-[#f5dfae]">
                                <BookOpen className="h-7 w-7" strokeWidth={1.5} />
                            </span>
                            <span className="font-khmer-moul text-lg leading-relaxed sm:text-xl">សៀវភៅកម្មវិធី</span>
                            <span className="mt-2 font-suwannaphum text-sm text-[#f1e2c6]">{formattedEventDate}</span>
                            <span className="mt-7 rounded-full border border-[#ead9b5]/55 px-5 py-2 font-suwannaphum text-sm transition-colors group-hover:bg-white/10">
                                បើកមើលកម្មវិធី
                            </span>
                        </m.button>
                    ) : (
                        <div className="overflow-hidden rounded-r-2xl rounded-l-md border border-[#dfd5c5] bg-[#fffdf8] shadow-[8px_12px_28px_rgba(55,38,28,0.2),inset_8px_0_0_#e9e0d1]">
                            <div className="flex items-center justify-between border-b border-[#704858]/15 py-3 pl-7 pr-4">
                                <span className="font-suwannaphum text-xs text-[#806a47]">
                                    កម្មវិធី {pageIndex + 1} / {activities.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsBookOpen(false)}
                                    className="rounded-full p-2 text-[#704858] transition hover:bg-[#704858]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                    aria-label="បិទសៀវភៅ"
                                >
                                    <X aria-hidden="true" className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="relative min-h-[280px] overflow-hidden px-7 py-8 sm:min-h-[320px] sm:px-10" aria-live="polite">
                                <span aria-hidden="true" className="absolute inset-y-0 left-4 w-px bg-[#704858]/15" />
                                <AnimatePresence mode="wait">
                                    <m.article
                                        key={`page-${pageIndex}`}
                                        initial={{ opacity: 0, x: 24, rotateY: -5 }}
                                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                        exit={{ opacity: 0, x: -24, rotateY: 5 }}
                                        transition={{ duration: 0.22 }}
                                        className="flex min-h-[216px] flex-col justify-center text-center"
                                    >
                                        {isHeader ? (
                                            <>
                                                <BookOpen aria-hidden="true" className="mx-auto mb-5 h-7 w-7 text-[#9b8055]" strokeWidth={1.5} />
                                                <h3 className="break-words font-khmer-moul text-base leading-8 text-[#704858] sm:text-lg">
                                                    {currentActivity.title}
                                                </h3>
                                                {currentActivity.description && (
                                                    <p className="mt-3 break-words font-suwannaphum text-sm leading-8 text-[#5d4b52] sm:text-base">
                                                        {currentActivity.description}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <ActivityIcon aria-hidden="true" className="mx-auto mb-4 h-7 w-7 text-[#9b8055]" strokeWidth={1.5} />
                                                {displayTime && (
                                                    <p className="mb-3 flex items-center justify-center gap-2 break-words font-suwannaphum text-sm font-semibold leading-7 text-[#704858] sm:text-base">
                                                        <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
                                                        <span>{displayTime}</span>
                                                    </p>
                                                )}
                                                <h3 className="break-words font-suwannaphum text-base font-semibold leading-8 text-[#49343a] sm:text-lg">
                                                    {currentActivity.title}
                                                </h3>
                                                {currentActivity.description && (
                                                    <p className="mt-2 break-words font-suwannaphum text-sm leading-8 text-[#5d4b52] sm:text-base">
                                                        {currentActivity.description}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </m.article>
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center justify-between border-t border-[#704858]/15 px-4 py-3 pl-7">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(0, pageIndex - 1))}
                                    disabled={pageIndex === 0}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-suwannaphum text-sm text-[#704858] transition hover:bg-[#704858]/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                >
                                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                                    មុន
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(activities.length - 1, pageIndex + 1))}
                                    disabled={pageIndex === activities.length - 1}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-suwannaphum text-sm text-[#704858] transition hover:bg-[#704858]/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                >
                                    បន្ទាប់
                                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
