import { WeddingData } from '../types';
import { RevealSection } from '../shared/CinematicComponents';
import { useTranslation } from '@/i18n/LanguageProvider';
import { MoneaFooterBrand } from '../shared/MoneaFooterBrand';
import { SocialLinksSection } from '../shared/SocialLinksSection';

interface FooterSectionProps {
    wedding: WeddingData;
}

export function FooterSection({ wedding }: FooterSectionProps) {
    const { t } = useTranslation();
    return (
        <section className="py-16 md:py-24 px-6 md:px-12 text-center bg-white border-t border-gold/5 pb-24 md:pb-32 relative font-kantumruy">
            <div className="max-w-4xl mx-auto">
                <RevealSection>
                    <div className="space-y-8 md:space-y-10 relative z-10">
                        <p className="font-khmer-content text-[15px] md:text-[17px] leading-[2.4] md:leading-[2.8] text-gray-700 max-w-[480px] mx-auto italic font-medium">
                            {t("template.khmerLegacy.footerThankYou")}
                        </p>
                        <div className="flex flex-col items-center gap-2 pt-4">
                            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                            <p className="font-khmer-moul text-xs md:text-sm text-gold-main/80 tracking-wide">
                                {wedding.themeSettings?.customLabels?.footerLabel || t("template.khmerLegacy.footerLabel")}
                            </p>
                        </div>
                        <SocialLinksSection wedding={wedding} />
                        <MoneaFooterBrand className="pt-2" />
                    </div>
                </RevealSection>
            </div>
        </section>
    );
}
