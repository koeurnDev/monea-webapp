import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { AUTH_URLS } from "@/lib/constants";

export function FinalCTA() {
    const { t } = useTranslation();
    return (
        <section className="relative overflow-hidden border-t border-border bg-background py-10 md:py-28">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
                <m.div
                    initial={{ opacity: 1, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex w-full flex-col items-center overflow-hidden border-y border-border py-6 text-center md:py-16"
                >
                    <m.div
                        initial={{ opacity: 1, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 md:mb-7"
                    >
                        <Sparkles className="h-4 w-4 text-gold" />
                        <span className="font-kantumruy text-xs font-bold text-primary md:text-xs">
                            {t("cta.badge") || "MONEO"}
                        </span>
                    </m.div>

                    <m.h2
                        initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                        className="relative z-10 mb-4 font-kantumruy text-2xl font-black leading-[1.45] tracking-tight text-foreground md:mb-6 sm:text-4xl md:text-5xl"
                    >
                        {t("cta.title1")} <span className="text-gold">{t("cta.title2")}</span>
                    </m.h2>

                    <m.p
                        initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                        className="relative z-10 mb-6 max-w-2xl font-kantumruy text-sm leading-relaxed text-muted-foreground md:mb-9 md:text-lg"
                    >
                        {t("cta.description")}
                    </m.p>

                    <m.div
                        initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                        className="w-full flex justify-center relative z-10"
                    >
                        <Link to={AUTH_URLS.SIGN_UP} className="group relative flex h-14 items-center justify-center overflow-hidden rounded-2xl border border-primary bg-primary px-8 text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:px-12">
                            <span className="font-kantumruy text-sm sm:text-base font-bold relative z-10 flex items-center justify-center gap-3">
                                {t("cta.button")}
                                <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1.5 md:h-5 md:w-5" />
                            </span>
                        </Link>
                    </m.div>
                </m.div>
            </div>
        </section>
    );
}
