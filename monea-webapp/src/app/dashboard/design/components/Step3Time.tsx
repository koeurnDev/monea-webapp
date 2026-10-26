import React from 'react';
import { m } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { DebouncedTextarea } from "@/components/ui/debounced-textarea";
import { Clock, Trash2, Plus, ExternalLink, Sparkles, CalendarDays, ArrowUp, ArrowDown } from "lucide-react";
import type { WeddingData } from '@/components/templates/types';
import { useTranslation } from "@/i18n/LanguageProvider";
import { toKhmerLunarDate } from "khmer-chhankitek-calendar";

interface Step3TimeProps {
    wedding: WeddingData;
    updateWedding: (key: keyof WeddingData, value: any) => void;
    updateTheme: (key: string, value: any) => void;
    setWedding: React.Dispatch<React.SetStateAction<WeddingData | null>>;
}

// Helper: Convert date to YYYY-MM-DD for <input type="date" />
const toDateInputString = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return "";
    }
};

// Helper: Convert date to HH:mm for <input type="time" />
const toTimeInputString = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "07:00";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "07:00";
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${mins}`;
    } catch (e) {
        return "07:00";
    }
};

// Helper: Format to natural Khmer date preview
const formatKhmerDatePreview = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("km-KH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch (e) {
        return "";
    }
};

const Step3Time: React.FC<Step3TimeProps> = ({ wedding, updateWedding, updateTheme, setWedding }) => {
    const { t } = useTranslation();
    const [mounted, setMounted] = React.useState(false);
    const isAnniv = wedding.eventType === 'anniversary';

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!wedding.date) return;
        const dateValue = toDateInputString(wedding.date);
        if (!dateValue) return;
        const lunarDate = toKhmerLunarDate(dateValue).lunarDateText;
        if (lunarDate && lunarDate !== wedding.themeSettings?.lunarDate) {
            updateTheme("lunarDate", lunarDate);
        }
    }, [wedding.date, wedding.themeSettings?.lunarDate, updateTheme]);

    const handleDateChange = (dateVal: string) => {
        if (!dateVal) return;
        try {
            const parts = dateVal.split('-').map(Number);
            if (parts.length < 3) return;
            const [y, m, d] = parts;
            const prev = wedding.date ? new Date(wedding.date) : new Date();
            const h = isNaN(prev.getTime()) ? 7 : prev.getHours();
            const min = isNaN(prev.getTime()) ? 0 : prev.getMinutes();
            const newDate = new Date(y, m - 1, d, h, min);
            if (!isNaN(newDate.getTime())) {
                updateWedding("date", newDate.toISOString());
                const lunarDate = toKhmerLunarDate(dateVal).lunarDateText;
                if (lunarDate) updateTheme("lunarDate", lunarDate);
            }
        } catch (e) {
            console.error("Failed to parse date:", e);
        }
    };

    const handleTimeChange = (timeVal: string) => {
        if (!timeVal) return;
        try {
            const [h, min] = timeVal.split(':').map(Number);
            const prev = wedding.date ? new Date(wedding.date) : new Date();
            const y = isNaN(prev.getTime()) ? new Date().getFullYear() : prev.getFullYear();
            const m = isNaN(prev.getTime()) ? new Date().getMonth() : prev.getMonth();
            const d = isNaN(prev.getTime()) ? new Date().getDate() : prev.getDate();
            const newDate = new Date(y, m, d, h || 0, min || 0);
            if (!isNaN(newDate.getTime())) {
                updateWedding("date", newDate.toISOString());
            }
        } catch (e) {
            console.error("Failed to parse time:", e);
        }
    };

    const khmerDatePreview = mounted ? formatKhmerDatePreview(wedding.date) : "";
    const updateActivity = (index: number, key: "title" | "time", value: string) => {
        setWedding((current) => current ? {
            ...current,
            activities: current.activities.map((activity, activityIndex) =>
                activityIndex === index ? { ...activity, [key]: value } : activity,
            ),
        } : current);
    };
    const addActivity = () => {
        setWedding((current) => current ? {
            ...current,
            activities: [
                ...current.activities,
                { title: "", time: "", description: "", order: current.activities.length },
            ],
        } : current);
    };
    const removeActivity = (index: number) => {
        setWedding((current) => current ? {
            ...current,
            activities: current.activities.filter((_, activityIndex) => activityIndex !== index),
        } : current);
    };
    const moveActivity = (index: number, direction: -1 | 1) => {
        setWedding((current) => {
            if (!current) return current;
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= current.activities.length) return current;
            const activities = [...current.activities];
            [activities[index], activities[nextIndex]] = [activities[nextIndex], activities[index]];
            return {
                ...current,
                activities: activities.map((activity, activityIndex) => ({ ...activity, order: activityIndex })),
            };
        });
    };

    return (
        <div className="space-y-3 sm:space-y-6 font-kantumruy">
            <div className="rounded-2xl border border-primary/20 bg-accent/40 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-foreground">ថ្ងៃ និងទីតាំងកម្មវិធី</h3>
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">ត្រូវបំពេញ</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-xs">
                    {t("wizard.steps.3.requiredIntro", { defaultValue: "សូមបញ្ចូលថ្ងៃ ទីតាំង និង Google Maps link។ ម៉ោងអាចរំលងបាន។" })}
                </p>
            </div>

            {/* Date & Location Fields */}
            <div className="space-y-3 sm:space-y-5">
                {/* Event Date & Time Grid */}
                <div className="space-y-2.5 bg-muted/30 p-3 sm:p-5 rounded-2xl border border-border">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
                        {/* 1. Date Picker */}
                        <div className="space-y-1.5">
                            <Label className="block text-xs font-bold text-foreground">
                                {t("wizard.steps.3.eventDate", { defaultValue: "ថ្ងៃ ខែ ឆ្នាំ កម្មវិធី" })} <span className="text-primary">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    aria-required="true"
                                    className="h-11 rounded-xl bg-background border border-border font-bold text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-sm cursor-pointer"
                                    value={mounted ? toDateInputString(wedding.date) : ""}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                />
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <Label htmlFor="wedding-lunar-date" className="block text-xs font-bold text-foreground">
                                    {t("wizard.steps.3.lunarDate", { defaultValue: "កាលបរិច្ឆេទចន្ទគតិ" })}
                                    <span className="ml-1 font-normal text-emerald-600">(ស្វ័យប្រវត្តិ អាចកែបាន)</span>
                                </Label>
                                <DebouncedInput
                                    id="wedding-lunar-date"
                                    className="h-11 rounded-xl bg-background border border-border font-bold text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/60 shadow-sm"
                                    placeholder={t("wizard.steps.3.lunarPlaceholder", { defaultValue: "ឧ. ថ្ងៃ ១៥ កើត ខែពិសាខ ឆ្នាំរោង" })}
                                    value={wedding.themeSettings?.lunarDate || ""}
                                    onDebouncedChange={(val) => updateTheme("lunarDate", val)}
                                />
                            </div>
                        </div>

                        {/* 2. Start Time Picker */}
                        <div className="space-y-1.5">
                            <Label className="block text-xs font-bold text-foreground">
                                {t("wizard.steps.3.startTime", { defaultValue: "ម៉ោងចាប់ផ្តើមកម្មវិធី" })}
                                <span className="ml-1 font-normal text-muted-foreground">(អាចរំលងបាន)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    type="time"
                                    className="h-11 rounded-xl bg-background border border-border font-bold text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-sm cursor-pointer font-mono"
                                    value={mounted ? toTimeInputString(wedding.date) : "07:00"}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Live Formatted Date Badge */}
                    {khmerDatePreview && (
                        <div className="pt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent border border-primary/20 text-primary text-xs font-bold font-kantumruy">
                                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span>ត្រូវនឹង៖ {khmerDatePreview}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2.5 bg-muted/30 p-3 sm:p-5 rounded-2xl border border-border">
                    <Label className="block text-xs font-bold text-foreground">
                        ឈ្មោះទីតាំងកម្មវិធី <span className="text-primary">*</span>
                    </Label>
                    <DebouncedInput
                        aria-required="true"
                        className="h-11 rounded-xl bg-background border border-border font-bold text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/60 shadow-sm"
                        placeholder="ឧ. មជ្ឈមណ្ឌលកោះពេជ្រ អគារ A"
                        value={wedding.location || ""}
                        onDebouncedChange={(val) => updateWedding("location", val)}
                    />
                    <p className="text-xs text-muted-foreground">ព័ត៌មាននេះនឹងបង្ហាញលើសំបុត្រអញ្ជើញ។</p>
                </div>

                {/* Required Google Maps link */}
                <section className="space-y-2.5 rounded-2xl border border-primary/20 bg-accent/30 p-3 sm:space-y-3 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="wedding-map-link" className="text-xs font-bold text-foreground">
                            {t("wizard.steps.3.mapLabel", { defaultValue: "ទីតាំងលើ Google Maps" })}
                            <span className="ml-1 text-rose-500">*</span>
                        </Label>
                        <a
                            href="https://www.google.com/maps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-bold text-primary shadow-sm hover:underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {t("wizard.steps.3.mapOpen", { defaultValue: "បើក Google Maps" })}
                        </a>
                    </div>
                    <details className="rounded-xl border border-primary/15 bg-card/70 px-3 py-2 text-xs text-muted-foreground sm:hidden">
                        <summary className="cursor-pointer font-bold text-primary">
                            របៀបយក Link ពី Google Maps
                        </summary>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
                            <li>{t("wizard.steps.3.mapStep1", { defaultValue: "បើក Google Maps ហើយស្វែងរកឈ្មោះទីតាំងកម្មវិធី។" })}</li>
                            <li>{t("wizard.steps.3.mapStep2", { defaultValue: "ចុច ឬចុចឲ្យជាប់លើទីតាំង រួចជ្រើសរើស «ចែករំលែក» (Share)។" })}</li>
                            <li>{t("wizard.steps.3.mapStep3", { defaultValue: "ចុច «ចម្លងតំណ» (Copy link) ហើយយកមកបិទភ្ជាប់ក្នុងប្រអប់ខាងក្រោម។" })}</li>
                        </ol>
                    </details>
                    <ol className="hidden list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground sm:block">
                        <li>{t("wizard.steps.3.mapStep1", { defaultValue: "បើក Google Maps ហើយស្វែងរកឈ្មោះទីតាំងកម្មវិធី។" })}</li>
                        <li>{t("wizard.steps.3.mapStep2", { defaultValue: "ចុច ឬចុចឲ្យជាប់លើទីតាំង រួចជ្រើសរើស «ចែករំលែក» (Share)។" })}</li>
                        <li>{t("wizard.steps.3.mapStep3", { defaultValue: "ចុច «ចម្លងតំណ» (Copy link) ហើយយកមកបិទភ្ជាប់ក្នុងប្រអប់ខាងក្រោម។" })}</li>
                    </ol>
                    <DebouncedInput
                        id="wedding-map-link"
                        aria-required="true"
                        aria-invalid={!wedding.themeSettings?.mapLink?.trim() && !wedding.mapUrl?.trim()}
                        className="h-11 rounded-xl border border-border bg-background text-xs text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder={t("wizard.steps.3.mapPlaceholder", { defaultValue: "ចម្លងតំណភ្ជាប់ 'Share' ពី Google Maps មកដាក់ទីនេះ..." })}
                        value={wedding.themeSettings?.mapLink || wedding.mapUrl || ""}
                        onDebouncedChange={(val) => updateTheme("mapLink", val)}
                    />
                    {!wedding.themeSettings?.mapLink?.trim() && !wedding.mapUrl?.trim() && (
                        <p role="status" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            {t("wizard.steps.3.mapRequiredHint", { defaultValue: "ត្រូវបញ្ចូល Google Maps link មុនពេលបន្ត ឬរក្សាទុក។" })}
                        </p>
                    )}
                </section>

                <section className="space-y-3 rounded-2xl border border-border bg-card p-3 sm:space-y-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary sm:h-10 sm:w-10">
                            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground">
                                    {isAnniv ? "កម្មវិធីសិរីមង្គលភ្ជាប់ពាក្យ" : "កម្មវិធីសិរីមង្គលអាពាហ៍ពិពាហ៍"}
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    នេះជាកម្មវិធីគំរូប៉ុណ្ណោះ។ សូមកែម៉ោង និងពិធីឱ្យត្រូវនឹងកម្មវិធីគ្រួសារអ្នក ឬលុបវគ្គដែលមិនប្រើ។
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                            {wedding.activities.length} វគ្គ
                        </span>
                    </div>

                    {wedding.activities.map((activity, index) => (
                        <div key={index} className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-2.5 sm:space-y-3 sm:p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                                        {index + 1}
                                    </span>
                                    <p className="truncate text-xs font-bold text-foreground">
                                        {activity.title.trim() || `វគ្គទី ${index + 1}`}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveActivity(index, -1)}
                                        disabled={index === 0}
                                        aria-label={`ផ្លាស់ទីវគ្គទី ${index + 1} ឡើងលើ`}
                                        title="ផ្លាស់ទីឡើងលើ"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveActivity(index, 1)}
                                        disabled={index === wedding.activities.length - 1}
                                        aria-label={`ផ្លាស់ទីវគ្គទី ${index + 1} ចុះក្រោម`}
                                        title="ផ្លាស់ទីចុះក្រោម"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeActivity(index)}
                                        aria-label={`លុបវគ្គទី ${index + 1}`}
                                        title="លុបវគ្គ"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`activity-time-${index}`} className="text-xs font-bold text-foreground">
                                        ម៉ោង
                                    </Label>
                                    <Input
                                        id={`activity-time-${index}`}
                                        value={activity.time}
                                        onChange={(event) => updateActivity(index, "time", event.target.value)}
                                        placeholder="ឧ. ០៨:៣០ ព្រឹក"
                                        className="h-11 rounded-xl bg-background text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`activity-title-${index}`} className="text-xs font-bold text-foreground">
                                        ចំណងជើងវគ្គ <span className="text-primary">(ត្រូវបំពេញ)</span>
                                    </Label>
                                    <Input
                                        id={`activity-title-${index}`}
                                        value={activity.title}
                                        onChange={(event) => updateActivity(index, "title", event.target.value)}
                                        placeholder="ឧ. ពិធីសំពះផ្ទឹម"
                                        className="h-11 rounded-xl bg-background text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {wedding.activities.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-primary/30 bg-accent/30 px-4 py-6 text-center">
                            <CalendarDays className="mx-auto h-8 w-8 text-primary/60" />
                            <p className="mt-2 text-sm font-bold text-foreground">មិនទាន់មានវគ្គកម្មវិធីទេ</p>
                            <p className="mt-1 text-xs text-muted-foreground">បន្ថែមវគ្គដំបូង រួចបញ្ចូលចំណងជើង និងម៉ោង។</p>
                            <Button type="button" onClick={addActivity} className="mt-4 h-11 gap-2 rounded-xl px-5">
                                <Plus className="h-4 w-4" />
                                បន្ថែមវគ្គដំបូង
                            </Button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={addActivity} className="h-11 w-full gap-2 rounded-xl">
                            <Plus className="h-4 w-4" />
                            បន្ថែមវគ្គកម្មវិធី
                        </Button>
                    )}
                </section>

            </div>
        </div>
    );
};

export default React.memo(Step3Time);
