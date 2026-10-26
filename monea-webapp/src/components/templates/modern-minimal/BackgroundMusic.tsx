import React, { useEffect } from 'react';
import { m } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import type { WeddingData } from '../types';

interface BackgroundMusicProps {
    wedding: WeddingData;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    showControl?: boolean;
}

export function BackgroundMusic({
    wedding,
    isPlaying,
    setIsPlaying,
    audioRef,
    showControl = true,
}: BackgroundMusicProps) {
    const audioUrl = wedding.themeSettings?.musicUrl;

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    // Sync audio state with props
    useEffect(() => {
        if (!audioRef.current || !audioUrl) return;

        const audio = audioRef.current;
        
        if (isPlaying) {
            audio.volume = 0.5;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed:", error);
                    setIsPlaying(false);
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, audioUrl, setIsPlaying, audioRef]);

    if (!audioUrl || !showControl) return null;

    return (
        <div className="invitation-floating-control fixed bottom-6 z-[100]">
            <m.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={togglePlay}
                type="button"
                aria-label={isPlaying ? "Pause background music" : "Play background music"}
                aria-pressed={isPlaying}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055] focus-visible:ring-offset-2 ${
                    isPlaying 
                        ? "border-[#9b8055]/25 bg-[#f7f1ea]/95 text-[#9b8055] shadow-[0_4px_14px_rgba(31,41,55,0.12)]"
                        : "border-white/80 bg-white/85 text-slate-600 shadow-[0_3px_12px_rgba(31,41,55,0.10)] hover:text-[#9b8055]"
                }`}
            >
                {isPlaying ? <Volume2 aria-hidden="true" size={17} strokeWidth={1.8} /> : <VolumeX aria-hidden="true" size={17} strokeWidth={1.8} />}
            </m.button>
        </div>
    );
}
