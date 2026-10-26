import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
    CalendarDays,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    Gift,
    Heart,
    MapPin,
    Scissors,
    Sparkles,
    Utensils,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import copy from "@/i18n/nea-m05.json";
import { formatNeaM05Date, formatNeaM05DateParts } from "@/lib/nea-m05-date";
import { downloadIcsFile } from "@/lib/calendar";
import type { ResolvedTemplateConfig, WeddingData } from "./types";
import { getWeddingHeroImage, getWeddingPhotos } from "./shared/weddingPhotos";
import { getGalleryCardClass, getGalleryContainerClass, getGalleryDisplayStyle } from "./shared/gallery-layout";
import { PhotoImage } from "./shared/PhotoImage";
import { getDirectMapUrl, getMapEmbedUrl, isGoogleMapsShortLink } from "./shared/mapUtils";
import { isSectionVisible } from "./shared/template-settings";
import { GuestbookSection } from "./shared/GuestbookSection";
import { MoneaFooterBrand } from "./shared/MoneaFooterBrand";
import { SocialLinksSection } from "./shared/SocialLinksSection";
import { CoupleNamesLine, OneLineName } from "./shared/OneLineName";

type Locale = keyof typeof copy;

type NeaM05SectionsProps = {
    wedding: WeddingData;
    config: ResolvedTemplateConfig;
    locale: Locale;
    isApprovalPreview: boolean;
    reducedMotion: boolean;
};

const toKhmerDigits = (value: number | string, locale: Locale) => {
    const digits = String(value);
    if (locale === "en") return digits;
    return digits.replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]);
};

function formatVenueDate(date: Date, locale: Locale): string {
    if (locale !== "km") return formatNeaM05Date(date, locale);
    const [weekday, day, month, year] = formatNeaM05DateParts(date, locale);
    return `ថ្ងៃ${weekday} ទី${day} ខែ${month} ឆ្នាំ${year}`;
}

const ParentNames = ({
    title,
    father,
    mother,
    locale,
}: {
    title: string;
    father?: string;
    mother?: string;
    locale: Locale;
}) => {
    const text = copy[locale];
    const fatherName = father?.trim();
    const motherName = mother?.trim();

    if (!fatherName && !motherName) return null;

    return (
        <div className="min-w-0 px-2 py-3 text-center [container-type:inline-size] sm:px-3 sm:py-4">
            <h3 className="m05-khmer-safe whitespace-nowrap font-khmer-moul text-[clamp(8px,4.3cqi,14px)] leading-[1.9] text-[#d9bd83]">
                {title}
            </h3>
            <div className="mt-3 space-y-2">
                {fatherName && (
                    <OneLineName
                        name={`${text.fatherNamePrefix} ${fatherName}`}
                        className="m05-khmer-safe font-kantumruy text-sm font-semibold leading-[1.9] text-[#fffaf0]"
                    />
                )}
                {motherName && (
                    <OneLineName
                        name={`${text.motherNamePrefix} ${motherName}`}
                        className="m05-khmer-safe font-kantumruy text-sm font-semibold leading-[1.9] text-[#fffaf0]"
                    />
                )}
            </div>
        </div>
    );
};

const RitualIcon = ({ index }: { index: number }) => {
    const Icon = [Gift, Sparkles, Scissors, Heart, Sparkles, Heart, Gift, Utensils][index % 8];
    return <Icon aria-hidden="true" data-m05-draw="" size={18} strokeWidth={1.4} />;
};

