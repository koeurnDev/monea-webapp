import * as React from "react";
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Heart } from "lucide-react";
import type { TemplateProps } from "./types";
import { useTranslation } from "@/i18n/LanguageProvider";
import { isSectionVisible } from "./shared/template-settings";
import { OneLineName } from "./shared/OneLineName";

// Extracted Hook
import { useKhmerLegacy } from './khmer-legacy/useKhmerLegacy';

// Template Components
import { HeroSection } from './khmer-legacy/HeroSection';
import { BackgroundMusic } from './khmer-legacy/BackgroundMusic';
import { overlayVariants, containerVariants } from './khmer-legacy/animations';
import { KhmerInvitation } from './khmer-legacy/KhmerInvitation';
import { KhmerSchedule } from './khmer-legacy/KhmerSchedule';
import { EventCountdown } from './khmer-legacy/EventCountdown';
import { DynamicGallery } from "./khmer-legacy/DynamicGallery";
import { LoveStorySection } from "./khmer-legacy/LoveStorySection";
import { VideoSection } from "./khmer-legacy/VideoSection";
import { LocationMap } from './khmer-legacy/LocationMap';
import GiftSection from "./khmer-legacy/GiftSection";
import { ThankYouSection } from "./khmer-legacy/ThankYouSection";
import { FooterSection } from "./khmer-legacy/FooterSection";
import { CelebrationNavigator } from "./khmer-legacy/CelebrationNavigator";
import { getTemplatePaletteStyles } from "@/lib/template-color-palette";
import { GuestbookSection } from "./shared/GuestbookSection";

