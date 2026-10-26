import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { BookHeart, LoaderCircle, MessageCircleHeart, RefreshCw, Send } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { WeddingData } from "../types";

interface GuestbookEntry {
    id: string;
    guestName: string;
    message: string;
    createdAt: string;
}

interface GuestbookSectionProps {
    wedding: WeddingData;
    tone?: "light" | "dark";
    khmerSpacing?: boolean;
    titleOneLine?: boolean;
    unboxed?: boolean;
    accentColorOverride?: string;
    sectionClassName?: string;
    contentClassName?: string;
}

const isGuestbookEntry = (value: unknown): value is GuestbookEntry => {
    if (!value || typeof value !== "object") return false;
    const entry = value as Record<string, unknown>;
    return typeof entry.id === "string"
        && typeof entry.guestName === "string"
        && typeof entry.message === "string"
        && typeof entry.createdAt === "string";
};

const fetchEntries = async (url: string): Promise<GuestbookEntry[]> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Guestbook request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
        throw new Error("Guestbook response was invalid");
    }

    if (!payload.every(isGuestbookEntry)) {
        throw new Error("Guestbook response contained invalid entries");
    }

    return payload;
};

export function GuestbookSection({ wedding, tone = "light", khmerSpacing = false, titleOneLine = false, unboxed = false, accentColorOverride, sectionClassName = "", contentClassName = "" }: GuestbookSectionProps) {
    const { locale, t } = useTranslation();
    const isSamplePreview = wedding.id === "preview-default" || wedding.id === "approval-preview";
    const requestKey = wedding.id && !isSamplePreview
        ? `/api/guestbook?weddingId=${encodeURIComponent(wedding.id)}`
        : null;
    const { data, error, isLoading, mutate } = useSWR<GuestbookEntry[]>(requestKey, fetchEntries);
    const entries = data ?? (isSamplePreview ? [] : undefined);
    const [guestName, setGuestName] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const dark = tone === "dark";
    const accentColor = accentColorOverride || wedding.themeSettings?.primaryColor || "#A27A43";
    const khmerSpacingClass = khmerSpacing ? "fh-khmer-safe" : "";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = guestName.trim();
        const trimmedMessage = message.trim();
        if (!trimmedName || !trimmedMessage || !wedding.id || isSubmitting) return;
        const website = String(new FormData(event.currentTarget).get("website") ?? "");

        setIsSubmitting(true);
        setSubmitError(false);
        setSubmitted(false);
        try {
            const response = await fetch("/api/guestbook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weddingId: wedding.id,
                    guestName: trimmedName,
                    message: trimmedMessage,
                    website,
                }),
            });
            if (!response.ok) {
                throw new Error(`Guestbook submission failed with status ${response.status}`);
            }

            const created: unknown = await response.json();
            if (!isGuestbookEntry(created)) {
                throw new Error("Guestbook response was invalid");
            }

            await mutate((current = []) => [created, ...current], { revalidate: false });
            setGuestName("");
            setMessage("");
            setSubmitted(true);
        } catch (submissionError) {
            console.error("[GuestbookSection] Submission failed:", submissionError);
            setSubmitError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString(locale === "km" ? "km-KH" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <section
            id="guestbook"
            aria-labelledby="guestbook-title"
            className={`px-4 py-14 sm:px-6 sm:py-16 ${dark ? "bg-[#171a16] text-[#f4ecdc]" : "bg-[#faf8f5] text-slate-900"} ${sectionClassName}`}
        >
            <div className={`mx-auto max-w-xl ${unboxed ? "" : `rounded-3xl border p-5 shadow-sm sm:p-8 ${dark ? "border-[#b99b68]/35 bg-[#22251f]" : "border-stone-200 bg-white"}`} ${contentClassName}`}>
                <header className="mb-7 text-center">
                    <BookHeart className="mx-auto mb-3 h-7 w-7" style={{ color: accentColor }} aria-hidden="true" />
                    <h2 id="guestbook-title" className={`${khmerSpacingClass} font-khmer-moul ${titleOneLine ? "max-w-full whitespace-nowrap text-[clamp(0.65rem,3.6vw,1.5rem)]" : "break-words text-xl sm:text-2xl"}`} style={{ color: accentColor }}>
                        {wedding.themeSettings?.customLabels?.guestbookTitle || t("invitation.guestbook.title")}
                    </h2>
                    <p className={`${khmerSpacingClass} mt-2 text-sm ${dark ? "text-[#d9cfb9]" : "text-slate-600"}`}>
                        {t("invitation.guestbook.subtitle")}
                    </p>
                    <div className="mx-auto mt-4 h-px w-16" style={{ backgroundColor: accentColor }} />
                </header>

                {isSamplePreview ? (
                    <p className={`${khmerSpacingClass} ${unboxed ? "border-l-2 px-4 py-2" : "rounded-xl border px-4 py-3"} text-center text-sm ${unboxed ? (dark ? "border-white/25 text-white/65" : "border-stone-300 text-slate-600") : (dark ? "border-white/10 bg-black/15 text-white/65" : "border-stone-200 bg-stone-50 text-slate-600")}`}>
                        {t("invitation.guestbook.previewOnly")}
                    </p>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="hidden" aria-hidden="true">
                        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>
                    <div>
                        <label htmlFor="guestbook-name" className={`${khmerSpacingClass} mb-1.5 block text-sm font-semibold`}>
                            {t("invitation.guestbook.name")}
                        </label>
                        <input
                            id="guestbook-name"
                            name="guestName"
                            autoComplete="name"
                            value={guestName}
                            onChange={(event) => setGuestName(event.target.value)}
                            maxLength={50}
                            required
                            className={`min-h-12 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus-visible:ring-2 ${khmerSpacingClass} ${dark ? "border-white/15 bg-black/20 text-white placeholder:text-white/45 focus-visible:ring-white/50" : "border-stone-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400"}`}
                            placeholder={t("invitation.guestbook.namePlaceholder")}
                        />
                    </div>

                    <div>
                        <label htmlFor="guestbook-message" className={`${khmerSpacingClass} mb-1.5 block text-sm font-semibold`}>
                            {t("invitation.guestbook.message")}
                        </label>
                        <textarea
                            id="guestbook-message"
                            name="message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            maxLength={500}
                            rows={4}
                            required
                            className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-7 outline-none transition focus-visible:ring-2 ${khmerSpacingClass} ${dark ? "border-white/15 bg-black/20 text-white placeholder:text-white/45 focus-visible:ring-white/50" : "border-stone-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"}`}
                            placeholder={t("invitation.guestbook.msgPlaceholder")}
                        />
                    </div>

                    {submitError && (
                        <p role="alert" className={`${khmerSpacingClass} rounded-xl px-4 py-3 text-sm ${dark ? "bg-red-950/50 text-red-200" : "bg-red-50 text-red-700"}`}>
                            {t("invitation.guestbook.submitError")}
                        </p>
                    )}
                    {submitted && (
                        <p role="status" className={`${khmerSpacingClass} rounded-xl px-4 py-3 text-sm ${dark ? "bg-emerald-950/50 text-emerald-200" : "bg-emerald-50 text-emerald-800"}`}>
                            {t("invitation.guestbook.submitSuccess")}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !wedding.id}
                        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${dark ? "hover:brightness-105 focus-visible:ring-offset-[#171a16]" : "hover:bg-black/5 focus-visible:ring-offset-white dark:hover:bg-white/5"}`}
                        style={{
                            borderColor: accentColor,
                            color: dark ? "#171a16" : accentColor,
                            backgroundColor: dark ? accentColor : undefined,
                        }}
                    >
                        {isSubmitting
                            ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /><span className={khmerSpacingClass}>{t("invitation.guestbook.sending")}</span></>
                            : <><Send className="h-4 w-4" aria-hidden="true" /><span className={khmerSpacingClass}>{t("invitation.guestbook.submit")}</span></>}
                    </button>
                </form>
                )}

                <div className="mt-9">
                    <h3 className={`${khmerSpacingClass} mb-4 flex items-center gap-2 font-bold`}>
                        <MessageCircleHeart className="h-5 w-5" style={{ color: accentColor }} aria-hidden="true" />
                        {t("invitation.guestbook.recentMessages")}
                    </h3>

                    {isLoading && (
                        <p className={`${khmerSpacingClass} flex items-center justify-center gap-2 py-6 text-sm ${dark ? "text-white/65" : "text-slate-500"}`}>
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                            {t("invitation.guestbook.loading")}
                        </p>
                    )}

                    {error && (
                        <div className={`${unboxed ? "border-l-2 px-4 py-2" : "rounded-xl border p-4"} text-center ${unboxed ? (dark ? "border-red-300/40" : "border-red-400") : (dark ? "border-red-300/20 bg-red-950/30" : "border-red-200 bg-red-50")}`}>
                            <p role="alert" className={`${khmerSpacingClass} text-sm`}>{t("invitation.guestbook.loadError")}</p>
                            <button
                                type="button"
                                onClick={() => void mutate()}
                                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
                                style={{ borderColor: accentColor, color: accentColor }}
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                <span className={khmerSpacingClass}>{t("invitation.guestbook.retry")}</span>
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && entries?.length === 0 && (
                        <p className={`${khmerSpacingClass} ${unboxed ? "border-y border-dashed" : "rounded-xl border border-dashed"} px-4 py-6 text-center text-sm ${dark ? "border-white/15 text-white/60" : "border-stone-300 text-slate-500"}`}>
                            {t("invitation.guestbook.noWishes")}
                        </p>
                    )}

                    {!isLoading && !error && Boolean(entries?.length) && (
                        <ul className="space-y-3">
                            {entries?.slice(0, 5).map((entry) => (
                                <li key={entry.id} className={`${unboxed ? "border-b py-4" : "rounded-xl border p-4"} ${unboxed ? (dark ? "border-white/10" : "border-stone-200") : (dark ? "border-white/10 bg-black/15" : "border-stone-200 bg-[#faf8f5]")}`}>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                        <p className={`${khmerSpacingClass} break-words font-bold`}>{entry.guestName}</p>
                                        {formatDate(entry.createdAt) && (
                                            <time dateTime={entry.createdAt} className={`${khmerSpacingClass} text-xs ${dark ? "text-white/50" : "text-slate-400"}`}>
                                                {formatDate(entry.createdAt)}
                                            </time>
                                        )}
                                    </div>
                                    <p className={`${khmerSpacingClass} mt-2 whitespace-pre-wrap break-words text-sm ${dark ? "text-[#e8dfce]" : "text-slate-600"}`}>
                                        {entry.message}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
