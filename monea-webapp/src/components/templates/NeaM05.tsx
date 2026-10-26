import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import copy from "@/i18n/nea-m05.json";
import { formatNeaM05Date, formatNeaM05DateParts } from "@/lib/nea-m05-date";
import { NEA_M05_COLOR_PRESETS } from "@/lib/nea-m05-colors";
import { getNeaM05FontStack } from "@/lib/nea-m05-fonts";
import NeaM05Sections from "./NeaM05Sections";
import type { TemplateProps } from "./types";
import { getWeddingHeroImage } from "./shared/weddingPhotos";
import { getTemplatePaperStyles } from "@/lib/template-color-palette";
import { OneLineName } from "./shared/OneLineName";

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Locale = keyof typeof copy;

gsap.registerPlugin(CustomEase, MotionPathPlugin, ScrollTrigger);
const m05ButterflyEase = CustomEase.create("m05Butterfly", "0.22, 1, 0.36, 1");
const m05FlapPath = "M2 2H538V58C538 64 535 69 530 73L270 268L10 73C5 69 2 64 2 58V2Z";

const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener("change", updatePreference);
        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, []);

    return prefersReducedMotion;
};

const getNeaM05CouplePhoto = (wedding: TemplateProps["wedding"]) => getWeddingHeroImage(wedding);

const getRgb = (hex: string) => {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!match) return [177, 141, 85];
    return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
};

const getRelativeLuminance = (hex: string) => {
    const [red, green, blue] = getRgb(hex).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const mixHex = (hex: string, target: number, amount: number) =>
    `#${getRgb(hex).map((channel) => Math.round(channel * (1 - amount) + target * amount).toString(16).padStart(2, "0")).join("")}`;

const blendHex = (first: string, second: string, amount: number) => {
    const firstRgb = getRgb(first);
    const secondRgb = getRgb(second);
    return `#${firstRgb.map((channel, index) => Math.round(channel * (1 - amount) + secondRgb[index] * amount).toString(16).padStart(2, "0")).join("")}`;
};

const ensureMinimumLuminance = (hex: string, minimum: number) => {
    if (getRelativeLuminance(hex) >= minimum) return hex;
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 12; iteration += 1) {
        const amount = (low + high) / 2;
        if (getRelativeLuminance(mixHex(hex, 255, amount)) >= minimum) high = amount;
        else low = amount;
    }
    return mixHex(hex, 255, high);
};

const ensureMaximumLuminance = (hex: string, maximum: number) => {
    if (getRelativeLuminance(hex) <= maximum) return hex;
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 12; iteration += 1) {
        const amount = (low + high) / 2;
        if (getRelativeLuminance(mixHex(hex, 0, amount)) <= maximum) high = amount;
        else low = amount;
    }
    return mixHex(hex, 0, high);
};

