import * as React from "react";
// next/dynamic replaced with React.lazy;
import { m, AnimatePresence } from 'framer-motion';
import type { TemplateProps } from "./types";
import { useTranslation } from "@/i18n/LanguageProvider";

// Static Imports for Fast Load and SSR
import { HeroSection } from './modern-minimal/HeroSection';
import { ScheduleSection } from './modern-minimal/ScheduleSection';
import { GallerySection } from './modern-minimal/GallerySection';
import { CountdownSection } from './modern-minimal/CountdownSection';
import { LetterSection } from './modern-minimal/LetterSection';
import { LocationSection } from './modern-minimal/LocationSection';
import { GiftSection } from './modern-minimal/GiftSection';
import { ThankYouSection } from './modern-minimal/ThankYouSection';
import { getTemplatePaletteStyles } from "@/lib/template-color-palette";
import { LoveStorySection } from './modern-minimal/LoveStorySection';
import { VideoSection } from './modern-minimal/VideoSection';

import { EntranceEnvelope } from './modern-minimal/EntranceEnvelope';
import { ParallaxDivider } from './modern-minimal/ParallaxDivider';

import { BackgroundMusic } from './modern-minimal/BackgroundMusic';
import { getWeddingHeroImage } from "./shared/weddingPhotos";
import { isSectionVisible } from "./shared/template-settings";
import { GuestbookSection } from "./shared/GuestbookSection";
import { MoneaFooterBrand } from "./shared/MoneaFooterBrand";
import { SocialLinksSection } from "./shared/SocialLinksSection";

export default function ModernMinimal({ wedding, guestName, config }: TemplateProps) {
    const { locale } = useTranslation();
    const isKhmer = locale === "km";
    const [revealed, setRevealed] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    // Support for Preview Dashboard scrolling
    React.useEffect(() => {
        const handleForceReveal = () => setRevealed(true);
        window.addEventListener('FORCE_REVEAL', handleForceReveal);
        return () => window.removeEventListener('FORCE_REVEAL', handleForceReveal);
    }, []);

    const primaryColor = wedding.themeSettings?.primaryColor || "#0A1226";
    const heroImage = getWeddingHeroImage(wedding, '/images/bg_tunnel.webp');
    return (
        <div 
            style={getTemplatePaletteStyles(wedding.themeSettings, "#0A1226", "#F8F8EC")}
            className="monea-full-palette monea-paper-canvas modern-minimal-invitation m05-type-system khmer-readable-type-system relative min-h-screen bg-[#f8f8ec] font-inter text-slate-900 selection:bg-[var(--primary)] selection:text-white"
        >
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.10),_transparent_38%)]" />
            {!revealed && (
                <EntranceEnvelope 
                    wedding={wedding} 
                    guestName={guestName}
                    audioRef={audioRef}
                    onStartOpen={() => {
                        setIsPlaying(true);
                    }}
                    onReveal={() => {
                        setRevealed(true);
                        setIsPlaying(true);
                    }} 
                />
            )}

            {revealed && <main
                className="modern-minimal-content relative z-10 w-full overflow-x-hidden"
            >
                <HeroSection wedding={wedding} />
                <CountdownSection wedding={wedding} />
                
                <LetterSection wedding={wedding} guestName={guestName} />
                {isSectionVisible(config, "story") && <LoveStorySection wedding={wedding} />}

                <ParallaxDivider text="FOREVER & ALWAYS" />

                {isSectionVisible(config, "timeline") && <ScheduleSection wedding={wedding} title={config.labels.scheduleTitle} />}

                {isSectionVisible(config, "map") && <LocationSection wedding={wedding} />}
                <VideoSection wedding={wedding} />
                {isSectionVisible(config, "gallery") && (
                    <GallerySection
                        wedding={wedding}
                        onLightboxOpenChange={setIsGalleryLightboxOpen}
                    />
                )}
                
                {isSectionVisible(config, "gift") && <GiftSection wedding={wedding} />}
                {isSectionVisible(config, "guestbook") && <GuestbookSection wedding={wedding} tone="light" unboxed accentColorOverride="#9b8055" />}
                <ThankYouSection wedding={wedding} />

                <footer
                    className="relative overflow-hidden border-t border-[#c8a96b]/25 px-6 py-12 text-center sm:py-16"
                    style={{
                        backgroundColor: "var(--monea-paper-color, #f7f1ea)",
                        backgroundImage: "var(--monea-paper-texture, none)",
                    }}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(200,169,107,0.12),transparent_70%)]" />
                    <SocialLinksSection wedding={wedding} />
                    <MoneaFooterBrand className="relative mx-auto max-w-sm" />
                </footer>
            </main>}

            {/* Audio Element */}
            {wedding.themeSettings?.musicUrl && (
                <audio 
                    ref={audioRef} 
                    src={wedding.themeSettings.musicUrl} 
                    loop 
                    preload="none"
                />
            )}

            {revealed && (
                <BackgroundMusic
                    wedding={wedding}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    audioRef={audioRef}
                    showControl={!isGalleryLightboxOpen}
                />
            )}
        </div>
    );
}