export default function NeaM05Sections({
    wedding,
    config,
    locale,
    isApprovalPreview,
    reducedMotion,
}: NeaM05SectionsProps) {
    const text = wedding.eventType === "anniversary"
        ? { ...copy[locale], ...copy[locale].engagement }
        : copy[locale];
    const venueMapLocation = wedding.themeSettings?.mapLink?.trim()
        || wedding.mapUrl?.trim()
        || [wedding.locationName, wedding.location].filter(Boolean).join(", ");
    const venueMapEmbedUrl = venueMapLocation && !isGoogleMapsShortLink(venueMapLocation)
        ? getMapEmbedUrl(venueMapLocation, [wedding.locationName, wedding.location].filter(Boolean).join(", "))
        : null;
    const [isStoryBookOpen, setIsStoryBookOpen] = useState(false);
    const [storyPageIndex, setStoryPageIndex] = useState(0);
    const gallery = useMemo(() => getWeddingPhotos(wedding), [wedding]);
    const visibleGallery = gallery;
    const galleryDisplayStyle = getGalleryDisplayStyle(wedding.themeSettings?.galleryStyle);
    const parents = wedding.themeSettings?.parents;
    const groomFather = (parents?.groomFather || wedding.groomFather)?.trim();
    const groomMother = (parents?.groomMother || wedding.groomMother)?.trim();
    const brideFather = (parents?.brideFather || wedding.brideFather)?.trim();
    const brideMother = (parents?.brideMother || wedding.brideMother)?.trim();
    const couplePhoto = getWeddingHeroImage(wedding);
    const candlePhoto = visibleGallery[2]?.url || couplePhoto || visibleGallery[0]?.url;
    const loveStory = wedding.themeSettings?.loveStory?.trim()
        || wedding.themeSettings?.story?.kh?.trim()
        || "";
    const showLoveStory = isSectionVisible(config, "story");
    const storyImages = wedding.themeSettings?.storyImages !== undefined
        ? wedding.themeSettings.storyImages.filter(Boolean)
        : visibleGallery.slice(0, 5).map((item) => item.url);
    const hasLoveStoryContent = Boolean(loveStory || wedding.themeSettings?.storyImages?.some(Boolean));
    const storyTextPages = loveStory.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const storyPages = [
        ...storyTextPages.map((content) => ({ type: "text" as const, content })),
        ...storyImages.map((src, index) => ({
            type: "image" as const,
            src,
            caption: wedding.themeSettings?.storyImageCaptions?.[index]?.trim(),
        })),
        ...(storyImages.length > 0 ? [{ type: "ending" as const, content: text.storyEnding }] : []),
    ];
    const currentStoryPageIndex = Math.min(storyPageIndex, Math.max(0, storyPages.length - 1));
    const currentStoryPage = storyPages[currentStoryPageIndex];
    const activities = wedding.activities ?? [];
    const showTimeline = isSectionVisible(config, "timeline");
    const showGallery = isSectionVisible(config, "gallery");
    const targetTime = wedding.date ? new Date(wedding.date).getTime() : Number.NaN;
    const [remaining, setRemaining] = useState<number | null>(null);
    const [activeImage, setActiveImage] = useState<number | null>(null);
    const [floatingLights, setFloatingLights] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const nextFloatingLightId = useRef(0);
    const [downloadError, setDownloadError] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const galleryDialogRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = reducedMotion;

    const releaseFloatingLight = (event: MouseEvent<HTMLButtonElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.detail === 0 ? 50 : ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = event.detail === 0 ? 50 : ((event.clientY - bounds.top) / bounds.height) * 100;
        const id = nextFloatingLightId.current++;
        setFloatingLights((lights) => [...lights.slice(-6), { id, x, y }]);
    };

    useEffect(() => {
        if (!Number.isFinite(targetTime)) {
            setRemaining(null);
            return;
        }
        const update = () => setRemaining(Math.max(0, targetTime - Date.now()));
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [targetTime]);

    useEffect(() => {
        if (activeImage === null) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        galleryDialogRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActiveImage(null);
            if (event.key === "ArrowRight") setActiveImage((index) => index === null ? null : (index + 1) % visibleGallery.length);
            if (event.key === "ArrowLeft") setActiveImage((index) => index === null ? null : (index - 1 + visibleGallery.length) % visibleGallery.length);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [activeImage, visibleGallery.length]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || prefersReducedMotion) return;
        gsap.registerPlugin(CustomEase, ScrollTrigger);
        const revealEase = CustomEase.create("m05SectionReveal", "0.22, 1, 0.36, 1");
        const context = gsap.context(() => {
            root.querySelectorAll<HTMLElement>("[data-m05-reveal]").forEach((element) => {
                gsap.fromTo(
                    element,
                    { opacity: 0, y: 28 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.95,
                        ease: revealEase,
                        scrollTrigger: { trigger: element, start: "top 82%", once: true },
                    },
                );
            });

            const thread = root.querySelector<SVGPathElement>("[data-m05-thread]");
            const programme = root.querySelector<HTMLElement>("#m05-programme");
            if (thread && programme) {
                const length = thread.getTotalLength();
                gsap.set(thread, { strokeDasharray: length, strokeDashoffset: length });
                gsap.to(thread, {
                    strokeDashoffset: 0,
                    ease: "none",
                    scrollTrigger: { trigger: programme, start: "top 60%", end: "bottom 65%", scrub: 0.8 },
                });
            }

            root.querySelectorAll<SVGPathElement>("[data-m05-draw] path").forEach((path) => {
                const article = path.closest("article");
                if (!article) return;
                const length = path.getTotalLength();
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
                gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 0.65,
                    ease: revealEase,
                    scrollTrigger: { trigger: article, start: "top 78%", once: true },
                });
            });

        }, root);
        return () => {
            context.revert();
        };
    }, [prefersReducedMotion]);

    const countdownParts = remaining === null
        ? null
        : [
            Math.floor(remaining / 86_400_000),
            Math.floor((remaining % 86_400_000) / 3_600_000),
            Math.floor((remaining % 3_600_000) / 60_000),
            Math.floor((remaining % 60_000) / 1_000),
        ];
    const saveQr = async (source: string, index: number) => {
        setDownloadError(false);
        try {
            const response = await fetch(source);
            if (!response.ok) throw new Error(`QR download failed (${response.status})`);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = `nea-m05-qr-${index + 1}.${blob.type.includes("png") ? "png" : "webp"}`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (error) {
            console.error("Unable to save the wedding gift QR image:", error);
            setDownloadError(true);
        }
    };

    const openGalleryImage = (delta: number) => {
        setActiveImage((index) => {
            if (index === null || visibleGallery.length === 0) return index;
            return (index + delta + visibleGallery.length) % visibleGallery.length;
        });
    };

    return (
        <div ref={rootRef} className="contents">
            {(groomFather || groomMother || brideFather || brideMother || wedding.themeSettings?.invitationText?.trim()) && (
                <section
                    id="m05-invitation-words"
                    data-m05-reveal=""
                    className="relative overflow-hidden bg-[#25281f] px-5 py-12 text-[#f4ecdc] [container-type:inline-size] sm:py-16"
                >
                    <div className="mx-auto max-w-3xl rounded-2xl border border-[#c8ad76]/20 bg-black/10 px-3 py-5 sm:px-6 sm:py-7">
                        {(groomFather || groomMother || brideFather || brideMother) && (
                            <div className="grid grid-cols-2 divide-x divide-[#c8ad76]/30 [container-type:inline-size]">
                                <ParentNames title={text.groomParents} father={groomFather} mother={groomMother} locale={locale} />
                                <ParentNames title={text.brideParents} father={brideFather} mother={brideMother} locale={locale} />
                            </div>
                        )}
                        {wedding.themeSettings?.invitationText?.trim() && (
                            <p className="m05-khmer-safe mt-5 whitespace-pre-line text-center font-kantumruy text-sm leading-8 text-[#f4ecdc]/90">
                                {wedding.themeSettings.invitationText}
                            </p>
                        )}
                    </div>
                </section>
            )}

            <section
                id="m05-couple"
                data-m05-reveal=""
                className="relative overflow-hidden bg-[#24271f] px-5 py-20 text-[#f4ecdc] [container-type:inline-size] sm:py-28"
                style={{
                    backgroundImage: "url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                    backgroundBlendMode: "multiply",
                }}
            >
                <div className="m05-couple-layout relative mx-auto grid max-w-5xl items-center gap-12">
                    <div className="mx-auto w-full max-w-[360px]">
                        <div
                            className="relative aspect-[4/5] overflow-hidden"
                            style={{ clipPath: "polygon(50% 0%,56% 2%,62% 0%,68% 2%,74% 0%,80% 2%,86% 0%,92% 2%,98% 0%,100% 7%,98% 13%,100% 19%,98% 25%,100% 31%,98% 37%,100% 43%,98% 49%,100% 55%,98% 61%,100% 67%,98% 73%,100% 79%,98% 85%,100% 91%,98% 97%,92% 100%,86% 98%,80% 100%,74% 98%,68% 100%,62% 98%,56% 100%,50% 98%,44% 100%,38% 98%,32% 100%,26% 98%,20% 100%,14% 98%,8% 100%,2% 98%,0% 92%,2% 86%,0% 80%,2% 74%,0% 68%,2% 62%,0% 56%,2% 50%,0% 44%,2% 38%,0% 32%,2% 26%,0% 20%,2% 14%,0% 8%,2% 2%,8% 0%,14% 2%,20% 0%,26% 2%,32% 0%,38% 2%,44% 0%)" }}
                        >
                            {couplePhoto ? (
                                <>
                                    <PhotoImage src={couplePhoto} alt={text.couplePhotoAlt} className="h-full w-full object-cover" sizes="(max-width: 640px) 100vw, 400px" loading="lazy" decoding="async" />
                                    <span className="m05-photo-tint pointer-events-none absolute inset-2" aria-hidden="true" />
                                </>
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-[#909878] to-[#252b21]" />
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 text-center">
                        <p className="m05-foil m05-khmer-safe font-khmer-moul text-xs">{text.coupleEyebrow}</p>
                        <h2 className="m05-section-title m05-khmer-safe mt-3 whitespace-nowrap font-khmer-moul text-[clamp(0.8rem,4.2cqi,1.5rem)]">{text.coupleTitle}</h2>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6">
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7bd88]">{text.groom}</p>
                                <OneLineName name={wedding.groomName} className="m05-foil m05-khmer-safe mt-2 font-moulpali text-[clamp(0.7rem,3.5cqi,1rem)]" />
                            </div>
                            <div className="min-w-0 border-l border-[#c8ad76]/25 pl-2 sm:pl-4">
                                <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7bd88]">{text.bride}</p>
                                <OneLineName name={wedding.brideName} className="m05-foil m05-khmer-safe mt-2 font-moulpali text-[clamp(0.7rem,3.5cqi,1rem)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="m05-countdown" data-m05-reveal="" className="relative overflow-hidden bg-[#25281f] px-4 py-14 text-center text-[#f4ecdc] [container-type:inline-size] sm:px-6 sm:py-20">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8ad76]/45 to-transparent" />
                <style>{`
                    #m05-countdown .m05-countdown-number {
                        padding-block: .12em .16em;
                        line-height: 1.4 !important;
                    }
                    #m05-countdown .m05-countdown-unit {
                        padding-block: .18em .2em;
                        line-height: 1.7 !important;
                    }
                `}</style>
                <div className="relative mx-auto max-w-4xl">
                    <div className="mb-3 flex items-center justify-center gap-3 sm:mb-4">
                        <span aria-hidden="true" className="h-px w-7 bg-[#c8ad76]/60 sm:w-12" />
                        <p className="m05-foil m05-khmer-safe font-khmer-moul text-[10px] tracking-[0.16em] sm:text-xs">{text.countdownEyebrow}</p>
                        <span aria-hidden="true" className="h-px w-7 bg-[#c8ad76]/60 sm:w-12" />
                    </div>
                    <h2 className="m05-section-title m05-khmer-safe whitespace-nowrap font-khmer-moul text-[clamp(0.65rem,5cqi,1.5rem)] text-[#f6edda]">{text.countdownTitle}</h2>
                    <div className="relative mx-auto mt-7 grid max-w-3xl grid-cols-4 sm:mt-10">
                        <span aria-hidden="true" className="absolute inset-x-[12.5%] top-[67%] h-px bg-gradient-to-r from-transparent via-[#c8ad76]/65 to-transparent" />
                        {(countdownParts || [null, null, null, null]).map((value, index) => {
                            const digits = value === null
                                ? "—"
                                : index === 0
                                    ? String(value)
                                    : String(value).padStart(2, "0");
                            return (
                                <div key={text.countdownUnits[index]} className="relative flex min-w-0 flex-col items-center px-0 sm:px-2">
                                    <p className="m05-foil m05-countdown-number whitespace-nowrap font-serif-elegant text-[clamp(1.5rem,9cqi,4rem)] tabular-nums">
                                        {locale === "km" && value !== null ? toKhmerDigits(digits, locale) : digits}
                                    </p>
                                    <span aria-hidden="true" className="relative z-10 mt-1 h-2 w-2 rotate-45 border border-[#e6ce98] bg-[#25281f] shadow-[0_0_12px_rgba(200,173,118,.18)]" />
                                    <p className="m05-khmer-safe m05-countdown-unit mt-2 font-khmer-moul text-[10px] text-[#e5d5b2] sm:mt-3 sm:text-xs">{text.countdownUnits[index]}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-3 sm:mt-9">
                        <span aria-hidden="true" className="h-px w-8 bg-[#c8ad76]/45 sm:w-16" />
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#c8ad76]" strokeWidth={1.4} aria-hidden="true" />
                        <p className="m05-khmer-safe font-kantumruy text-xs text-[#e7dec9] sm:text-sm">
                            {Number.isFinite(targetTime) ? formatNeaM05Date(new Date(targetTime), locale) : text.datePlaceholder}
                        </p>
                        <span aria-hidden="true" className="h-px w-8 bg-[#c8ad76]/45 sm:w-16" />
                    </div>
                </div>
            </section>

            {showTimeline && activities.length > 0 && <section id="m05-programme" className="relative overflow-hidden bg-[#25281f] px-5 py-16 text-[#f4ecdc] sm:px-8 sm:py-24">
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
                    style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%,color-mix(in srgb,var(--m05-foil) 9%,transparent),transparent 68%)" }}
                />
                <div className="m05-programme-layout relative mx-auto grid max-w-[1500px] gap-6 sm:gap-8">
                    <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-3 text-center">
                        <span aria-hidden="true" className="h-px w-8 bg-[#c8ad76]/55 sm:w-14" />
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#d9bd83]" strokeWidth={1.5} aria-hidden="true" />
                        <h2 className="m05-section-title m05-khmer-safe font-khmer-moul text-lg text-[#f4ecdc] sm:text-xl">
                            {locale === "km" ? "កម្មវិធី" : "Programme"}
                        </h2>
                        <span aria-hidden="true" className="h-px w-8 bg-[#c8ad76]/55 sm:w-14" />
                    </div>
                    <div className="m05-programme-list relative mx-auto w-full max-w-2xl pt-2 md:mx-0 md:pr-4 md:pt-0">
                        <svg aria-hidden="true" className="absolute bottom-8 left-5 top-0 h-[calc(100%-2rem)] w-px overflow-visible sm:left-6" viewBox="0 0 1 1000" preserveAspectRatio="none">
                            <path data-m05-thread="" d="M.5 0V1000" fill="none" stroke="url(#m05-programme-thread)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                            <defs>
                                <linearGradient id="m05-programme-thread" x1="0" y1="0" x2="0" y2="1">
                                    <stop stopColor="#f2dba7" />
                                    <stop offset=".7" stopColor="#b18d55" />
                                    <stop offset="1" stopColor="#b18d55" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {activities.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((activity, index) => (
                            <motion.article
                                key={`${activity.time}-${activity.title}`}
                                initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
                                whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.7, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
                                className="relative mb-3 grid grid-cols-[40px_1fr] gap-3 last:mb-0 sm:mb-5 sm:grid-cols-[48px_1fr] sm:gap-6"
                            >
                                <span
                                    className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#c7a86d] bg-[#25281f] text-[#ecd6a7] sm:h-12 sm:w-12"
                                    style={{ boxShadow: "0 0 18px color-mix(in srgb,var(--m05-foil) 18%,transparent)" }}
                                >
                                    <RitualIcon index={index} />
                                </span>
                                <div className="border-b border-[#ddc894]/20 pb-3 pt-0 sm:pb-4 sm:pt-1">
                                    <p className="m05-foil m05-khmer-safe font-khmer-moul text-xs tracking-[0.08em]">{activity.time}</p>
                                    <h3 className="m05-khmer-safe mt-0.5 font-khmer-moul text-base sm:mt-1 sm:text-lg">{activity.title}</h3>
                                    {activity.description && (
                                        <p className="m05-khmer-safe mt-0.5 font-kantumruy text-sm text-[#d2c7ae]/80 sm:mt-1">{activity.description}</p>
                                    )}
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>}

            {showLoveStory && hasLoveStoryContent && (
            <section id="m05-story" className="relative overflow-hidden bg-[#25281f] px-5 py-16 text-[#f4ecdc] [container-type:inline-size] sm:py-24">
                <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center">
                    <div className="mb-7 text-center">
                        <h2 className="m05-section-title m05-khmer-safe font-khmer-moul text-lg leading-[1.7] sm:text-2xl">{text.storyTitle}</h2>
                        <p className="m05-khmer-safe mt-2 font-kantumruy text-xs text-[#f0eadb]/80">{text.storyHint}</p>
                    </div>

                    {!isStoryBookOpen ? (
                        <motion.button
                            type="button"
                            onClick={() => setIsStoryBookOpen(true)}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex min-h-[340px] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-r-2xl rounded-l-md border border-[#c8ad76]/55 bg-gradient-to-br from-[#494235] via-[#302f27] to-[#1b201b] px-8 py-10 text-center shadow-[10px_16px_32px_rgba(0,0,0,.35),inset_8px_0_0_rgba(200,173,118,.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c47c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#25281f]"
                            aria-label={`${text.storyTitle} — បើកសៀវភៅ`}
                        >
                            <span aria-hidden="true" className="absolute inset-y-0 left-5 w-px bg-[#c8ad76]/45" />
                            <span aria-hidden="true" className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c8ad76]/50 bg-black/10 text-[#e8d4a8]">
                                <BookOpen className="h-8 w-8" strokeWidth={1.4} />
                            </span>
                            <span className="m05-foil m05-khmer-safe font-khmer-moul text-xl leading-[1.9] sm:text-2xl">{text.storyTitle}</span>
                            <span className="mt-3 font-kantumruy text-sm text-[#e8d8b4]">
                                {storyPages.length} {locale === "km" ? "ទំព័រ" : "pages"}
                            </span>
                            <span className="mt-8 rounded-full border border-[#c8ad76]/55 px-6 py-2.5 font-kantumruy text-sm text-[#f4ecdc] transition-colors group-hover:bg-white/10">
                                {locale === "km" ? "បើកអានរឿងរ៉ាវ" : "Open storybook"}
                            </span>
                        </motion.button>
                    ) : (
                        <div className="w-full max-w-xl overflow-hidden rounded-r-2xl rounded-l-md border border-[#c8ad76]/35 bg-[#f4efdf] text-[#40392c] shadow-[10px_16px_32px_rgba(0,0,0,.32),inset_8px_0_0_#e2d8c2]">
                            <div className="flex items-center justify-between border-b border-[#9b8055]/20 py-2 pl-8 pr-4">
                                <span className="font-kantumruy text-xs text-[#806a47]" aria-live="polite">
                                    {toKhmerDigits(currentStoryPageIndex + 1, locale)} / {toKhmerDigits(storyPages.length, locale)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsStoryBookOpen(false)}
                                    className="rounded-full p-2 text-[#704858] transition hover:bg-[#704858]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                    aria-label={locale === "km" ? "បិទសៀវភៅរឿងរ៉ាវ" : "Close storybook"}
                                >
                                    <X aria-hidden="true" className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="relative min-h-[360px] px-8 py-8 sm:min-h-[440px] sm:px-12 sm:py-10">
                                <span aria-hidden="true" className="absolute inset-y-0 left-5 w-px bg-[#9b8055]/20" />
                                <AnimatePresence mode="wait">
                                    <motion.article
                                        key={currentStoryPageIndex}
                                        initial={prefersReducedMotion ? false : { opacity: 0, x: 24, rotateY: -4 }}
                                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                        exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24, rotateY: 4 }}
                                        transition={{ duration: 0.22 }}
                                        className="flex min-h-[296px] flex-col justify-center"
                                    >
                                        {currentStoryPage?.type === "text" ? (
                                            <p className="m05-khmer-safe whitespace-pre-line break-words text-left font-kantumruy text-base leading-9 text-[#40392c] sm:text-lg sm:leading-10">
                                                {currentStoryPage.content}
                                            </p>
                                        ) : currentStoryPage?.type === "image" ? (
                                            <figure>
                                                <PhotoImage
                                                    src={currentStoryPage.src}
                                                    alt={`${text.storyPhotoAlt} ${toKhmerDigits(currentStoryPageIndex - storyTextPages.length + 1, locale)}`}
                                                    className="max-h-[54vh] min-h-[220px] w-full rounded-sm object-contain"
                                                    sizes="(max-width: 430px) 100vw, 430px"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                {currentStoryPage.caption && (
                                                    <figcaption className="m05-khmer-safe mt-4 text-center font-kantumruy text-sm leading-relaxed text-[#6b5b40]">
                                                        {currentStoryPage.caption}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        ) : currentStoryPage?.type === "ending" ? (
                                            <p className="m05-foil m05-khmer-safe text-center font-khmer-moul text-xl leading-[1.9] text-[#6b5b40] sm:text-2xl">
                                                {currentStoryPage.content}
                                            </p>
                                        ) : null}
                                    </motion.article>
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center justify-between border-t border-[#9b8055]/20 px-4 py-3 pl-8">
                                <button
                                    type="button"
                                    onClick={() => setStoryPageIndex((page) => Math.max(0, currentStoryPageIndex - 1))}
                                    disabled={currentStoryPageIndex === 0}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-kantumruy text-sm text-[#704858] transition hover:bg-[#704858]/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                >
                                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                                    {locale === "km" ? "មុន" : "Previous"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStoryPageIndex((page) => Math.min(storyPages.length - 1, currentStoryPageIndex + 1))}
                                    disabled={currentStoryPageIndex === storyPages.length - 1}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-kantumruy text-sm text-[#704858] transition hover:bg-[#704858]/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                                >
                                    {locale === "km" ? "បន្ទាប់" : "Next"}
                                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            )}

            <section id="m05-candlelight" className="relative isolate flex min-h-[720px] flex-col items-center justify-center overflow-hidden bg-[#171a16] px-5 py-14 text-[#f4ecdc] [container-type:inline-size] sm:min-h-[780px] sm:py-20">
                {candlePhoto && (
                    <img src={candlePhoto} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_20%]" loading="lazy" decoding="async" />
                )}
                {candlePhoto && <div className="m05-photo-tint pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />}
                <div
                    className="pointer-events-none absolute inset-0 -z-10"
                    style={{ backgroundImage: "linear-gradient(180deg,color-mix(in srgb,var(--m05-dark-surface) 70%,transparent) 0%,color-mix(in srgb,var(--m05-dark-surface) 12%,transparent) 38%,color-mix(in srgb,var(--m05-dark-surface) 62%,transparent) 68%,var(--m05-page-background) 100%)" }}
                />
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_38%,transparent_20%,rgba(10,9,7,.32)_100%)]" />
                <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
                    <h2 className="m05-section-title m05-khmer-safe mt-2 font-khmer-moul text-lg leading-[1.8] sm:text-2xl">{text.candleTitle}</h2>
                    <CoupleNamesLine groom={wedding.groomName} bride={wedding.brideName} separator="♡" className="m05-khmer-safe mt-4 font-moulpali text-[clamp(0.8rem,5cqi,1.5rem)] text-[#fff4d6] [text-shadow:0_2px_5px_rgba(0,0,0,.95),0_0_18px_rgba(0,0,0,.7)]" />
                </div>
                <button
                    type="button"
                    onClick={releaseFloatingLight}
                    aria-label={text.touchWater}
                    className="group absolute inset-0 z-0 flex h-full w-full touch-manipulation items-center justify-center overflow-hidden border-0 outline-none backdrop-blur-[0.5px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e4c47c]"
                    style={{ backgroundImage: "linear-gradient(180deg,color-mix(in srgb,var(--m05-dark-surface) 10%,transparent) 0%,color-mix(in srgb,var(--m05-foil) 16%,transparent) 52%,color-mix(in srgb,var(--m05-dark-surface) 48%,transparent) 100%)" }}
                >
                    <svg className="pointer-events-none absolute inset-0 h-full w-full text-[#d9e2ce]/20" viewBox="0 0 1440 780" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 345 C180 325 300 362 480 343 S780 326 960 345 1260 364 1440 340" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M0 370 C220 350 330 383 560 366 S860 350 1080 370 1300 383 1440 366" fill="none" stroke="currentColor" strokeOpacity=".65" strokeWidth=".8" />
                        <path d="M0 470 C200 452 340 488 540 468 S900 454 1100 474 1300 486 1440 468" fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth=".8" />
                        <path d="M0 560 C180 544 360 576 560 557 S900 543 1120 565 1320 575 1440 558" fill="none" stroke="currentColor" strokeOpacity=".4" strokeWidth=".7" />
                    </svg>
                    <span className="pointer-events-none absolute bottom-8 left-1/2 z-10 inline-flex w-[min(92%,42rem)] -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap text-center font-kantumruy text-[clamp(0.5rem,2.7cqi,0.875rem)] leading-7 text-[#f0eadb]/95 drop-shadow-[0_1px_8px_rgba(0,0,0,.9)] transition-colors group-hover:text-white">
                        <Sparkles size={13} aria-hidden="true" />
                        {text.candleHint}
                    </span>
                    {floatingLights.map((light) => (
                        <motion.span
                            key={light.id}
                            initial={{ opacity: 0, scale: 0.35, y: 12 }}
                            animate={prefersReducedMotion
                                ? { opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }
                                : { opacity: [0, 1, 0.9, 0], scale: [0.4, 1, 1.05, 0.8], y: [12, 0, -14, -32] }}
                            transition={{ duration: 4, ease: "easeOut" }}
                            onAnimationComplete={() => setFloatingLights((lights) => lights.filter(({ id }) => id !== light.id))}
                            style={{ left: `${light.x}%`, top: `${light.y}%` }}
                            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
                            aria-hidden="true"
                        >
                            <motion.span
                                initial={{ opacity: 0.75, scale: 0.35 }}
                                animate={{ opacity: 0, scale: 5 }}
                                transition={{ duration: 1.7, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f2dba7]/70"
                            />
                            <span className="absolute -inset-5 rounded-full bg-[#f7ce79]/25 blur-xl" />
                            <svg
                                viewBox="0 0 56 42"
                                className="relative h-12 w-14"
                                style={{ filter: "drop-shadow(0 0 12px color-mix(in srgb,var(--m05-foil) 80%,transparent))" }}
                            >
                                <path d="M28 37C16 37 7 32 4 24c8 1 13 4 18 9-3-8-2-14 6-21 8 7 9 13 6 21 5-5 10-8 18-9-3 8-12 13-24 13Z" fill="#b18d55" fillOpacity=".8" stroke="#f2dba7" strokeOpacity=".75" />
                                <ellipse cx="28" cy="30" rx="9" ry="4" fill="#f4d58d" />
                                <path d="M28 27c-5-5 3-8 1-13 8 6 2 9 4 13Z" fill="#fff0b0" />
                            </svg>
                        </motion.span>
                    ))}
                </button>
            </section>

            {showGallery && <section id="m05-gallery" className="relative overflow-hidden bg-[#25281f] px-4 py-20 text-[#f4ecdc] [container-type:inline-size] sm:px-6 sm:py-28">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: "radial-gradient(ellipse at 50% 25%,color-mix(in srgb,var(--m05-foil) 7%,transparent),transparent 55%)" }}
                />
                <div className="relative mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-12">
                        <span aria-hidden="true" className="h-px w-14 bg-gradient-to-r from-transparent via-[#c8ad76]/70 to-transparent" />
                        <h2 className="m05-section-title m05-khmer-safe max-w-full whitespace-nowrap font-khmer-moul text-[clamp(0.65rem,4.5cqi,1.5rem)] leading-relaxed">{wedding.themeSettings?.customLabels?.galleryTitle || wedding.themeSettings?.customLabels?.gallery_title || text.galleryTitle}</h2>
                        {visibleGallery.length > 0 && (
                            <span className="m05-foil inline-flex min-h-7 items-center rounded-full border border-[#c8ad76]/25 px-3 font-serif-elegant text-xs tracking-[0.16em] text-[#e8d8b4]" aria-label={`${visibleGallery.length} ${text.galleryPhotoAlt}`}>
                                {toKhmerDigits(String(visibleGallery.length).padStart(2, "0"), locale)}
                            </span>
                        )}
                    </div>
                    {visibleGallery.length > 0 ? (
                        <div className={galleryDisplayStyle === "masonry"
                            ? "m05-gallery-grid grid grid-cols-2 gap-2.5 sm:gap-4"
                            : getGalleryContainerClass(galleryDisplayStyle)}>
                            {visibleGallery.map((item, index) => (
                                <button
                                    key={`${item.url}-${index}`}
                                    type="button"
                                    onClick={() => setActiveImage(index)}
                                    className={`group relative block min-h-0 overflow-hidden rounded-xl border border-[#c8ad76]/20 bg-[#171a16] text-left shadow-[0_8px_24px_rgba(0,0,0,.18)] outline-none transition-colors hover:border-[#c8ad76]/55 focus-visible:ring-2 focus-visible:ring-[#e4c47c] ${galleryDisplayStyle === "masonry"
                                        ? `m05-gallery-card ${index === 0 ? "m05-gallery-featured" : index < 3 ? "m05-gallery-secondary" : "m05-gallery-standard"}`
                                        : galleryDisplayStyle === "polaroid" ? "aspect-square" : getGalleryCardClass(galleryDisplayStyle, index)}`}
                                    aria-label={`${text.openPhoto} ${toKhmerDigits(index + 1, locale)}`}
                                >
                                    <PhotoImage
                                        src={item.url}
                                        alt={`${text.galleryPhotoAlt} ${toKhmerDigits(index + 1, locale)}`}
                                        className={`${galleryDisplayStyle === "polaroid"
                                            ? "absolute inset-0 h-full w-full object-contain"
                                            : "absolute inset-0 h-full w-full object-contain"} p-1 transition-transform duration-500 group-hover:scale-[1.015]`}
                                        sizes="(max-width: 640px) 50vw, 400px"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-7 opacity-70 transition-opacity group-hover:opacity-100">
                                        <span className="font-serif-elegant text-[10px] tracking-[0.16em] text-white/90">{toKhmerDigits(String(index + 1).padStart(2, "0"), locale)}</span>
                                        <span className="font-kantumruy text-[10px] text-white/80">{text.openPhoto}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="m05-khmer-safe border border-dashed border-[#b89a60]/60 px-4 py-12 text-center font-kantumruy text-sm">{text.galleryPlaceholder}</p>
                    )}
                </div>
            </section>}

            {isSectionVisible(config, "map") && <section id="m05-venue" data-m05-reveal="" className="relative overflow-hidden bg-[#25281f] px-5 py-20 text-center text-[#f4ecdc] [container-type:inline-size] sm:py-28">
                <MapPin aria-hidden="true" className="relative mx-auto mb-4 h-7 w-7 text-[#d9bd83]" strokeWidth={1.4} />
                <p className="m05-foil m05-khmer-safe relative font-khmer-moul text-xs">{text.venueEyebrow}</p>
                <h2 className="m05-section-title m05-khmer-safe relative mt-2 font-khmer-moul text-lg sm:text-2xl">{wedding.themeSettings?.customLabels?.locationTitle || text.venueTitle}</h2>
                {wedding.themeSettings?.customLabels?.locationSubtitle && (
                    <p className="m05-khmer-safe relative mx-auto mt-2 max-w-xl font-kantumruy text-sm leading-relaxed text-[#e0d5bd]">
                        {wedding.themeSettings.customLabels.locationSubtitle}
                    </p>
                )}
                <div className="relative mx-auto mt-7 grid w-full max-w-2xl gap-5 rounded-2xl border border-[#c8ad76]/35 bg-black/10 p-5 text-left shadow-[0_18px_48px_rgba(0,0,0,.16)] sm:grid-cols-2 sm:gap-7 sm:p-7">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[#d9bd83]">
                            <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                            <p className="m05-khmer-safe m05-venue-copy font-khmer-moul text-xs">{text.venueAddressLabel}</p>
                        </div>
                        <p className="m05-khmer-safe m05-venue-copy mt-2 break-words font-kantumruy text-sm font-semibold leading-relaxed text-[#fff4dc] [overflow-wrap:anywhere] sm:text-base">
                            {wedding.locationName || wedding.location || text.venuePlaceholder}
                        </p>
                        {wedding.locationName && wedding.location && (
                            <p className="m05-khmer-safe m05-venue-copy mt-1 break-words font-kantumruy text-xs leading-relaxed text-[#e0d5bd]/85 [overflow-wrap:anywhere] sm:text-sm">{wedding.location}</p>
                        )}
                    </div>
                    <div className="min-w-0 border-t border-[#c8ad76]/25 pt-4 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
                        <div className="flex items-center gap-2 text-[#d9bd83]">
                            <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                            <p className="m05-khmer-safe m05-venue-copy font-khmer-moul text-xs">{text.eventDateLabel}</p>
                        </div>
                        <p className="m05-khmer-safe m05-venue-copy mt-2 break-words font-kantumruy text-sm font-semibold leading-relaxed text-[#fff4dc] [overflow-wrap:anywhere] sm:text-base">
                            {Number.isFinite(targetTime) ? formatVenueDate(new Date(targetTime), locale) : text.datePlaceholder}
                        </p>
                        {wedding.themeSettings?.lunarDate && (
                            <p className="m05-khmer-safe m05-venue-copy mt-1 break-words font-kantumruy text-xs leading-relaxed text-[#e0d5bd]/85 [overflow-wrap:anywhere] sm:text-sm">
                                <span className="text-[#d9bd83]">{text.lunarDateLabel}៖ </span>{wedding.themeSettings.lunarDate}
                            </p>
                        )}
                    </div>
                </div>
                <div className="relative mx-auto mt-5 flex w-full max-w-2xl flex-col justify-center gap-3 sm:flex-row">
                    <a
                        href={getDirectMapUrl(
                            wedding.themeSettings?.mapLink?.includes("google.com/maps/embed")
                                ? ""
                                : wedding.themeSettings?.mapLink || wedding.mapUrl,
                            [wedding.locationName, wedding.location].filter(Boolean).join(", "),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#c8ad76] px-5 py-3 font-kantumruy text-xs font-semibold text-[#25281f] shadow-sm transition hover:bg-[#d8c18e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3dfb5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#25281f]"
                    >
                        <MapPin size={15} aria-hidden="true" /> {text.openMap} <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    {Number.isFinite(targetTime) && (
                        <button
                            type="button"
                            onClick={() => {
                                const startDate = new Date(targetTime);
                                const endDate = new Date(startDate);
                                endDate.setDate(endDate.getDate() + 1);
                                downloadIcsFile({
                                    title: `${wedding.groomName} & ${wedding.brideName}`,
                                    description: wedding.themeSettings?.invitationText || text.formalTitle,
                                    location: wedding.locationName || wedding.location || "",
                                    startDate,
                                    endDate,
                                    allDay: true,
                                    fileName: "nea-m05-wedding.ics",
                                });
                            }}
                            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-[#c8ad76]/60 px-5 py-3 font-kantumruy text-xs font-medium text-[#f5e9ce] transition hover:bg-[#c8ad76]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3dfb5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#25281f]"
                        >
                            <CalendarDays size={15} aria-hidden="true" /> {text.saveCalendar}
                        </button>
                    )}
                </div>
                {venueMapEmbedUrl && (
                    <div className="relative mx-auto mt-5 aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#c8ad76]/40 bg-white shadow-[0_12px_32px_rgba(0,0,0,.2)]">
                        <iframe
                            title={`ផែនទីបង្ហាញទីតាំង ${wedding.locationName || wedding.location || "កម្មវិធី"}`}
                            src={venueMapEmbedUrl}
                            className="h-full w-full border-0"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                )}
            </section>}

            {isSectionVisible(config, "gift") && <section id="m05-gift" data-m05-reveal="" className="relative bg-[#25281f] px-5 py-20 text-center text-[#f4ecdc] sm:py-28">
                <div className="mx-auto max-w-5xl">
                    <Gift className="mx-auto h-8 w-8 text-[#a2824f]" strokeWidth={1.2} aria-hidden="true" />
                    <h2 className="m05-section-title m05-khmer-safe mt-3 font-khmer-moul text-lg sm:text-2xl">{wedding.themeSettings?.customLabels?.giftTitle || text.giftTitle}</h2>
                    <p className="m05-khmer-safe mx-auto mt-3 max-w-xl font-kantumruy text-sm text-[#e0d5bd]">{wedding.themeSettings?.customLabels?.giftSubtitle || text.giftIntro}</p>
                    {wedding.themeSettings?.customLabels?.giftBadge && (
                        <p className="m05-khmer-safe mx-auto mt-3 w-fit rounded-full border border-[#c8ad76]/40 px-3 py-1 font-kantumruy text-xs font-semibold text-[#d9bd83]">
                            {wedding.themeSettings.customLabels.giftBadge}
                        </p>
                    )}
                    <div className="mx-auto mt-8 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
                        {(wedding.themeSettings?.bankAccounts || []).map((account, index) => {
                            const qrSource = account.qrUrl || (wedding.themeSettings?.paymentQrUrl ?? "");
                            return (
                                <article key={`${account.bankName}-${index}`} className={`mx-auto w-full max-w-md border-b border-[#b89a60]/35 py-6 ${(wedding.themeSettings?.bankAccounts || []).length === 1 ? "sm:col-span-2" : ""}`}>
                                    <div className="mx-auto w-full max-w-[17rem]">
                                        <div className="m05-khqr-header flex h-11 items-center justify-center font-serif-elegant text-lg font-bold tracking-[0.08em] text-white">
                                            KHQR
                                        </div>
                                        <div className="bg-white px-3 pt-2 text-left text-[#202020]">
                                            <p className="m05-khmer-safe break-words font-kantumruy text-xs font-semibold [overflow-wrap:anywhere]">{account.accountName}</p>
                                            <div className="mx-auto flex aspect-square w-full max-w-52 items-center justify-center bg-white p-1">
                                                {qrSource ? (
                                                    <img src={qrSource} alt={`${account.bankName || "KHQR"} ${text.qrAlt}`} className="h-full w-full object-contain" loading="lazy" />
                                                ) : (
                                                    <span className="m05-khmer-safe px-4 font-kantumruy text-xs text-[#746a58]">{text.qrPlaceholder}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isApprovalPreview && qrSource.includes("/images/qr.webp") && (
                                        <p className="m05-khmer-safe mt-2 font-kantumruy text-[10px] text-[#d9bd83]">{text.demoQrNotice}</p>
                                    )}
                                    {qrSource && (
                                        <button
                                            type="button"
                                            onClick={() => void saveQr(qrSource, index)}
                                            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#a2824f] px-4 py-2 font-kantumruy text-xs text-[#f4ecdc] transition-colors hover:bg-[#a2824f]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9bd83]"
                                        >
                                            <Download size={14} aria-hidden="true" /> {text.saveQr}
                                        </button>
                                    )}
                                </article>
                            );
                        })}
                        {(wedding.themeSettings?.bankAccounts || []).length === 0 && (
                            <article className="py-6 sm:col-span-2">
                                <div className="mx-auto flex aspect-square w-48 items-center justify-center bg-white p-4">
                                    <span className="m05-khmer-safe font-kantumruy text-xs text-[#746a58]">{text.qrPlaceholder}</span>
                                </div>
                                <p className="m05-khmer-safe mt-3 font-kantumruy text-xs text-[#d9cfb9]">{text.qrMissing}</p>
                            </article>
                        )}
                    </div>
                    {downloadError && <p role="alert" className="m05-khmer-safe mt-4 font-kantumruy text-xs text-red-800">{text.qrDownloadError}</p>}
                </div>
            </section>}

            {isSectionVisible(config, "guestbook") && <GuestbookSection wedding={wedding} tone="dark" titleOneLine unboxed />}

            <section id="m05-thank-you" data-m05-reveal="" className="relative overflow-hidden bg-[#171a16] px-5 py-20 text-center text-[#f4ecdc] [container-type:inline-size] sm:py-28">
                <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "url('/khmer-invite-starter-kit/textures/paper-cream.webp')" }} />
                <div className="m05-thank-you-content relative mx-auto max-w-3xl">
                    <div aria-hidden="true" className="mx-auto mb-4 flex w-20 items-center justify-center gap-2 text-[#c8ad76]">
                        <span className="h-px flex-1 bg-current opacity-60" />
                        <Sparkles className="h-5 w-5" strokeWidth={1.2} />
                        <span className="h-px flex-1 bg-current opacity-60" />
                    </div>
                    <p className="m05-foil m05-khmer-safe font-khmer-moul text-2xl sm:text-3xl">{text.thankYouTitle}</p>
                    <p className="m05-khmer-safe mx-auto mt-4 max-w-xl font-kantumruy text-sm leading-[2] text-[#d9cfb9]">{wedding.themeSettings?.acknowledgment || text.thankYouMessage}</p>
                    <div className="mx-auto mt-12 h-px max-w-xs bg-gradient-to-r from-transparent via-[#b99b68]/75 to-transparent" />
                    <CoupleNamesLine groom={wedding.groomName} bride={wedding.brideName} separator="♡" className="m05-foil m05-khmer-safe mt-5 font-moulpali text-lg" />
                    <SocialLinksSection wedding={wedding} />
                    <MoneaFooterBrand className="mt-8 rounded-2xl bg-[#f7f1ea] px-4 py-2" />
                </div>
            </section>

            {showGallery && activeImage !== null && visibleGallery[activeImage] && typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={galleryDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={text.galleryViewer}
                        tabIndex={-1}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080908]/95 p-4 sm:p-8"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) setActiveImage(null);
                        }}
                        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
                        onTouchEnd={(event) => {
                            if (touchStartX.current === null) return;
                            const delta = event.changedTouches[0]?.clientX - touchStartX.current;
                            if (delta && Math.abs(delta) > 40) openGalleryImage(delta < 0 ? 1 : -1);
                            touchStartX.current = null;
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveImage(null)}
                            aria-label={text.closeViewer}
                            className="absolute right-4 top-4 z-20 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#f2dba7]/70 bg-[#171a16]/95 px-4 text-sm text-[#fff4d6] shadow-[0_4px_24px_rgba(0,0,0,.65)] transition-colors hover:bg-[#3a3425] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2dba7]"
                        >
                            <X size={19} aria-hidden="true" /> <span>{text.closeViewer}</span>
                        </button>
                        <button type="button" onClick={() => openGalleryImage(-1)} aria-label={text.previousPhoto} className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center border border-white/30 bg-black/30 text-white sm:left-6">
                            <ChevronLeft size={22} />
                        </button>
                        <motion.img
                            key={visibleGallery[activeImage].url}
                            initial={{ opacity: 0, scale: 0.985 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={visibleGallery[activeImage].url}
                            alt={`${text.galleryPhotoAlt} ${toKhmerDigits(activeImage + 1, locale)}`}
                            className="max-h-[86svh] max-w-[86vw] object-contain"
                            decoding="async"
                        />
                        <button type="button" onClick={() => openGalleryImage(1)} aria-label={text.nextPhoto} className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center border border-white/30 bg-black/30 text-white sm:right-6">
                            <ChevronRight size={22} />
                        </button>
                        <p className="absolute bottom-3 left-0 right-0 text-center font-kantumruy text-xs text-white/70">
                            {toKhmerDigits(activeImage + 1, locale)} / {toKhmerDigits(visibleGallery.length, locale)}
                        </p>
                    </motion.div>
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
}