const getContrastRatio = (first: string, second: string) => {
    const [lighter, darker] = [getRelativeLuminance(first), getRelativeLuminance(second)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
};

const ensureContrastRatio = (foreground: string, background: string, minimum: number) => {
    if (getContrastRatio(foreground, background) >= minimum) return foreground;

    const candidates = [0, 255].map((target) => {
        let low = 0;
        let high = 1;
        for (let iteration = 0; iteration < 16; iteration += 1) {
            const amount = (low + high) / 2;
            const candidate = mixHex(foreground, target, amount);
            const meetsContrast = getContrastRatio(candidate, background) >= minimum;
            if (meetsContrast) high = amount;
            else low = amount;
        }
        return mixHex(foreground, target, high);
    });

    return candidates
        .filter((candidate) => getContrastRatio(candidate, background) >= minimum)
        .sort((a, b) => {
            const distance = (color: string) => getRgb(color).reduce(
                (sum, channel, index) => sum + (channel - getRgb(foreground)[index]) ** 2,
                0,
            );
            return distance(a) - distance(b);
        })[0] || "#ffffff";
};

const InvitationCardArtwork = ({
    wedding,
    title,
    englishTitle,
    groomPlaceholder,
    bridePlaceholder,
    cardClearedPocket,
    locale,
    invitedName,
    invitedHonorific,
    dateValue,
    venueValue,
}: {
    wedding: TemplateProps["wedding"];
    title: string;
    englishTitle: string;
    groomPlaceholder: string;
    bridePlaceholder: string;
    cardClearedPocket: boolean;
    locale: Locale;
    invitedName?: string;
    invitedHonorific: string;
    dateValue: string;
    venueValue?: string;
}) => (
    <div className="m05-card-artwork relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden text-center">
        {cardClearedPocket && (
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#fff6d8]/25 to-transparent blur-[1px]"
                initial={{ x: "-150%", opacity: 0 }}
                animate={{ x: "250%", opacity: [0, 0.35, 0] }}
                transition={{ duration: 1.25, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-[5px] border-x border-t border-[#b6a17b]/30" />
        <div className="m05-card-heading">
            <EnvelopeEmblem className="m05-card-crest mx-auto h-4 w-5" />
            <p className="m05-card-title m05-khmer-safe font-khmer-moul text-[10px] leading-[1.5] text-[#554832]">
                {title}
            </p>
            <p className="m05-card-subtitle font-pinyon-script text-[10px] text-[#9a7a43]">
                {englishTitle}
            </p>
        </div>
        <div className="m05-card-couple">
            <OneLineName name={wedding.groomName || groomPlaceholder} className="m05-card-couple-name flex-1 text-center" />
            <span className="m05-card-heart" aria-hidden="true">♡</span>
            <OneLineName name={wedding.brideName || bridePlaceholder} className="m05-card-couple-name flex-1 text-center" />
        </div>
        <div className="m05-card-info w-full max-w-[300px] font-kantumruy text-[8px] leading-[1.4] text-[#554832]">
            {invitedName && (
                <p className="m05-card-invite m05-khmer-safe text-center font-khmer-moul text-[9px] text-[#6f5125] sm:text-[10px]">
                    <span className="m05-card-invite-label">
                        {locale === "km" ? "សូមគោរពអញ្ជើញ" : "Cordially invited"}
                    </span>
                    <span className="m05-card-invite-name">{invitedHonorific ? `${invitedHonorific} ` : ""}{invitedName}</span>
                </p>
            )}
            <div className="m05-card-details">
                <div className="m05-card-detail-item">
                    <span className="m05-card-detail">{dateValue}</span>
                </div>
                {venueValue && (
                    <div className="m05-card-detail-item">
                        <span className="m05-card-detail">{venueValue}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const EnvelopeEmblem = ({ className = "" }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={`${className} text-[#9a7a43]`} fill="none">
        <path d="M20 2 38 20 20 38 2 20 20 2Z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M20 9 31 20 20 31 9 20 20 9Z" stroke="currentColor" strokeWidth="1" />
        <path d="M20 14 26 20 20 26 14 20 20 14Z" fill="currentColor" />
    </svg>
);

const CornerScroll = ({
    className = "",
    mirror = false,
}: {
    className?: string;
    mirror?: boolean;
}) => (
    <svg aria-hidden="true" className={className} viewBox="0 0 160 160">
        <g transform={mirror ? "translate(160 160) scale(-1 -1)" : undefined}>
            <image href="/khmer-invite-starter-kit/elements/corner.svg" width="160" height="160" />
        </g>
    </svg>
);

const NameMark = ({
    groom,
    bride,
    groomPlaceholder,
    bridePlaceholder,
    oneLine = false,
}: {
    groom?: string;
    bride?: string;
    groomPlaceholder: string;
    bridePlaceholder: string;
    oneLine?: boolean;
}) => {
    const butterflyRef = useRef<HTMLImageElement>(null);
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        const butterfly = butterflyRef.current;
        if (!butterfly) return;
        if (reducedMotion) {
            gsap.set(butterfly, { opacity: 0.9, x: 0, y: -2, rotation: 6 });
            return () => gsap.set(butterfly, { clearProps: "all" });
        }

        gsap.set(butterfly, { opacity: 0, x: -8, y: 5, rotation: -12, transformOrigin: "50% 50%" });
        const tween = gsap.to(butterfly, {
            opacity: 0.9,
            duration: 1.2,
            delay: 0.75,
            ease: m05ButterflyEase,
            motionPath: {
                path: [{ x: -8, y: 5 }, { x: -3, y: -5 }, { x: 0, y: -2 }],
                curviness: 1.2,
                autoRotate: false,
            },
        });
        return () => {
            tween.kill();
            gsap.set(butterfly, { clearProps: "all" });
        };
    }, [reducedMotion]);

    return (
        <div className={`m05-name-mark relative mx-auto flex w-full max-w-[340px] flex-col items-center text-center${oneLine ? " m05-name-mark-inline [container-type:inline-size]" : ""}`}>
            <div className="m05-name-crest-wrap relative mb-1 flex h-10 w-14 items-center justify-center sm:h-12 sm:w-16">
                <span className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#c5a15e]/55 to-transparent" />
                <EnvelopeEmblem className="m05-name-crest relative h-8 w-10 drop-shadow-[0_1px_1px_rgba(92,62,20,.25)] sm:h-9 sm:w-12" />
            </div>
            <div className={oneLine ? "m05-name-couple-row flex w-full min-w-0 items-center justify-center gap-1 whitespace-nowrap" : "contents"}>
                <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.75, delay: 0.12 }}
                    className={`m05-name-line m05-foil font-moulpali text-base leading-[2.1] sm:text-lg${oneLine ? " m05-name-inline min-w-0 flex-1 whitespace-nowrap text-right text-[clamp(8px,4.7cqi,16px)]" : ""}`}
                >
                    {groom?.trim() || groomPlaceholder}
                </motion.span>
                {oneLine && <span aria-hidden="true" className="shrink-0 font-moulpali text-[clamp(9px,4.7cqi,16px)] text-[var(--m05-foil)]">♡</span>}
                <motion.span
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.75, delay: 0.3 }}
                    className={`m05-name-line m05-foil font-moulpali text-base leading-[2.1] sm:text-lg${oneLine ? " m05-name-inline min-w-0 flex-1 whitespace-nowrap text-left text-[clamp(8px,4.7cqi,16px)]" : ""}`}
                >
                    {bride?.trim() || bridePlaceholder}
                </motion.span>
            </div>
            <div className="m05-name-flourish relative my-1 flex h-7 w-56 items-center justify-center text-[var(--m05-foil)]" aria-hidden="true">
                <motion.svg
                    viewBox="0 0 240 32"
                    className="absolute inset-0 h-full w-full overflow-visible"
                    initial={{ opacity: 0, scaleX: 0.72 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    <path d="M4 16h69c11 0 12-9 22-9 5 0 8 3 8 7m-99 2c11 0 15 8 26 8 10 0 13-8 23-8m139 0h-69c-11 0-12-9-22-9-5 0-8 3-8 7m99 2c-11 0-15 8-26 8-10 0-13-8-23-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.05" />
                    <path d="M9 12h47m118 0h47" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity=".6" strokeWidth=".6" />
                    <circle cx="69" cy="16" r="1.2" fill="currentColor" />
                    <circle cx="171" cy="16" r="1.2" fill="currentColor" />
                </motion.svg>
                {!oneLine && <motion.span
                    initial={{ scale: 0, y: 4, rotate: -12 }}
                    animate={{ scale: 1, y: 0, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.75 }}
                    className="relative flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--m05-name-mark-bg,#f4ecdc)] shadow-[0_1px_4px_rgba(107,76,29,.12)]"
                    style={{ borderColor: "var(--m05-foil)", color: "var(--m05-foil)" }}
                >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M12 20.2 4.1 12.7C-.7 7.6 6.1 1.1 12 6.2c5.9-5.1 12.7 1.4 7.9 6.5L12 20.2Z" />
                    </svg>
                </motion.span>}
                <img
                    ref={butterflyRef}
                    aria-hidden="true"
                    src="/khmer-invite-starter-kit/elements/butterfly.svg"
                    alt=""
                    className="absolute right-[14%] top-0 h-4 w-4 opacity-0 drop-shadow-[0_1px_1px_rgba(92,62,20,.3)]"
                />
            </div>
        </div>
    );
};

const WaxSeal = ({
    stage,
    onOpen,
    label,
    reducedMotion,
    color,
}: {
    stage: Stage;
    onOpen: () => void;
    label: string;
    reducedMotion: boolean;
    color: string;
}) => (
    <div className="absolute left-1/2 top-[69%] z-[60] grid -translate-x-1/2 -translate-y-1/2 place-items-center">
        <motion.button
            type="button"
            aria-label={label}
            disabled={stage !== 0}
            onClick={onOpen}
            initial={false}
            animate={
                stage === 1
                    ? { scale: 0.82, y: 3, rotate: -3, filter: "drop-shadow(0 2px 3px rgba(34,24,13,.24))" }
                    : stage >= 2
                        ? { x: ["0vw", "1vw", "2vw"], y: ["0vh", "1vh", "3vh"], rotate: [0, 4, 8], scale: [1, 0.94, 0.82], opacity: [1, 0.9, 0], filter: "drop-shadow(0 8px 9px rgba(12,9,5,.3))" }
                        : { scale: 1, y: 0, rotate: 0, opacity: 1, filter: "drop-shadow(0 0 8px rgba(205,157,72,.22)) drop-shadow(0 8px 9px rgba(34,24,13,.3))" }
            }
            transition={stage === 1
                ? { duration: reducedMotion ? 0.4 : 0.95, ease: [0.2, 0.7, 0.25, 1] }
                : { duration: reducedMotion ? 0.65 : 1.2, ease: [0.7, 0, 0.3, 1] }}
            className="relative flex items-center justify-center disabled:cursor-default"
            style={{ width: "clamp(48px, 14vw, 76px)", height: "clamp(48px, 14vw, 76px)" }}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,218,145,.14)_0%,rgba(220,171,82,.06)_42%,transparent_72%)] blur-[4px]"
            />
            <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(ellipse,rgba(255,228,174,.16),transparent_68%)] blur-[2px]"
                animate={stage === 0 && !reducedMotion ? { opacity: [0.45, 0.72, 0.45], scale: [0.98, 1.03, 0.98] } : { opacity: stage === 0 ? 0.55 : 0, scale: 1 }}
                transition={stage === 0 && !reducedMotion ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : { duration: reducedMotion ? 0.12 : 0.35 }}
            />
            <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2"
                style={{
                    borderColor: mixHex(color, 255, 0.52),
                    backgroundColor: color,
                    backgroundImage: "radial-gradient(circle at 32% 26%,rgba(255,246,218,.48),rgba(255,227,166,.08) 38%,transparent 72%)",
                    boxShadow: "inset 0 2px 4px rgba(255,255,255,.24),inset 0 -5px 8px rgba(20,14,7,.28),0 2px 4px rgba(24,17,8,.2)",
                }}
            />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[5px] rounded-full border"
                style={{ borderColor: mixHex(color, 255, 0.62), opacity: 0.65 }}
            />
            <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                className="relative z-10 h-[52%] w-[52%] drop-shadow-[0_1px_1px_rgba(30,20,8,.38)]"
                fill="none"
                stroke={mixHex(color, 255, 0.76)}
                strokeWidth="2"
            >
                <path d="M50 18 82 50 50 82 18 50 50 18Z" />
                <path d="M50 32 68 50 50 68 32 50 50 32Z" />
                <path d="M50 42 58 50 50 58 42 50 50 42Z" fill={mixHex(color, 255, 0.76)} />
                <circle cx="50" cy="11" r="2" fill="currentColor" stroke="none" />
                <circle cx="89" cy="50" r="2" fill="currentColor" stroke="none" />
                <circle cx="50" cy="89" r="2" fill="currentColor" stroke="none" />
                <circle cx="11" cy="50" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className="sr-only">{label}</span>
        </motion.button>
    </div>
);

const InvitationEnvelope = ({
    wedding,
    invitedName,
    invitedHonorific,
    invitedGuestLabel,
    locale,
    dateValue,
    venueValue,
    groomPlaceholder,
    bridePlaceholder,
    title,
    englishTitle,
    hint,
    stage,
    onOpen,
    onCardFullyExtracted,
    onCardRevealComplete,
    reducedMotion,
    backgroundImage,
    sealColor,
}: {
    wedding: TemplateProps["wedding"];
    invitedName?: string;
    invitedHonorific: string;
    invitedGuestLabel: string;
    locale: Locale;
    dateValue: string;
    venueValue?: string;
    groomPlaceholder: string;
    bridePlaceholder: string;
    title: string;
    englishTitle: string;
    hint: string;
    stage: Stage;
    onOpen: () => void;
    onCardFullyExtracted: () => void;
    onCardRevealComplete: () => void;
    reducedMotion: boolean;
    backgroundImage?: string;
    sealColor: string;
}) => {
    const image = backgroundImage;
    const flapOpen = stage >= 3;
    const [cardExtracting, setCardExtracting] = useState(false);
    const [cardPullingClear, setCardPullingClear] = useState(false);
    const [cardClearedPocket, setCardClearedPocket] = useState(false);
    const [cardFullyExtracted, setCardFullyExtracted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [cardExitOrigin, setCardExitOrigin] = useState<{
        left: number;
        top: number;
        width: number;
        height: number;
    } | null>(null);
    const cardOut = stage >= 4;
    const leaving = stage >= 5;
    const [flapBehindCard, setFlapBehindCard] = useState(false);
    // Add ~160 px so the envelope body (≈ 320 px tall) travels fully below the viewport
    const envelopeExitY = typeof window === "undefined" ? 0 : window.innerHeight + 160;
    const envelopeExitDuration = reducedMotion ? 1.5 : 2.2;

    useEffect(() => {
        if (stage !== 3) {
            setFlapBehindCard(stage >= 4);
            setCardExtracting(stage >= 4);
            if (stage >= 5) {
                setCardPullingClear(true);
                setCardClearedPocket(true);
                setCardFullyExtracted(true);
                return;
            }
            return;
        }
        setFlapBehindCard(false);
        setCardExtracting(false);
    }, [stage]);

    const cardRevealDuration = envelopeExitDuration;
    const cardCoverScale = cardExitOrigin
        ? Math.min(
            1.2,
            (window.innerWidth * 0.9) / cardExitOrigin.width,
            (window.innerHeight * 0.72) / cardExitOrigin.height,
        )
        : 1;

    const leavingCard = leaving && cardExitOrigin ? (
        <motion.div
            className="pointer-events-none fixed z-[90] flex flex-col items-center justify-center overflow-hidden             border border-[#d0c3a8]/80 px-3 py-5"
            initial={{
                left: cardExitOrigin.left,
                top: cardExitOrigin.top,
                width: cardExitOrigin.width,
                height: cardExitOrigin.height,
                scale: 1,
                opacity: 1,
            }}
            animate={{
                x: (window.innerWidth - cardExitOrigin.width) / 2 - cardExitOrigin.left,
                y: (window.innerHeight - cardExitOrigin.height) / 2 - cardExitOrigin.top,
                scale: cardCoverScale,
            }}
            transition={{
                duration: cardRevealDuration,
                ease: [0.4, 0, 0.2, 1],
            }}
            onAnimationComplete={onCardRevealComplete}
            exit={{
                opacity: 0,
                scale: cardCoverScale * 1.02,
                transition: {
                    duration: reducedMotion ? 0.35 : 0.6,
                    ease: [0.4, 0, 0.2, 1],
                },
            }}
            style={{
                transformOrigin: "center center",
                backgroundColor: "var(--m05-card-surface)",
                backgroundImage: "linear-gradient(145deg,rgba(255,255,255,.2),rgba(255,255,255,0) 42%,color-mix(in srgb,var(--m05-foil) 4%,transparent)),var(--monea-paper-texture)",
                backgroundSize: "100% 100%,320px",
                backgroundBlendMode: "normal,multiply",
                boxShadow: "0 1px 2px rgba(255,255,255,.32) inset, 0 -1px 2px rgba(109,82,43,.08) inset, 0 18px 38px rgba(9,8,6,.34)",
                willChange: "transform",
                "--m05-name-mark-bg": "#fffdf8",
            } as React.CSSProperties}
        >
            <InvitationCardArtwork
                wedding={wedding}
                title={title}
                englishTitle={englishTitle}
                groomPlaceholder={groomPlaceholder}
                bridePlaceholder={bridePlaceholder}
                cardClearedPocket={true}
                locale={locale}
                invitedName={invitedName}
                invitedHonorific={invitedHonorific}
                dateValue={dateValue}
                venueValue={venueValue}
            />
        </motion.div>
    ) : null;

    return (
        <MotionConfig reducedMotion="never">
        <motion.section
            aria-label={englishTitle}
            className="fixed inset-0 z-50 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#17130f] px-4 pb-10 pt-20 text-center text-[#f7f0e3] md:px-8 md:py-8"
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.35 : 0.6, ease: [0.4, 0, 0.2, 1] }}
            exit={{ opacity: 0, scale: 1 }}
        >
            {image ? (
                <>
                    <img
                        src={image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-105 object-cover brightness-[.42] saturate-[.8]"
                    />
                    <div className="m05-photo-tint pointer-events-none absolute inset-0" aria-hidden="true" />
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: "linear-gradient(180deg,rgba(17,15,12,.58),rgba(20,17,13,.68)),radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--m05-foil) 15%,transparent),transparent 68%)",
                        }}
                    />
                </>
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--m05-envelope-light) 36%,#17130f) 0%,color-mix(in srgb,var(--m05-envelope) 28%,#17130f) 38%,var(--m05-page-background) 80%)",
                    }}
                />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_34%,rgba(10,8,6,.42)_100%)]" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.09]"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />
            <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center">
                <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="m05-khmer-safe font-khmer-moul text-sm leading-[1.9] text-[#f2e4c5] sm:text-base md:text-lg"
                >
                    {title}
                </motion.p>
                <p className="mt-1 font-pinyon-script text-base text-[#d0bb91] sm:text-lg md:text-xl">
                    {englishTitle}
                </p>

                <motion.div
                    animate={reducedMotion || stage !== 0 ? { y: 0, rotateX: 0, rotateY: 0 } : { y: [0, -4, 0], rotateX: [0, 1, 0], rotateY: [0, -1, 0] }}
                    transition={reducedMotion || stage !== 0
                        ? { duration: 0.4 }
                        : { y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotateY: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
                    onPointerMove={(event) => {
                        if (stage !== 0 || reducedMotion) return;
                        const rect = event.currentTarget.getBoundingClientRect();
                        const x = (event.clientX - rect.left) / rect.width - 0.5;
                        const y = (event.clientY - rect.top) / rect.height - 0.5;
                        event.currentTarget.style.setProperty("--m05-tilt-x", `${-y * 4}deg`);
                        event.currentTarget.style.setProperty("--m05-tilt-y", `${x * 5}deg`);
                    }}
                    onPointerLeave={(event) => {
                        event.currentTarget.style.setProperty("--m05-tilt-x", "0deg");
                        event.currentTarget.style.setProperty("--m05-tilt-y", "0deg");
                    }}
                    className="relative mt-6 aspect-[540/326] w-[min(88vw,520px)] [perspective:1800px] md:mt-8 md:w-[min(72vw,680px)]"
                    style={{ transformStyle: "preserve-3d" }}
                    transformTemplate={(_latest, generated) =>
                        `rotateX(var(--m05-tilt-x, 0deg)) rotateY(var(--m05-tilt-y, 0deg)) ${generated}`
                    }
                >
                    <div
                        className="absolute inset-0 rounded-[3px] border border-[#d5c49d]/45 shadow-[0_36px_48px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,250,227,.36),inset_0_-2px_4px_rgba(24,29,21,.2)] [transform-style:preserve-3d]"
                        style={{
                            backgroundColor: "var(--m05-envelope)",
                            backgroundImage: "linear-gradient(145deg,color-mix(in srgb,var(--m05-envelope-light) 16%,transparent),transparent 32%,color-mix(in srgb,var(--m05-dark-surface) 20%,transparent)),url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                            backgroundSize: "auto,320px",
                            backgroundBlendMode: "soft-light, multiply",
                            transform: `translateY(${leaving ? envelopeExitY : 0}px)`,
                            transition: leaving
                                ? `transform ${envelopeExitDuration}s cubic-bezier(0.4,0,0.2,1)`
                                : "transform 0.4s ease",
                        }}
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-[2px] z-10 rounded-[1px]"
                            style={{
                                backgroundColor: "var(--m05-envelope)",
                                backgroundImage: "linear-gradient(180deg,color-mix(in srgb,var(--m05-envelope-light) 12%,transparent),color-mix(in srgb,var(--m05-dark-surface) 16%,transparent)),url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                                backgroundSize: "auto,320px",
                                backgroundBlendMode: "soft-light,multiply",
                            }}
                        />
                        <motion.div
                            ref={cardRef}
                            className={`${leaving ? "invisible" : ""} absolute left-[10%] top-[5%] ${cardExtracting || cardPullingClear || cardClearedPocket || cardFullyExtracted ? "z-50" : "z-20"} flex h-[90%] w-[80%] flex-col items-center justify-center border border-b-0 border-[#d0c3a8]/80 px-3 py-5 shadow-[0_1px_1px_rgba(255,255,255,.08),0_2px_4px_rgba(0,0,0,.14),0_10px_20px_rgba(0,0,0,.22)]`}
                            animate={cardOut || cardPullingClear
                                ? { y: "-75%", x: 0, rotate: 0, rotateX: 0, scale: 1.06, opacity: 1, boxShadow: "0 2px 3px rgba(67,49,27,.14), 0 26px 38px rgba(12,9,6,.36)" }
                                : cardExtracting
                                    ? { y: "-36%", x: 0, rotate: 0, rotateX: 0, scale: 1, opacity: 1, boxShadow: "0 2px 4px rgba(67,49,27,.16), 0 14px 22px rgba(12,9,6,.26)" }
                                    : { y: "0%", x: 0, rotate: 0, rotateX: 0, scale: 1, opacity: 1, boxShadow: "0 1px 1px rgba(255,255,255,.12), 0 2px 4px rgba(0,0,0,.18), 0 12px 22px rgba(0,0,0,.28)" }}
                            transition={{
                                duration: reducedMotion
                                    ? cardPullingClear ? 0.85 : cardExtracting ? 0.7 : 0.25
                                    : cardPullingClear ? 1.25 : cardExtracting ? 1.5 : 0.3,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{
                                transformOrigin: "center bottom",
                                backgroundColor: "var(--m05-card-surface)",
                                backgroundImage: "linear-gradient(145deg,rgba(255,255,255,.2),rgba(255,255,255,0) 42%,color-mix(in srgb,var(--m05-foil) 4%,transparent)),var(--monea-paper-texture)",
                                backgroundSize: "100% 100%,320px",
                                backgroundBlendMode: "normal,multiply",
                                boxShadow: "0 1px 2px rgba(255,255,255,.32) inset, 0 -1px 2px rgba(109,82,43,.08) inset, 0 2px 4px rgba(0,0,0,.14), 0 12px 24px rgba(9,8,6,.22)",
                                "--m05-name-mark-bg": "#fffdf8",
                            } as React.CSSProperties}
                            onAnimationComplete={() => {
                                if (stage !== 3 || !cardExtracting) return;
                                if (!cardPullingClear) {
                                    setCardPullingClear(true);
                                    return;
                                }
                                if (cardFullyExtracted) return;
                                const rect = cardRef.current?.getBoundingClientRect();
                                if (!rect) return;
                                setCardExitOrigin({
                                    left: rect.left,
                                    top: rect.top,
                                    width: rect.width,
                                    height: rect.height,
                                });
                                setCardClearedPocket(true);
                                setCardFullyExtracted(true);
                                onCardFullyExtracted();
                            }}
                        >
                            <InvitationCardArtwork
                                wedding={wedding}
                                title={title}
                                englishTitle={englishTitle}
                                groomPlaceholder={groomPlaceholder}
                                bridePlaceholder={bridePlaceholder}
                                cardClearedPocket={cardClearedPocket}
                                locale={locale}
                                invitedName={invitedName}
                                invitedHonorific={invitedHonorific}
                                dateValue={dateValue}
                                venueValue={venueValue}
                            />
                        </motion.div>

                        <div className="absolute inset-0 z-30 overflow-hidden rounded-[2px]">
                            <div
                                className="absolute inset-0"
                                style={{
                                    clipPath: "polygon(0 0, 50% 69%, 0 100%)",
                                    backgroundColor: "var(--m05-envelope)",
                                    backgroundImage: "linear-gradient(140deg,color-mix(in srgb,var(--m05-envelope-light) 24%,transparent),color-mix(in srgb,var(--m05-envelope-light) 3%,transparent) 46%,color-mix(in srgb,var(--m05-dark-surface) 18%,transparent)),url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                                    backgroundSize: "auto,320px",
                                    backgroundBlendMode: "soft-light, multiply",
                                    filter: "drop-shadow(0 2px 3px rgba(11,16,10,.24)) drop-shadow(0 5px 8px rgba(8,11,7,.12))",
                                }}
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    clipPath: "polygon(100% 0, 50% 69%, 100% 100%)",
                                    backgroundColor: "var(--m05-envelope)",
                                    backgroundImage: "linear-gradient(220deg,color-mix(in srgb,var(--m05-envelope-light) 23%,transparent),color-mix(in srgb,var(--m05-envelope-light) 2%,transparent) 48%,color-mix(in srgb,var(--m05-dark-surface) 20%,transparent)),url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                                    backgroundSize: "auto,320px",
                                    backgroundBlendMode: "soft-light, multiply",
                                    filter: "drop-shadow(0 2px 3px rgba(11,16,10,.24)) drop-shadow(0 5px 8px rgba(8,11,7,.12))",
                                }}
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    clipPath: "polygon(0 34%, 50% 69%, 100% 34%, 100% 100%, 0 100%)",
                                    backgroundColor: "var(--m05-envelope)",
                                    backgroundImage: "linear-gradient(180deg,color-mix(in srgb,var(--m05-envelope-light) 21%,transparent),color-mix(in srgb,var(--m05-envelope-light) 4%,transparent) 18%,color-mix(in srgb,var(--m05-dark-surface) 6%,transparent) 72%,color-mix(in srgb,var(--m05-dark-surface) 20%,transparent)),url('/khmer-invite-starter-kit/textures/paper-cream.webp')",
                                    backgroundSize: "auto,320px",
                                    backgroundBlendMode: "soft-light, multiply",
                                    filter: "drop-shadow(0 3px 4px rgba(11,16,10,.28)) drop-shadow(0 7px 10px rgba(8,11,7,.16))",
                                }}
                            />
                            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 540 326" preserveAspectRatio="none" aria-hidden="true">
                                <defs>
                                    <linearGradient id="m05-pocket-edge" x1="0" y1="0" x2="0" y2="1">
                                        <stop stopColor="var(--m05-dark-surface)" stopOpacity=".4" />
                                        <stop offset=".48" stopColor="var(--m05-dark-surface)" stopOpacity=".08" />
                                        <stop offset="1" stopColor="var(--m05-foil-highlight)" stopOpacity=".28" />
                                    </linearGradient>
                                    <filter id="m05-pocket-crease" x="-10%" y="-30%" width="120%" height="160%">
                                        <feGaussianBlur stdDeviation="3" />
                                    </filter>
                                </defs>
                                <path d="M0 111 270 225 540 111" fill="none" stroke="var(--m05-dark-surface)" strokeOpacity=".28" strokeWidth="9" filter="url(#m05-pocket-crease)" />
                                <path d="M0 112 270 226 540 112" fill="none" stroke="var(--m05-dark-surface)" strokeOpacity=".22" strokeWidth="2" />
                                <path d="M0 111 270 225 540 111" fill="none" stroke="url(#m05-pocket-edge)" strokeOpacity=".76" strokeWidth="1.4" />
                                <path d="M0 108 270 222 540 108" fill="none" stroke="var(--m05-foil-highlight)" strokeOpacity=".36" strokeWidth=".8" />
                                <path d="M0 0 270 225 0 326M540 0 270 225 540 326" fill="none" stroke="var(--m05-dark-surface)" strokeOpacity=".18" strokeWidth="7" filter="url(#m05-pocket-crease)" />
                                <path d="M0 0 270 225 0 326M540 0 270 225 540 326" fill="none" stroke="var(--m05-dark-surface)" strokeOpacity=".12" strokeWidth="1" />
                                <path d="M0 0 270 225 0 326M540 0 270 225 540 326" fill="none" stroke="var(--m05-foil-highlight)" strokeOpacity=".2" strokeWidth=".7" />
                            </svg>
                        </div>

                        <motion.div
                            className={`absolute inset-x-0 top-0 h-[72%] ${flapBehindCard ? "z-[10]" : "z-40"}`}
                            animate={{ rotateX: flapOpen ? 180 : 0 }}
                            transition={{ duration: flapOpen ? (reducedMotion ? 1.25 : 2.8) : 0.4, ease: flapOpen ? [0.42, 0, 0.58, 1] : [0.76, 0, 0.24, 1] }}
                            onAnimationComplete={() => {
                                if (!flapOpen || stage !== 3) return;
                                setFlapBehindCard(true);
                                setCardExtracting(true);
                            }}
                            style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
                        >
                            <svg
                                className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_7px_8px_rgba(32,24,13,.3)]"
                                viewBox="0 0 540 280"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                                style={{ backfaceVisibility: "hidden" }}
                            >
                                <path d={m05FlapPath} fill="url(#m05-flap-stock)" />
                                <path d={m05FlapPath} fill="var(--m05-envelope)" fillOpacity=".42" />
                                <path d={m05FlapPath} fill="url(#m05-flap-light)" />
                                <path d="M2 58C2 64 5 69 10 73L270 268L530 73C535 69 538 64 538 58" fill="none" stroke="var(--m05-foil-shade)" strokeOpacity=".52" strokeWidth="1.8" />
                                <path d="M3 58C3 63 6 67 11 71L270 266L529 71C534 67 537 63 537 58" fill="none" stroke="var(--m05-foil-highlight)" strokeOpacity=".26" strokeWidth=".8" />
                                <defs>
                                    <pattern id="m05-flap-stock" patternUnits="userSpaceOnUse" width="180" height="180">
                                        <image href="/khmer-invite-starter-kit/textures/paper-cream.webp" width="180" height="180" preserveAspectRatio="none" />
                                    </pattern>
                                    <linearGradient id="m05-flap-light" x1="0" y1="0" x2="1" y2="1">
                                        <stop stopColor="var(--m05-foil-highlight)" stopOpacity=".25" />
                                        <stop offset=".48" stopColor="var(--m05-envelope-light)" stopOpacity=".08" />
                                        <stop offset="1" stopColor="var(--m05-envelope)" stopOpacity=".33" />
                                    </linearGradient>
                                    <linearGradient id="m05-flap-front" x1="0" y1="0" x2="1" y2="1">
                                        <stop stopColor="var(--m05-envelope-light)" />
                                        <stop offset=".55" stopColor="var(--m05-envelope)" />
                                        <stop offset="1" stopColor="var(--m05-dark-surface)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div
                                className="m05-flap-name absolute inset-x-[10%] top-[2%] flex h-[63%] items-center justify-center"
                                style={{ "--m05-name-mark-bg": "transparent", backfaceVisibility: "hidden" } as React.CSSProperties}
                            >
                                <NameMark
                                    groom={wedding.groomName}
                                    bride={wedding.brideName}
                                    groomPlaceholder={groomPlaceholder}
                                    bridePlaceholder={bridePlaceholder}
                                />
                            </div>
                            <motion.div
                                className="absolute inset-0 overflow-hidden"
                                style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
                            >
                                <svg className="h-full w-full" viewBox="0 0 540 280" preserveAspectRatio="none" aria-hidden="true">
                                    <defs>
                                        <pattern id="m05-flap-lining" patternUnits="userSpaceOnUse" width="180" height="180">
                                            <image href="/khmer-invite-starter-kit/textures/paper-lining.webp" width="180" height="180" preserveAspectRatio="none" />
                                        </pattern>
                                        <linearGradient id="m05-lining-light" x1="0" y1="0" x2="0" y2="1">
                                            <stop stopColor="#fff8e9" stopOpacity=".34" />
                                            <stop offset=".68" stopColor="#f3e7d1" stopOpacity=".02" />
                                            <stop offset="1" stopColor="#9c7f58" stopOpacity=".24" />
                                        </linearGradient>
                                    </defs>
                                    <g transform="translate(0 280) scale(1 -1)">
                                        <path d={m05FlapPath} fill="url(#m05-flap-lining)" />
                                        <path d={m05FlapPath} fill="url(#m05-lining-light)" />
                                        <path d="M2 58C2 64 5 69 10 73L270 268L530 73C535 69 538 64 538 58" fill="none" stroke="#947d5d" strokeOpacity=".72" strokeWidth="1.8" />
                                        <path d="M3 58C3 63 6 67 11 71L270 266L529 71C534 67 537 63 537 58" fill="none" stroke="#fff5de" strokeOpacity=".34" strokeWidth=".8" />
                                    </g>
                                </svg>
                                <EnvelopeEmblem className="absolute left-1/2 top-[12%] h-9 w-11 -translate-x-1/2" />
                            </motion.div>
                        </motion.div>

                        {invitedName && (
                            <div className="pointer-events-none absolute inset-x-[8%] top-[82%] z-[55] flex flex-col items-center text-center drop-shadow-[0_1px_2px_rgba(20,24,14,.65)]">
                                <p className="m05-khmer-safe font-kantumruy text-[8px] text-[#f0dfb8] sm:text-[9px]">
                                    {invitedGuestLabel}
                                </p>
                                <p className="m05-khmer-safe max-w-full break-words font-khmer-moul text-[9px] text-[#fff0cf] sm:text-[11px]">
                                    {invitedHonorific ? `${invitedHonorific} ` : ""}{invitedName}
                                </p>
                            </div>
                        )}
                        <WaxSeal stage={stage} onOpen={onOpen} label={hint} reducedMotion={reducedMotion} color={sealColor} />
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: stage === 0 ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 mt-6 flex w-full max-w-[360px] items-center justify-center gap-3 font-kantumruy text-[11px] text-[#e7d7b5]/85 before:h-px before:max-w-8 before:flex-1 before:bg-gradient-to-r before:from-transparent before:to-[#c3a16d]/55 after:h-px after:max-w-8 after:flex-1 after:bg-gradient-to-l after:from-transparent after:to-[#c3a16d]/55 md:text-sm"
                >
                    {hint}
                </motion.p>
            </div>

        </motion.section>
        {/* Leaving card rendered as a portal-like sibling of motion.section,
            outside ALL transforms so position:fixed behaves correctly */}
        {leavingCard}
        </MotionConfig>
    );
};