export default function KhmerLegacy({ wedding, guestName, config }: TemplateProps) {
    const { t } = useTranslation();
    const {
        revealed,
        setRevealed,
        isPlaying,
        setIsPlaying,
        audioRef,
        timeLeft,
        galleryImages,
        heroImage,
        smartColors,
        heroPan,
        hubPan,
        mapPan,
        signaturePan1,
        signaturePan2,
        signaturePan3,
        signaturePan4,
        signaturePan5,
        signaturePan6,
        preWeddingPan1,
        preWeddingPan2,
        preWeddingPan3,
        preWeddingPan4,
        preWeddingPan5,
        preWeddingPan6,
        formattedDateHero,
        musicUrl,
        dynamicPool,
        mounted
    } = useKhmerLegacy(wedding);

    const [isMobile, setIsMobile] = React.useState(false);
    const isOpeningEnvelope = React.useRef(false);
    const revealTimerRef = React.useRef<number | null>(null);
    const shouldReduceMotion = useReducedMotion();

    React.useEffect(() => () => {
        if (revealTimerRef.current !== null) {
            window.clearTimeout(revealTimerRef.current);
        }
    }, []);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        if (mounted) {
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    }, [mounted]);

    const primaryColor = wedding.themeSettings?.primaryColor || smartColors.primary || "#C5A027";

    const handleOpenEnvelope = () => {
        if (isOpeningEnvelope.current) return;
        isOpeningEnvelope.current = true;
        setIsPlaying(true);
        if (audioRef.current && musicUrl) {
            audioRef.current.play().catch((err) => {
                console.log("Autoplay policy prevented audio play:", err);
            });
        }

        if (shouldReduceMotion) {
            setRevealed(true);
            window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
            return;
        }

        revealTimerRef.current = window.setTimeout(() => {
            setRevealed(true);
            window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
        }, 950);
    };

    return (
        <div 
            style={getTemplatePaletteStyles(wedding.themeSettings, primaryColor, "#FAF9F6")}
            className="khmer-legacy-template monea-full-palette monea-paper-canvas min-h-screen bg-[#FAF9F6] text-[#333] overflow-x-hidden selection:bg-[#E2D1B3] relative"
        >
            <style>{`
                .khmer-legacy-template {
                    --color-cream: #FFFFFF;
                    --color-ivory: #F9F9F9;
                    --color-gold-deep: #805C00;
                    --color-gold-main: ${primaryColor};
                    --color-gold-light: ${primaryColor};
                    --color-gold-shimmer: #FFF7E0;
                    --color-gold-glow: rgba(212, 175, 55, 0.5);
                    --color-text-main: #333333;
                    --primary: ${primaryColor};
                }

                .font-khmer-moul { font-family: var(--font-moul), serif; line-height: 1.8; }
                .font-khmer-content { font-family: var(--font-kantumruy), sans-serif; line-height: 2.2; }
                .font-khmer-m1 { font-family: var(--font-m1), serif; line-height: 1.8; }
                .font-serif-elegant { font-family: var(--font-playfair), serif; }
                .font-playfair { font-family: var(--font-playfair), serif; }
                
                .text-gold { color: var(--color-gold-main); }
                .bg-gold { background-color: var(--color-gold-main); }
                .border-gold { border-color: var(--color-gold-main); }

                .text-gold-gradient {
                    background: linear-gradient(
                        145deg, 
                        var(--color-gold-deep) 0%, 
                        var(--color-gold-main) 20%, 
                        var(--color-gold-light) 45%, 
                        #FFFFFF 50%, 
                        var(--color-gold-light) 55%, 
                        var(--color-gold-main) 80%, 
                        var(--color-gold-deep) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: inline-block;
                }

                .text-gold-embossed {
                    text-shadow: 
                        0 1px 1px rgba(0,0,0,0.1),
                        0 2px 4px rgba(139, 101, 8, 0.2);
                }

                .premium-shadow { 
                    text-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05); 
                }
            `}</style>

            {/* Client-only Background Music */}
            {mounted && (
                <BackgroundMusic 
                    wedding={wedding} 
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    audioRef={audioRef}
                />
            )}

            {/* CINEMATIC ENTRANCE OVERLAY */}
            <AnimatePresence mode="wait">
                {!revealed && (
                    <m.div
                        key="overlay"
                        variants={overlayVariants}
                        initial="initial"
                        exit="exit"
                        onClick={handleOpenEnvelope}
                        className="fixed inset-0 z-[100] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0b0e14] p-0 text-center select-none cursor-pointer"
                        style={{ isolation: 'isolate' }}
                    >
                        <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-[#0b0e14] px-4 py-6 sm:gap-5 sm:px-5 sm:py-8">
                            {/* Full Background (Pre-Wedding Photo or Botanical Garden Arch) */}
                            <div className="absolute inset-0 z-0 overflow-hidden">
                                {heroImage && (
                                    <>
                                        <img
                                            src={heroImage}
                                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70"
                                            style={{
                                                objectPosition: `${heroPan.localX || '50%'} ${heroPan.localY || '20%'}`,
                                            }}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                        <img
                                            src={heroImage}
                                            className="absolute inset-0 w-full h-full brightness-100 transition-all duration-500"
                                            style={{
                                                objectFit: 'cover',
                                                objectPosition: `${heroPan.localX || '50%'} ${heroPan.localY || '50%'}`,
                                            }}
                                            alt="Pre-wedding Cover"
                                        />
                                    </>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/55" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)] pointer-events-none" />
                            </div>
                            
                            {/* Invitation heading */}
                            <m.div 
                                variants={containerVariants}
                                initial={false}
                                animate="visible"
                                className="relative z-10 mx-auto w-full max-w-[320px]"
                            >
                                <div className="flex flex-col items-center justify-center gap-1 text-center">
                                    <h1 className="max-w-full whitespace-nowrap px-2 font-khmer-moul text-[clamp(9px,3.5vw,15px)] leading-[1.7] text-gold-gradient text-gold-embossed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                                        {wedding.themeSettings?.customLabels?.invitationTitle ||
                                         (wedding.eventType === 'anniversary'
                                            ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" 
                                            : "សិរីមង្គលអាពាហ៍ពិពាហ៍")}
                                    </h1>
                                    <p className="font-playfair text-[10px] italic leading-relaxed text-amber-100/85 drop-shadow-md sm:text-xs">
                                        The Wedding Invitation
                                    </p>
                                </div>
                            </m.div>

                            <div
                                className="relative z-10 flex w-[min(88vw,360px)] flex-col items-center justify-center gap-3 px-4 py-4 text-center [text-shadow:0_2px_10px_rgba(0,0,0,0.95)] sm:gap-5 sm:px-6 sm:py-6"
                            >
                                <div className="flex w-full max-w-full items-center justify-center px-1 text-center">
                                    {wedding.themeSettings?.customTypographyUrl && wedding.themeSettings.customTypographyUrl !== "null" ? (
                                        <img
                                            src={wedding.themeSettings.customTypographyUrl}
                                            alt={`${wedding.groomName} និង ${wedding.brideName}`}
                                            className="max-h-16 max-w-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:max-h-24"
                                            style={{
                                                transform: `scale(${(wedding.themeSettings.customTypographyScale || 100) / 100}) translateY(${wedding.themeSettings.customTypographyY || 0}px)`,
                                                filter: `drop-shadow(${wedding.themeSettings.customTypographyDropShadow || '0px 2px 4px rgba(0,0,0,0.25)'})`,
                                            }}
                                        />
                                    ) : (
                                        <div className="grid w-full max-w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1 font-khmer-moul text-[clamp(12px,3.5vw,18px)] leading-[1.8] text-amber-50 sm:gap-x-2">
                                            {wedding.groomName && <OneLineName name={wedding.groomName} ariaHidden className="text-right" />}
                                            {wedding.groomName && wedding.brideName && (
                                                <Heart
                                                    aria-hidden="true"
                                                    className="h-3.5 w-3.5 shrink-0 fill-rose-300/90 text-rose-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] sm:h-4 sm:w-4"
                                                />
                                            )}
                                            {wedding.brideName && <OneLineName name={wedding.brideName} ariaHidden className="text-left" />}
                                        </div>
                                    )}
                                </div>

                                <div className="flex w-full max-w-[300px] items-center justify-center gap-2">
                                    <span className="h-px min-w-3 flex-1 bg-gradient-to-r from-transparent via-amber-200/80 to-amber-200/80" />
                                    <span className="max-w-[85%] break-words font-kantumruy text-[10px] leading-[1.7] text-amber-100 sm:text-xs">
                                        {formattedDateHero || "សូមស្វាគមន៍"}
                                    </span>
                                    <span className="h-px min-w-3 flex-1 bg-gradient-to-l from-transparent via-amber-200/80 to-amber-200/80" />
                                </div>
                                {guestName?.trim() && (
                                    <p className="max-w-full break-words font-khmer-moul text-[10px] leading-relaxed text-amber-50 sm:text-xs">
                                        {guestName.trim()}
                                    </p>
                                )}
                            </div>

                            <div className="relative z-10 w-full max-w-[300px] space-y-2 px-3 text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
                                <p className="break-words font-khmer-moul text-[12px] leading-[1.8] text-amber-100 sm:text-sm">
                                    មានកិត្តិយសសូមគោរពអញ្ជើញ
                                </p>
                                <p className="font-kantumruy text-[10px] leading-relaxed text-amber-200/85 sm:text-xs">
                                    ចុចដើម្បីមើលធៀប
                                </p>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* MAIN WEDDING INVITATION CONTENT */}
            {revealed && (
            <div className="khmer-legacy-revealed-content monea-paper-canvas w-full min-h-screen relative font-serif-elegant overflow-x-hidden">
                <div className="relative z-10">
                    
                    {/* ១. ផ្ទាំងទំព័រមុខ Hero Section */}
                    <m.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                    >
                        <HeroSection
                            wedding={wedding}
                            guestName={guestName}
                            heroImage={heroImage}
                            smartColors={smartColors}
                            heroPan={heroPan}
                            formattedDateHero={formattedDateHero}
                            isMobile={isMobile}
                        />
                    </m.div>

                    {/* ២. សំបុត្រអញ្ជើញ & មាតាបិតាទាំងសងខាង (Khmer Formal Invitation & Parents) */}
                    <m.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <KhmerInvitation wedding={wedding} smartColors={smartColors} />
                    </m.div>

                    {/* ៤. ដំណើររឿងរ៉ាវនៃក្តីស្រឡាញ់ (Love Story - If Configured) */}
                    {isSectionVisible(config, "story") &&
                    (wedding.themeSettings?.groomStory || wedding.themeSettings?.brideStory || wedding.themeSettings?.story?.kh || wedding.themeSettings?.loveStory || wedding.themeSettings?.storyImages?.length) && (
                        <m.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <LoveStorySection wedding={wedding} />
                        </m.div>
                    )}

                    {/* ៥. កាលវិភាគពិធីសិរីមង្គល (Wedding Schedule / Itinerary) */}
                    {isSectionVisible(config, "timeline") && wedding.activities.length > 0 && (
                        <m.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <KhmerSchedule wedding={wedding} customTitle={config.labels.scheduleTitle} />
                        </m.div>
                    )}

                    {/* ៦. រាប់ថយក្រោយដល់ថ្ងៃសិរីមង្គល (Wedding Countdown) */}
                    <m.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <EventCountdown 
                            wedding={wedding} 
                            mounted={mounted} 
                            timeLeft={timeLeft} 
                            hubPan={hubPan} 
                        />
                    </m.div>

                    {/* ៧. កម្រងរូបភាពអនុស្សាវរីយ៍ (Pre-Wedding Dynamic Photo Gallery) */}
                    {isSectionVisible(config, "gallery") && <m.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                        className="relative"
                    >
                        <DynamicGallery
                            wedding={wedding}
                            galleryImages={galleryImages}
                            dynamicPool={dynamicPool}
                            preWeddingPan1={preWeddingPan1}
                            preWeddingPan2={preWeddingPan2}
                            preWeddingPan3={preWeddingPan3}
                            preWeddingPan4={preWeddingPan4}
                            preWeddingPan5={preWeddingPan5}
                            preWeddingPan6={preWeddingPan6}
                        />
                    </m.div>}

                    {/* ៨. វីដេអូអនុស្សាវរីយ៍ (Video Section - If provided) */}
                    {wedding.themeSettings?.videoUrl && (
                        <m.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        >
                            <VideoSection wedding={wedding} />
                        </m.div>
                    )}



                    {/* ១០. ទីតាំងកម្មវិធី & ផែនទីនាំផ្លូវ (Location Map & GPS) */}
                    <m.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <LocationMap wedding={wedding} mapPan={mapPan} />
                    </m.div>

                    {/* ១១. ចូលរួមជូនពរ & ចំណងដៃ KHQR (Gift Section - If enabled) */}
                    {isSectionVisible(config, "gift") && (wedding.themeSettings?.bankAccounts?.length || wedding.themeSettings?.giftRegistry?.length) && (
                        <m.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <GiftSection wedding={wedding} />
                        </m.div>
                    )}

                    {isSectionVisible(config, "guestbook") && <GuestbookSection wedding={wedding} unboxed />}

                    {/* ១២. សេចក្តីថ្លែងអំណរគុណ (Thank You Section) */}
                    <m.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5 }}
                    >
                        <ThankYouSection wedding={wedding} smartColors={smartColors} />
                    </m.div>

                    {/* Footer */}
                    <FooterSection wedding={wedding} />
                </div>
            </div>
            )}

            {/* Floating Mobile Bottom Navigation Bar (Appears on Scroll) */}
            {revealed && <CelebrationNavigator />}
        </div>
    );
}
