import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/i18n/LanguageProvider";
import { getApiUrl } from "@/lib/api-url";
import { moneaClient } from "@/lib/api-client";

const TELEGRAM_VERIFIER_STORAGE_KEY = "telegram_oidc_verifier";

interface SSOIconsProps {
    className?: string;
}

const SSOIcons: React.FC<SSOIconsProps> = ({ className }) => {
    const { showToast } = useToast();
    const { locale } = useTranslation();
    const isKm = locale === 'km';
    const [telegramLoading, setTelegramLoading] = useState(false);

    const handleGoogleLogin = () => {
        window.location.href = getApiUrl("api/auth/sso/google");
    };

    const handleTelegramLogin = async () => {
        const isLocalDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && import.meta.env.DEV;
        
        if (isLocalDev) {
            showToast({ 
                title: isKm ? "អភិវឌ្ឍន៍" : "Development Mode", 
                description: isKm ? "Telegram SSO មិនដំណើរការនៅក្នុង localhost ទេ។ សូមប្រើការចុះឈ្មោះធម្មតា។" : "Telegram SSO is disabled in development. Please use regular sign up/in.", 
                type: "info" 
            });
            return;
        }

        setTelegramLoading(true);
        try {
            const response = await moneaClient.post<{ url: string; verifier: string }>(
                "/api/auth/sso/telegram"
            );
            if (response.error || !response.data?.url || !response.data.verifier) {
                throw new Error(response.error || "Telegram sign-in could not be started");
            }
            sessionStorage.setItem(TELEGRAM_VERIFIER_STORAGE_KEY, response.data.verifier);
            window.location.assign(response.data.url);
        } catch (error) {
            console.error("[Telegram OIDC] Could not start sign-in:", error);
            showToast({
                title: isKm ? "មិនអាចចាប់ផ្ដើម Telegram បានទេ" : "Could not start Telegram",
                description: isKm ? "សូមពិនិត្យការតភ្ជាប់ ហើយសាកល្បងម្ដងទៀត។" : "Check your connection and try again.",
                type: "error",
            });
            setTelegramLoading(false);
        }
    };

    return (
        <div className={`grid grid-cols-2 gap-2.5 w-full ${className || ''}`}>
            {/* Telegram Button */}
            <motion.button
                type="button"
                disabled={telegramLoading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void handleTelegramLogin()}
                className="h-11 w-full flex items-center justify-center gap-2.5 bg-background text-foreground hover:bg-muted active:bg-muted/80 border border-border hover:border-primary/60 rounded-xl transition-all shadow-xs group px-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
                <svg className="h-[18px] w-[18px] min-w-[18px] min-h-[18px] shrink-0 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span className="font-bold text-foreground text-xs font-kantumruy whitespace-nowrap">
                    {telegramLoading ? (isKm ? "កំពុងភ្ជាប់..." : "Connecting...") : "Telegram"}
                </span>
            </motion.button>

            {/* Google Button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                className="h-11 w-full flex items-center justify-center gap-2.5 bg-background text-foreground hover:bg-muted active:bg-muted/80 border border-border hover:border-primary/60 rounded-xl transition-all shadow-xs group px-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <svg className="h-4 w-4 min-w-[16px] min-h-[16px] shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-foreground text-xs font-kantumruy whitespace-nowrap">
                    Google
                </span>
            </motion.button>
        </div>
    );
};

export default SSOIcons;