const NeaM05: React.FC<TemplateProps> = ({ wedding, guestName, config }) => {
    const [stage, setStage] = useState<Stage>(0);
    const [cardRevealComplete, setCardRevealComplete] = useState(false);
    const [locale, setLocale] = useState<Locale>("km");
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const reducedMotion = usePrefersReducedMotion();
    const isEngagement = wedding.eventType === "anniversary";
    const text = isEngagement ? { ...copy[locale], ...copy[locale].engagement } : copy[locale];
    const invitationTitle = wedding.themeSettings?.customLabels?.invitationTitle
        || (isEngagement ? text.engagementInvitationTitle : text.invitationTitle);
    const englishInvitationTitle = isEngagement ? text.engagementEnglishInvitationTitle : text.englishInvitationTitle;
    const musicUrl = wedding.themeSettings?.musicUrl;
    const couplePhoto = getNeaM05CouplePhoto(wedding);
    const selectedColorPreset = NEA_M05_COLOR_PRESETS.find(
        (preset) => preset.id === wedding.themeSettings?.m05ColorPreset,
    ) || NEA_M05_COLOR_PRESETS[0];
    const primaryColor = wedding.themeSettings?.primaryColor || selectedColorPreset.foil;
    const customEnvelopeColor = wedding.themeSettings?.m05EnvelopeColor || blendHex(primaryColor, "#25281f", 0.72);
    const paletteColors = wedding.themeSettings?.m05ColorPreset === "custom"
        ? {
            ...NEA_M05_COLOR_PRESETS[0],
            foilHighlight: ensureMinimumLuminance(wedding.themeSettings?.m05HighlightColor || blendHex(primaryColor, "#fff1c8", 0.45), 0.62),
            foilShade: ensureMinimumLuminance(wedding.themeSettings?.m05FoilShadeColor || blendHex(primaryColor, "#e2c992", 0.3), 0.36),
            envelope: customEnvelopeColor,
            envelopeLight: mixHex(customEnvelopeColor, 255, 0.3),
            darkSurface: ensureMaximumLuminance(wedding.themeSettings?.m05SurfaceColor || blendHex(primaryColor, "#25281f", 0.88), 0.06),
        }
        : selectedColorPreset;
    const paperStyles = getTemplatePaperStyles(wedding.themeSettings, "#F3ECDC");
    const configuredPaperColor = wedding.themeSettings?.paperColor;
    const hasConfiguredPaperColor = Boolean(configuredPaperColor && /^#[\da-f]{6}$/i.test(configuredPaperColor));
    const paperSurface = hasConfiguredPaperColor
        ? paperStyles["--monea-paper-color"]
        : blendHex(primaryColor, "#f3ecdc", 0.04);
    const cardSurface = hasConfiguredPaperColor
        ? paperSurface
        : wedding.themeSettings?.m05CardColor || paperSurface;
    const sealColor = wedding.themeSettings?.m05SealColor || selectedColorPreset.foil;
    const accessibleFoil = ensureContrastRatio(primaryColor, paletteColors.darkSurface, 4.5);
    const accessiblePaperFoil = ensureContrastRatio(primaryColor, cardSurface, 4.5);
    const photoTintValue = Number(wedding.themeSettings?.m05PhotoTint ?? 22);
    const photoTint = Number.isFinite(photoTintValue) ? Math.max(0, Math.min(45, photoTintValue)) / 100 : 0.22;
    const isApprovalPreview =
        wedding.id === "approval-preview" ||
        (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "approval");
    const hasDate = Boolean(wedding.date && !Number.isNaN(new Date(wedding.date).getTime()));
    const weddingDate = hasDate ? new Date(wedding.date) : null;
    const dateParts = weddingDate ? formatNeaM05DateParts(weddingDate, locale) : ["—", "—", "—", "—"];
    const cardDateValue = weddingDate ? formatNeaM05Date(weddingDate, locale) : text.datePlaceholder;
    const cardVenueValue = wedding.locationName || wedding.location || (isApprovalPreview ? text.venuePlaceholder : undefined);
    const groomName = locale === "km"
        ? wedding.groomName
        : wedding.themeSettings?.customLabels?.groomNameEn || wedding.groomName;
    const brideName = locale === "km"
        ? wedding.brideName
        : wedding.themeSettings?.customLabels?.brideNameEn || wedding.brideName;
    const providedGuestName = guestName?.trim() || wedding.guestName?.trim();
    const isSampleGuest = isApprovalPreview && !providedGuestName;
    const invitedName = providedGuestName || (isSampleGuest ? "សុខ មុន្នីនាថ" : undefined);
    const invitedHonorific = isSampleGuest
        ? locale === "km" ? "កញ្ញា" : "Ms."
        : "";

    useEffect(() => {
        const previousOverflowX = document.body.style.overflowX;
        document.body.style.overflowX = CSS.supports("overflow-x", "clip") ? "clip" : "visible";
        return () => {
            document.body.style.overflowX = previousOverflowX;
        };
    }, []);

    useEffect(() => {
        if (stage !== 1 && stage !== 2) return;

        const durations: Record<1 | 2, number> = {
            1: reducedMotion ? 450 : 950,
            2: reducedMotion ? 800 : 1500,
        };
        const timer = window.setTimeout(() => setStage((current) => Math.min(current + 1, 6) as Stage), durations[stage]);
        return () => window.clearTimeout(timer);
    }, [reducedMotion, stage]);

    useEffect(() => {
        if (stage !== 5 || !cardRevealComplete) return;

        const timer = window.setTimeout(() => setStage(6), reducedMotion ? 200 : 450);
        return () => window.clearTimeout(timer);
    }, [cardRevealComplete, reducedMotion, stage]);

    useEffect(() => {
        if (stage !== 6 || reducedMotion) return;

        let lenis: Lenis | null = null;
        let ticker: ((time: number) => void) | null = null;
        const stop = () => {
            if (ticker) gsap.ticker.remove(ticker);
            ticker = null;
            lenis?.off("scroll", ScrollTrigger.update);
            lenis?.destroy();
            lenis = null;
        };
        const syncDesktopScroll = () => {
            if (window.innerWidth < 1024) {
                stop();
                return;
            }
            if (lenis) return;
            lenis = new Lenis({ duration: 1.1, smoothWheel: true });
            lenis.on("scroll", ScrollTrigger.update);
            ticker = (time) => lenis?.raf(time * 1000);
            gsap.ticker.add(ticker);
            ScrollTrigger.refresh();
        };

        syncDesktopScroll();
        window.addEventListener("resize", syncDesktopScroll, { passive: true });
        return () => {
            window.removeEventListener("resize", syncDesktopScroll);
            stop();
        };
    }, [reducedMotion, stage]);

    useEffect(() => {
        const handleForceReveal = () => {
            if (isApprovalPreview) return;
            setStage(6);
        };
        window.addEventListener("FORCE_REVEAL", handleForceReveal);
        return () => window.removeEventListener("FORCE_REVEAL", handleForceReveal);
    }, [isApprovalPreview]);

    const startOpening = () => {
        if (stage !== 0) return;
        setStage(1);

        if (audioRef.current && musicUrl) {
            void audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch((error: unknown) => {
                    setIsPlaying(false);
                    console.warn("Background music could not be started:", error);
                });
        }
    };

    const toggleMusic = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            void audio.play()
                .then(() => setIsPlaying(true))
                .catch((error: unknown) => {
                    setIsPlaying(false);
                    console.warn("Background music could not be started:", error);
                });
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div
            className="m05-template relative min-h-[100svh] overflow-x-clip bg-[#121413] font-kantumruy text-[#f7f0e3] selection:bg-[#b18d55] selection:text-white"
            style={{
                ...paperStyles,
                "--m05-foil": primaryColor,
                "--m05-foil-text": accessibleFoil,
                "--m05-foil-header": ensureContrastRatio(primaryColor, "#ffffff", 4.5),
                "--m05-foil-highlight": paletteColors.foilHighlight,
                "--m05-foil-highlight-text": ensureContrastRatio(paletteColors.foilHighlight, paletteColors.darkSurface, 4.5),
                "--m05-foil-shade": paletteColors.foilShade,
                "--m05-foil-shade-text": ensureContrastRatio(paletteColors.foilShade, paletteColors.darkSurface, 4.5),
                "--m05-paper-foil-text": accessiblePaperFoil,
                "--m05-envelope": paletteColors.envelope,
                "--m05-envelope-light": paletteColors.envelopeLight,
                "--m05-dark-surface": paletteColors.darkSurface,
                "--m05-page-background": `color-mix(in srgb, ${paletteColors.darkSurface} 48%, #10120f)`,
                "--m05-surface-raised": `color-mix(in srgb, ${paletteColors.darkSurface} 82%, #fff)`,
                "--m05-surface-deep": `color-mix(in srgb, ${paletteColors.darkSurface} 72%, #000)`,
                "--m05-foil-muted": `color-mix(in srgb, ${primaryColor} 48%, #f4ecdc)`,
                "--m05-text-muted": ensureContrastRatio(blendHex(primaryColor, "#d9cfb9", 0.12), paletteColors.darkSurface, 4.5),
                "--m05-text-primary": ensureContrastRatio(blendHex(primaryColor, "#f7f0e3", 0.04), paletteColors.darkSurface, 4.5),
                "--m05-paper-ink": ensureContrastRatio(blendHex(primaryColor, "#554832", 0.82), paperSurface, 4.5),
                "--m05-paper-surface": paperSurface,
                "--m05-card-ink": ensureContrastRatio(blendHex(primaryColor, "#554832", 0.82), cardSurface, 4.5),
                "--m05-card-surface": cardSurface,
                "--m05-card-foil-text": accessiblePaperFoil,
                "--m05-photo-tint-opacity": photoTint,
                "--m05-title-font": getNeaM05FontStack(wedding.themeSettings?.m05TitleFont, "moul"),
                "--m05-name-font": getNeaM05FontStack(wedding.themeSettings?.m05NameFont, "moulpali"),
            } as React.CSSProperties}
            data-m05-palette={wedding.themeSettings?.m05ColorPreset || "olive-gold"}
        >
            <style>{`
                .m05-foil {
                    background: linear-gradient(180deg, var(--m05-foil-highlight-text) 0%, var(--m05-foil-text) 48%, var(--m05-foil-shade-text) 78%, var(--m05-foil-highlight-text) 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    color: transparent;
                    padding-block: .45em .5em;
                    line-height: 2.1;
                    filter: drop-shadow(0 1px 0 rgba(80,55,21,.22));
                }
                .m05-khmer-safe { padding-block: .45em .5em; line-height: 2.1; }
                .m05-name-line { display: block; box-sizing: border-box; width: 100%; max-width: 100%; overflow-wrap: anywhere; padding: .42em .16em .5em; line-height: 2.2 !important; }
                .m05-name-mark-inline .m05-name-line { width: auto; max-width: 100%; overflow-wrap: normal; padding-block: .2em; line-height: 1.8 !important; }
                .m05-name-mark-inline .m05-name-inline { font-size: clamp(8px,4.7cqi,16px) !important; }
                .m05-name-flourish svg { transform-origin: center; }
                .m05-flap-name .m05-name-crest-wrap { width: 2.5rem; height: 1.65rem; margin-bottom: 0; }
                .m05-flap-name .m05-name-crest { width: 1.75rem; height: 1.35rem; margin-bottom: 0; }
                .m05-flap-name .m05-name-line { padding-block: .36em .42em; font-size: 11px; line-height: 2 !important; }
                .m05-flap-name .m05-name-flourish { width: 8rem; height: 1.3rem; margin-block: 0; }
                .m05-flap-name .m05-name-flourish img { width: .875rem; height: .875rem; }
                @media (min-width: 640px) {
                    .m05-flap-name .m05-name-crest-wrap { width: 3.25rem; height: 2.2rem; margin-bottom: .1rem; }
                    .m05-flap-name .m05-name-crest { width: 2.4rem; height: 1.9rem; margin-bottom: 0; }
                    .m05-flap-name .m05-name-line { font-size: 14px; line-height: 2.05 !important; }
                    .m05-flap-name .m05-name-flourish { width: 10rem; height: 1.6rem; margin-block: .1rem; }
                    .m05-flap-name .m05-name-flourish img { width: 1.25rem; height: 1.25rem; }
                }
                .m05-template .font-khmer-moul { font-family: var(--m05-title-font) !important; }
                .m05-template .font-moulpali { font-family: var(--m05-name-font) !important; }
                .m05-template .font-kantumruy { font-family: 'Kantumruy Pro', sans-serif !important; }
                .m05-template .font-serif-elegant { font-family: 'Cormorant Garamond', serif !important; }
                .m05-template .font-pinyon-script { font-family: 'Pinyon Script', cursive !important; }
                .m05-template .m05-photo-tint {
                    background-color: var(--m05-foil);
                    mix-blend-mode: normal;
                    opacity: var(--m05-photo-tint-opacity);
                }
                .m05-template .m05-khqr-frame { background-color: var(--m05-envelope) !important; }
                .m05-template .m05-khqr-header { background-color: var(--m05-foil-header) !important; }
                .m05-template .font-khmer-moul,
                .m05-template .font-moulpali,
                .m05-template .font-kantumruy { line-height: 1.9; letter-spacing: normal; }
                .m05-template .m05-foil { padding-block: .45em .5em; line-height: 2.1; }
                .m05-template .m05-khmer-safe { padding-block: .45em .5em; line-height: 2.1 !important; }
                .m05-template .m05-venue-copy { padding-block: .12em .18em; line-height: 1.7 !important; }
                #m05-programme { container-type: inline-size; }
                @container (min-width: 760px) {
                    #m05-invitation-words .m05-invitation-words-layout {
                        grid-template-columns: minmax(0,1fr) minmax(260px,340px);
                    }
                    #m05-invitation-words .m05-invitation-photo {
                        grid-column: 2;
                        grid-row: 1;
                        margin-left: auto;
                        margin-right: 0;
                    }
                    #m05-invitation-words .m05-invitation-copy {
                        grid-column: 1;
                        grid-row: 1;
                        text-align: left;
                    }
                    #m05-invitation-words .m05-invitation-description {
                        margin-left: 0;
                        margin-right: 0;
                    }
                }
                @container (min-width: 760px) {
                    #m05-couple .m05-couple-layout {
                        grid-template-columns: minmax(0,.9fr) minmax(0,1.1fr);
                    }
                }
                @container (min-width: 600px) {
                    #m05-venue .m05-venue-details {
                        grid-template-columns: repeat(2,minmax(0,1fr));
                        gap: 2.5rem;
                    }
                }
                @container (min-width: 760px) {
                    #m05-programme .m05-programme-layout {
                        grid-template-columns: minmax(0,1fr);
                    }
                }
                .m05-template [class*="text-[#c8ad76]"],
                .m05-template [class*="text-[#c2a56f]"],
                .m05-template [class*="text-[#b99b68]"],
                .m05-template [class*="text-[#b89a60]"],
                .m05-template [class*="text-[#a2824f]"],
                .m05-template [class*="text-[#9b7844]"],
                .m05-template [class*="text-[#9a7a43]"],
                .m05-template [class*="text-[#6f5125]"],
                .m05-template [class*="text-[#b18d55]"],
                .m05-template [class*="text-[#c6ab77]"],
                .m05-template [class*="text-[#c7a86d]"],
                .m05-template [class*="text-[#c3a16d]"],
                .m05-template [class*="text-[#c5a15e]"],
                .m05-template [class*="text-[#d0bb91]"],
                .m05-template [class*="text-[#d0b475]"],
                .m05-template [class*="text-[#d8bc82]"],
                .m05-template [class*="text-[#947d5d]"],
                .m05-template [class*="text-[#554832]"],
                .m05-template [class*="text-[#e1d0ad]"],
                .m05-template [class*="text-[#e4c47c]"] { color: var(--m05-foil-text) !important; }
                .m05-template [class*="text-[#d9bd83]"],
                .m05-template [class*="text-[#d7bd88]"],
                .m05-template [class*="text-[#f2dba7]"],
                .m05-template [class*="text-[#ecd6a7]"],
                .m05-template [class*="text-[#ddc894]"],
                .m05-template [class*="text-[#e2c68e]"],
                .m05-template [class*="text-[#e3d2ad]"],
                .m05-template [class*="text-[#e5d5b2]"],
                .m05-template [class*="text-[#e6ce98]"],
                .m05-template [class*="text-[#e7d7b5]"],
                .m05-template [class*="text-[#e8d3a7]"],
                .m05-template [class*="text-[#f0dfb8]"],
                .m05-template [class*="text-[#f0dfbc]"],
                .m05-template [class*="text-[#f1dfb8]"],
                .m05-template [class*="text-[#f3dfb5]"],
                .m05-template [class*="text-[#f4d58d]"],
                .m05-template [class*="text-[#f4e4bf]"],
                .m05-template [class*="text-[#f7ce79]"],
                .m05-template [class*="text-[#ffe2a0]"],
                .m05-template [class*="text-[#fff0b0]"],
                .m05-template [class*="text-[#fff0cf]"],
                .m05-template [class*="text-[#fff1cf]"],
                .m05-template [class*="text-[#fff3d8]"],
                .m05-template [class*="text-[#fff4d6]"],
                .m05-template [class*="text-[#fff4dc]"],
                .m05-template [class*="text-[#f5e9ce]"],
                .m05-template [class*="text-[#f6edda]"],
                .m05-template [class*="text-[#d9e2ce]"] { color: var(--m05-foil-highlight-text) !important; }
                .m05-template [class*="text-[#d9cfb9]"],
                .m05-template [class*="text-[#e0d5bd]"],
                .m05-template [class*="text-[#d2c7ae]"],
                .m05-template [class*="text-[#e7dec9]"],
                .m05-template [class*="text-[#f0eadb]"] { color: var(--m05-text-muted) !important; }
                .m05-template [class*="text-[#f4ecdc]"],
                .m05-template [class*="text-[#f7f0e3]"] { color: var(--m05-text-primary) !important; }
                .m05-template #m05-cover .m05-foil {
                    background: linear-gradient(180deg, var(--m05-foil-highlight-text), var(--m05-foil-highlight-text));
                    background-clip: text;
                    -webkit-background-clip: text;
                }
                .m05-template #m05-cover .m05-cover-date-label { color: var(--m05-foil-highlight-text) !important; }
                .m05-template [class~="border-[#c8ad76]"],
                .m05-template [class~="border-[#a2824f]"],
                .m05-template [class~="border-[#b89a60]"],
                .m05-template [class~="border-[#c2a56f]"],
                .m05-template [class~="border-[#b99b68]"],
                .m05-template [class~="border-[#c7a86d]"],
                .m05-template [class~="border-[#c6ab77]"],
                .m05-template [class~="border-[#d8bc82]"],
                .m05-template [class~="border-[#d0b475]"],
                .m05-template [class~="border-[#d9bd83]"],
                .m05-template [class~="border-[#e6d3ac]"],
                .m05-template [class~="border-[#e7ce99]"],
                .m05-template [class~="border-[#ddc894]"],
                .m05-template [class~="border-[#e6ce98]"],
                .m05-template [class~="border-[#f3dfb5]"],
                .m05-template [class~="border-[#f2dba7]"],
                .m05-template [class~="border-[#e4c47c]"] { border-color: var(--m05-foil) !important; }
                .m05-template [class*="ring-[#d9bd83]"],
                .m05-template [class*="ring-[#e3d2ad]"],
                .m05-template [class*="ring-[#e4c47c]"],
                .m05-template [class*="ring-[#f2dba7]"] { --tw-ring-color: var(--m05-foil); }
                .m05-template [class~="border-[#d0c3a8]"],
                .m05-template [class~="border-[#b6a17b]"] { border-color: var(--m05-foil-muted) !important; }
                .m05-template [class*="divide-[#c8ad76]"] > :not([hidden]) ~ :not([hidden]) { border-color: var(--m05-foil) !important; }
                .m05-template [class*="via-[#c8ad76]"] { --tw-gradient-via: var(--m05-foil); }
                .m05-template [class*="via-[#b18d55]"] { --tw-gradient-via: var(--m05-foil); }
                .m05-template [class~="bg-[#121413]"],
                .m05-template [class~="bg-[#17130f]"],
                .m05-template [class~="bg-[#080908]"],
                .m05-template [class~="bg-[#100f0d]"],
                .m05-template [class~="bg-[#10120f]"],
                .m05-template [class~="bg-[#111510]"],
                .m05-template [class~="bg-[#15130f]"],
                .m05-template [class~="bg-[#191713]"] { background-color: var(--m05-page-background) !important; }
                .m05-template [class~="bg-[#25281f]"],
                .m05-template [class~="bg-[#24271f]"],
                .m05-template [class~="bg-[#171a16]"],
                .m05-template [class~="bg-[#171a15]"],
                .m05-template [class~="bg-[#11180f]"],
                .m05-template [class~="bg-[#13190f]"],
                .m05-template [class~="bg-[#27241e]"] { background-color: var(--m05-dark-surface) !important; }
                .m05-template [class~="bg-[#1d2019]"],
                .m05-template [class~="bg-[#1d211b]"],
                .m05-template [class~="bg-[#1b1e18]"],
                .m05-template [class~="bg-[#1b2417]"] { background-color: var(--m05-surface-deep) !important; }
                .m05-template [class~="bg-[#252b21]"],
                .m05-template [class~="bg-[#333a2c]"],
                .m05-template [class~="bg-[#384233]"],
                .m05-template [class~="bg-[#4d5940]"],
                .m05-template [class~="bg-[#586046]"],
                .m05-template [class~="bg-[#687351]"],
                .m05-template [class~="bg-[#899174]"],
                .m05-template [class~="bg-[#909878]"] { background-color: var(--m05-surface-raised) !important; }
                .m05-template [class~="bg-[#3a3425]"] { background-color: var(--m05-surface-deep) !important; }
                .m05-template [class*="bg-[#a2824f]"] {
                    background-color: color-mix(in srgb, var(--m05-foil) var(--tw-bg-opacity, 100%), transparent) !important;
                }
                .m05-template [class*="bg-[#c8ad76]"],
                .m05-template [class*="bg-[#d9bd83]"],
                .m05-template [class*="bg-[#d7bd88]"],
                .m05-template [class*="bg-[#b18d55]"],
                .m05-template [class*="bg-[#f7ce79]"],
                .m05-template [class*="bg-[#f2dba7]"],
                .m05-template [class*="bg-[#f4d58d]"],
                .m05-template [class*="bg-[#fff0b0]"],
                .m05-template [class*="bg-[#ffe2a0]"] {
                    background-color: color-mix(in srgb, var(--m05-foil) var(--tw-bg-opacity, 100%), transparent) !important;
                }
                .m05-template [class*="from-[#899174]"],
                .m05-template [class*="from-[#909878]"],
                .m05-template [class*="from-[#d0b475]"] { --tw-gradient-from: var(--m05-foil) var(--tw-gradient-from-position); }
                .m05-template [class*="to-[#252b21]"],
                .m05-template [class*="to-[#384233]"],
                .m05-template [class*="to-[#4d5940]"] { --tw-gradient-to: var(--m05-envelope) var(--tw-gradient-to-position); }
                .m05-template [class*="to-[#c3a16d]"] { --tw-gradient-to: var(--m05-foil) var(--tw-gradient-to-position); }
                .m05-template [class*="via-[#b99b68]"],
                .m05-template [class*="via-[#c5a15e]"],
                .m05-template [class*="via-[#c8ad76]"] { --tw-gradient-via: var(--m05-foil); }
                .m05-template [class*="via-[#b18d55]"] { --tw-gradient-via: var(--m05-foil); }
                .m05-template [class*="via-[#fff6d8]"] { --tw-gradient-via: var(--m05-foil-highlight); }
                .m05-template [fill="#c8ad76"],
                .m05-template [fill="#d9bd83"],
                .m05-template [fill="#d7bd88"],
                .m05-template [fill="#b18d55"] { fill: var(--m05-foil); }
                .m05-template [stroke="#c8ad76"],
                .m05-template [stroke="#d9bd83"],
                .m05-template [stroke="#d7bd88"],
                .m05-template [stroke="#b18d55"] { stroke: var(--m05-foil); }
                .m05-template [fill="#f2dba7"] { fill: var(--m05-foil-highlight); }
                .m05-template [fill="#f4d58d"],
                .m05-template [fill="#fff0b0"] { fill: var(--m05-foil-highlight); }
                .m05-template [stroke="#f2dba7"] { stroke: var(--m05-foil-highlight); }
                .m05-template [stroke="#f4d58d"],
                .m05-template [stroke="#fff0b0"] { stroke: var(--m05-foil-highlight); }
                .m05-template [stroke="#5e5034"],
                .m05-template [stroke="#10150c"],
                .m05-template [stroke="#11180f"],
                .m05-template [stroke="#13190f"] { stroke: var(--m05-dark-surface); }
                .m05-template [stop-color="#11180f"],
                .m05-template [stop-color="#1b2417"],
                .m05-template [stop-color="#10150c"],
                .m05-template [stop-color="#13190f"] { stop-color: var(--m05-dark-surface); }
                .m05-template [class~="border-[#b6a17b]"],
                .m05-template [class~="border-[#d0c3a8]"],
                .m05-template [class~="border-[#d5c49d]"] { border-color: var(--m05-foil-muted) !important; }
                .m05-template [class~="border-[#f3dfb5]/65"],
                .m05-template [class~="border-[#b89a60]/65"],
                .m05-template [class~="border-[#c2a56f]/65"] { border-color: color-mix(in srgb, var(--m05-foil) 65%, transparent) !important; }
                .m05-template [class~="border-[#f3dfb5]/70"],
                .m05-template [class~="border-[#f2dba7]/70"] { border-color: color-mix(in srgb, var(--m05-foil) 70%, transparent) !important; }
                .m05-template [class~="border-[#c8ad76]/25"] { border-color: color-mix(in srgb, var(--m05-foil) 25%, transparent) !important; }
                .m05-template [class~="border-[#c8ad76]/35"] { border-color: color-mix(in srgb, var(--m05-foil) 35%, transparent) !important; }
                .m05-template [class~="border-[#d8bc82]/45"] { border-color: color-mix(in srgb, var(--m05-foil) 45%, transparent) !important; }
                .m05-template [class~="border-[#c8ad76]/55"],
                .m05-template [class~="border-[#b89a60]/55"] { border-color: color-mix(in srgb, var(--m05-foil) 55%, transparent) !important; }
                .m05-template [class~="border-[#b89a60]/60"] { border-color: color-mix(in srgb, var(--m05-foil) 60%, transparent) !important; }
                .m05-template [class~="border-[#c8ad76]/20"],
                .m05-template [class~="border-[#ddc894]/20"] { border-color: color-mix(in srgb, var(--m05-foil) 20%, transparent) !important; }
                .m05-template [class~="border-[#b6a17b]/30"],
                .m05-template [class~="border-[#d0c3a8]/30"] { border-color: color-mix(in srgb, var(--m05-foil-muted) 30%, transparent) !important; }
                .m05-template [class~="border-[#d0c3a8]/80"] { border-color: color-mix(in srgb, var(--m05-foil-muted) 80%, transparent) !important; }
                .m05-template [class~="border-[#d5c49d]/35"] { border-color: color-mix(in srgb, var(--m05-foil-muted) 35%, transparent) !important; }
                .m05-template [class~="hover:border-[#d9bd83]"]:hover { border-color: var(--m05-foil-highlight) !important; }
                .m05-template [class~="hover:border-[#e7ce99]/75"]:hover { border-color: color-mix(in srgb, var(--m05-foil-highlight) 75%, transparent) !important; }
                .m05-template ::selection { background-color: var(--m05-foil); color: #fff; }
                .m05-template .m05-card-title,
                .m05-template .m05-card-info,
                .m05-template .m05-card-couple { color: var(--m05-card-ink) !important; }
                .m05-template .m05-card-invite,
                .m05-template .m05-card-heart,
                .m05-template .m05-card-subtitle { color: var(--m05-card-ink) !important; }
                .m05-template .m05-card-artwork {
                    justify-content: center;
                    gap: 1px;
                    padding: 5px 10px;
                }
                .m05-template .m05-card-artwork .m05-card-heading { flex: none; }
                .m05-template .m05-card-artwork .m05-card-crest { display: none; }
                .m05-template .m05-card-artwork .m05-card-title {
                    padding-block: .04em !important;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1.55 !important;
                }
                .m05-template .m05-card-artwork .m05-card-subtitle {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.3;
                }
                .m05-template .m05-card-artwork .m05-card-couple {
                    display: flex;
                    flex: none;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    width: 100%;
                    border-top: 1px solid color-mix(in srgb,var(--m05-foil-muted) 35%,transparent);
                    padding-top: 4px;
                    color: #6f5125;
                    font-family: var(--m05-name-font);
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.6;
                }
                .m05-template .m05-card-artwork .m05-card-couple-name { min-width: 0; overflow-wrap: anywhere; }
                .m05-template .m05-card-artwork .m05-card-heart { color: var(--m05-card-ink); font-size: 16px; }
                .m05-template .m05-card-artwork .m05-card-info {
                    display: flex;
                    flex: none;
                    flex-direction: column;
                    gap: 3px;
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 1.55;
                }
                .m05-template .m05-card-artwork .m05-card-invite {
                    padding: 0 !important;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 1.55 !important;
                }
                .m05-template .m05-card-artwork .m05-card-invite-label,
                .m05-template .m05-card-artwork .m05-card-invite-name { display: block; }
                .m05-template .m05-card-artwork .m05-card-details {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    align-items: center;
                    border-top: 1px solid color-mix(in srgb,var(--m05-foil-muted) 30%,transparent);
                    padding-top: 3px;
                    text-align: center;
                }
                .m05-template .m05-card-artwork .m05-card-detail-item {
                    display: block;
                    min-width: 0;
                    text-align: center;
                }
                .m05-template .m05-card-artwork .m05-card-detail {
                    min-width: 0;
                    text-align: center;
                    display: -webkit-box;
                    overflow: hidden;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }
                @media (min-width: 640px) {
                    .m05-template .m05-card-artwork {
                        gap: 3px;
                        padding: 8px 22px;
                    }
                    .m05-template .m05-card-artwork .m05-card-crest {
                        display: block;
                        width: 1.1rem;
                        height: .75rem;
                        margin-bottom: 0;
                    }
                    .m05-template .m05-card-artwork .m05-card-title {
                        font-size: 14px;
                        line-height: 1.5 !important;
                    }
                    .m05-template .m05-card-artwork .m05-card-subtitle { font-size: 15px; }
                    .m05-template .m05-card-artwork .m05-card-couple {
                        gap: 10px;
                        padding-top: 4px;
                        font-size: 15px;
                    }
                    .m05-template .m05-card-artwork .m05-card-heart { font-size: 18px; }
                    .m05-template .m05-card-artwork .m05-card-info {
                        gap: 3px;
                        max-width: 420px;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .m05-template .m05-card-artwork .m05-card-invite {
                        font-size: 12px;
                        line-height: 1.5 !important;
                    }
                    .m05-template .m05-card-artwork .m05-card-details {
                        flex-direction: column;
                        gap: 3px;
                        padding-top: 4px;
                    }
                    .m05-template .m05-card-artwork .m05-card-detail {
                        -webkit-line-clamp: 1;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
                .m05-template #m05-programme .m05-khmer-safe { padding-block: .1em .14em; line-height: 1.7 !important; }
                .m05-template #m05-invitation-words,
                .m05-template #m05-couple,
                .m05-template #m05-countdown,
                .m05-template #m05-programme,
                .m05-template #m05-story,
                .m05-template #m05-gallery,
                .m05-template #m05-venue,
                .m05-template #m05-gift,
                .m05-template #m05-thank-you {
                    background-color: var(--m05-dark-surface) !important;
                    background-image: none !important;
                }
                .m05-template #m05-invitation-words,
                .m05-template #m05-countdown,
                .m05-template #m05-gallery,
                .m05-template #m05-gift {
                    color: #f4ecdc;
                }
                .m05-template #m05-story > div {
                    background: var(--m05-dark-surface) !important;
                    color: #f4ecdc;
                }
                @media (prefers-reduced-motion: reduce) {
                    .m05-foil { filter: none; }
                }
                @media (max-width: 639px) and (orientation: portrait) {
                    .m05-cover-content {
                        padding-top: max(5rem, calc(env(safe-area-inset-top, 0px) + 3.5rem));
                    }
                }
                @media (orientation: portrait) and (max-height: 600px) {
                    .m05-cover-content { transform: translateY(8px); }
                }
                @media (orientation: landscape) and (max-height: 500px) {
                    .m05-cover-content {
                        display: grid;
                        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                        gap: .5rem 1.5rem;
                        width: min(760px, 84vw);
                        padding-block: 0;
                    }
                    .m05-cover-ceremony,
                    .m05-cover-details {
                        justify-content: center;
                        gap: .15rem;
                    }
                    .m05-cover-details { display: flex; }
                    .m05-cover-title { font-size: clamp(10px, 2.8vh, 14px); }
                    .m05-cover-english-title { margin-top: 0; font-size: 8px; }
                    .m05-name-crest-wrap { width: 2.5rem; height: 1.65rem; margin-bottom: 0; }
                    .m05-name-crest { width: 1.75rem; height: 1.35rem; margin-bottom: 0; }
                    .m05-name-line { padding-block: .3em .38em; font-size: clamp(11px, 3vh, 15px); }
                    .m05-name-flourish { height: 1.3rem; margin-block: 0; }
                    .m05-cover-invite { margin-top: 0; font-size: clamp(9px, 2.5vh, 12px); }
                    .m05-cover-guest { margin-top: 0; }
                    .m05-cover-date { margin-top: .25rem; padding-block: .25rem; }
                    .m05-cover-lunar,
                    .m05-cover-venue { margin-top: 0; font-size: clamp(8px, 2.2vh, 11px); }
                    .m05-cover-photo-placeholder { margin-top: 0; }
                    .m05-cover-scroll { margin-top: .15rem; flex-direction: row; gap: .25rem; }
                }
            `}</style>

            {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

            {stage === 6 && (
                <header className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex items-start justify-center bg-gradient-to-b from-[#100f0d]/90 via-[#100f0d]/55 to-transparent px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:pt-4">
                    <div className="pointer-events-auto mx-auto flex w-full max-w-[430px] items-center justify-end gap-2 pr-2">
                        <button
                            type="button"
                            onClick={() => setLocale((current) => current === "km" ? "en" : "km")}
                            className="inline-flex h-7 min-w-9 items-center justify-center rounded-full border border-[#d8bc82]/45 bg-[#17130f]/30 px-2 font-kantumruy text-[9px] tracking-[0.08em] text-[#f1dfb8] shadow-[0_2px_10px_rgba(0,0,0,.12)] backdrop-blur-sm transition-colors hover:border-[#e7ce99]/75 hover:bg-[#2a2117]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7ce99]"
                            aria-label={text.switchLanguage}
                        >
                            {locale === "km" ? "EN" : "ខ្មែរ"}
                        </button>
                        {musicUrl && (
                            <button
                                type="button"
                                onClick={toggleMusic}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40"
                                aria-label={isPlaying ? text.pauseMusic : text.playMusic}
                            >
                                {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
                            </button>
                        )}
                    </div>
                </header>
            )}

            <AnimatePresence mode="sync">
                {stage < 6 ? (
                    <InvitationEnvelope
                        key="m05-envelope"
                        wedding={wedding}
                        invitedName={invitedName}
                        invitedHonorific={invitedHonorific}
                        invitedGuestLabel={text.invitedGuest}
                        locale={locale}
                        dateValue={cardDateValue}
                        venueValue={cardVenueValue}
                        groomPlaceholder={text.groomPlaceholder}
                        bridePlaceholder={text.bridePlaceholder}
                        title={invitationTitle}
                        englishTitle={englishInvitationTitle}
                        hint={wedding.themeSettings?.customLabels?.heroButton || text.openEnvelope}
                        stage={stage}
                        onOpen={startOpening}
                        onCardFullyExtracted={() => setStage(5)}
                        onCardRevealComplete={() => setCardRevealComplete(true)}
                        reducedMotion={reducedMotion}
                        backgroundImage={couplePhoto}
                        sealColor={sealColor}
                    />
                ) : (
                    <motion.main
                        key="m05-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reducedMotion ? 0.3 : 0.55, ease: [0.4, 0, 0.2, 1] }}
                        className="relative w-full bg-[#121413]"
                    >
                        <section id="m05-cover" className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#27241e] px-4 py-4 text-center sm:py-14">
                        {couplePhoto ? (
                            <>
                                <img
                                    src={couplePhoto}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 h-full w-full object-cover brightness-[.58] saturate-[.82]"
                                    fetchPriority="high"
                                    decoding="async"
                                />
                                <div className="m05-photo-tint pointer-events-none absolute inset-0" aria-hidden="true" />
                            </>
                        ) : (
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: "radial-gradient(ellipse at 50% 42%,var(--m05-envelope-light) 0%,var(--m05-envelope) 45%,var(--m05-dark-surface) 100%)",
                                }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#15130f]/65 via-[#191713]/44 to-[#100f0d]/85" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/45 to-transparent" />
                        <section className="m05-cover-content relative z-10 mx-auto flex w-full max-w-[540px] flex-col items-center justify-center px-3 py-5">
                            <div className="m05-cover-ceremony flex w-full flex-col items-center">
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.8 }}
                                className="m05-cover-title m05-khmer-safe font-khmer-moul text-sm text-[#fff3d8] sm:text-lg"
                            >
                                {invitationTitle}
                            </motion.p>
                            {wedding.themeSettings?.customLabels?.heroSubtitle && (
                                <p className="m05-khmer-safe mt-2 max-w-lg font-kantumruy text-xs leading-relaxed text-[#f5e9ce]/90 sm:text-sm">
                                    {wedding.themeSettings.customLabels.heroSubtitle}
                                </p>
                            )}
                            <p className="m05-cover-english-title mt-1 max-w-full whitespace-nowrap font-pinyon-script text-[clamp(0.7rem,4vw,1.125rem)] text-[#e8d3a7]">
                                {englishInvitationTitle}
                            </p>

                            <motion.div
                                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.28, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                className="mt-2 w-full"
                                role="heading"
                                aria-level={1}
                                aria-label={`${groomName || text.groomPlaceholder} និង ${brideName || text.bridePlaceholder}`}
                            >
                                <NameMark
                                    groom={groomName}
                                    bride={brideName}
                                    groomPlaceholder={text.groomPlaceholder}
                                    bridePlaceholder={text.bridePlaceholder}
                                    oneLine
                                />
                            </motion.div>

                            </div>

                            <div className="m05-cover-details flex w-full flex-col items-center">
                            <p className="m05-cover-invite mt-4 font-kantumruy text-[11px] text-white/85 sm:text-xs">
                                {text.invitedGuest}
                            </p>
                            {invitedName && (
                                <p className="m05-cover-guest m05-khmer-safe mt-1 max-w-[90%] font-khmer-moul text-xs text-[#fff1cf] sm:text-sm">
                                    {invitedHonorific ? `${invitedHonorific} ` : ""}{invitedName}
                                </p>
                            )}

                            <div className="m05-cover-date mt-4 grid w-full max-w-[340px] grid-cols-4 divide-x divide-[#e6d3ac]/40 border-y border-[#e6d3ac]/35 py-2">
                                {text.dateLabels.map((label, index) => (
                                    <div key={label} className="px-1">
                                        <p className="m05-khmer-safe whitespace-nowrap font-khmer-moul text-[10px] text-[#fff0cf] sm:text-xs">
                                            {dateParts[index]}
                                        </p>
                                        <p className="m05-cover-date-label m05-khmer-safe mt-0.5 font-kantumruy text-[9px] text-[#e1d0ad]/80">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {wedding.themeSettings?.lunarDate && (
                                <p className="m05-cover-lunar m05-khmer-safe mt-2 font-kantumruy text-[10px] text-[#f0dfbc] sm:text-xs">
                                    {wedding.themeSettings.lunarDate}
                                </p>
                            )}
                            {!wedding.themeSettings?.lunarDate && isApprovalPreview && (
                                <p className="m05-cover-lunar m05-khmer-safe mt-2 font-kantumruy text-[10px] text-[#f0dfbc]/70 sm:text-xs">
                                    {text.lunarDatePlaceholder}
                                </p>
                            )}
                            {wedding.location && (
                                <p className="m05-cover-venue m05-khmer-safe mt-1 max-w-[90%] font-kantumruy text-[10px] text-white/85 sm:text-xs">
                                    {wedding.locationName || wedding.location}
                                </p>
                            )}
                            {!wedding.location && isApprovalPreview && (
                                <p className="m05-cover-venue m05-khmer-safe mt-1 font-kantumruy text-[10px] text-white/65 sm:text-xs">
                                    {text.venuePlaceholder}
                                </p>
                            )}
                            {!couplePhoto && (
                                <p className="m05-cover-photo-placeholder mt-2 font-kantumruy text-[9px] text-white/55">
                                    {text.photoPlaceholder}
                                </p>
                            )}
                            <motion.a
                                href="#m05-next"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                                transition={{ delay: 1.1 }}
                                className="m05-cover-scroll mt-3 inline-flex flex-col items-center gap-1 font-serif-elegant text-[9px] uppercase tracking-[0.24em] text-[#f4e4bf]"
                            >
                                <span>{text.scroll}</span>
                                <motion.span
                                    animate={reducedMotion ? {} : { y: [0, 4, 0] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                    aria-hidden="true"
                                >
                                    ↓
                                </motion.span>
                            </motion.a>
                            </div>
                        </section>

                        <span id="m05-next" className="absolute bottom-0" />
                        </section>
                        <NeaM05Sections
                            wedding={wedding}
                            config={config}
                            locale={locale}
                            isApprovalPreview={isApprovalPreview}
                            reducedMotion={reducedMotion}
                        />
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NeaM05;
