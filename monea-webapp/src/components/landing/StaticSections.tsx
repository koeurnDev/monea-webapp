import { Link } from 'react-router-dom';
import { MoneaLogoMark } from "@/components/ui/MoneaLogoMark";
import { SocialMediaIcon } from "@/components/ui/SocialMediaIcon";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useSocialLinks } from "@/hooks/useSocialLinks";

export function TrustedPartners() {
    return null;
}

export function Footer() {
    const { t, locale } = useTranslation();
    const isKm = locale === 'km';
    const socialLinks = useSocialLinks();

    return (
        <footer className="relative overflow-hidden border-t border-border bg-background pt-10 pb-24 font-kantumruy sm:pt-14 sm:pb-16">
            {/* Subtle Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            
            <div className="container mx-auto max-w-4xl px-4 text-center relative z-10 sm:px-6">
                {/* Brand Header */}
                <div className="mb-6 flex flex-col items-center sm:mb-8">
                    <Link to="/" aria-label="MONEO - ទំព័រដើម" className="group inline-flex items-center transition-transform hover:scale-105">
                        <MoneaLogoMark className="h-12 w-12" />
                    </Link>
                    <p className="text-muted-foreground text-xs mt-2 max-w-sm">
                        {isKm ? "ធៀបការដែលជាប់ចិត្ត កុំភ្លេច MONEO" : "Modern Digital Wedding Invitation & Guest Management Platform"}
                    </p>
                </div>

                {/* Navigation Links */}
                <div className="mb-6 grid grid-cols-2 items-center justify-items-center gap-x-2 gap-y-3 text-xs font-bold text-muted-foreground sm:mb-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2.5 sm:text-sm">
                    <Link to="/" className="whitespace-nowrap transition-colors hover:text-primary">
                        {t("common.footer.home", { defaultValue: "ទំព័រដើម" })}
                    </Link>
                    <a href="#features" className="whitespace-nowrap transition-colors hover:text-primary">
                        {t("common.footer.features", { defaultValue: "លក្ខណៈពិសេស" })}
                    </a>
                    <a href="#how-it-works" className="whitespace-nowrap transition-colors hover:text-primary">
                        {t("common.footer.howItWorks", { defaultValue: "របៀបប្រើប្រាស់" })}
                    </a>
                    <Link to="/contact" className="whitespace-nowrap transition-colors hover:text-primary">
                        {isKm ? "ទំនាក់ទំនង និងជំនួយ" : "Contact & Support"}
                    </Link>
                </div>

                {/* Social Icons */}
                <div className="mb-7 flex justify-center gap-3.5 sm:mb-10">
                    {socialLinks.map((link, index) => (
                        <a
                            key={`${link.platform}-${index}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.label}
                            title={link.label}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground shadow-xs transition-all hover:bg-accent hover:text-primary"
                        >
                            <SocialMediaIcon platform={link.platform} />
                        </a>
                    ))}
                </div>

                {/* Copyright & Legal Links */}
                <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                    <p>{t("common.footer.copyright", { defaultValue: "រក្សាសិទ្ធិគ្រប់យ៉ាង © ២០២៦ MONEO" })}</p>
                    <div className="flex items-center gap-3">
                        <Link to="/privacy-policy" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
                            {t("common.footer.privacyPolicy", { defaultValue: "គោលការណ៍ឯកជនភាព" })}
                        </Link>
                        <span>•</span>
                        <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
                            {t("common.footer.termsOfUse", { defaultValue: "លក្ខខណ្ឌប្រើប្រាស់" })}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
