import { useState } from "react";
import { m, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";

export function FAQ() {
    const { t } = useTranslation();
    const faqs = [
        {
            q: t("faq.q1"),
            a: t("faq.a1")
        },
        {
            q: t("faq.q3"),
            a: t("faq.a3")
        },
        {
            q: t("faq.q4"),
            a: t("faq.a4")
        }
    ];

    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section className="relative overflow-hidden border-t border-border bg-background py-32">
            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <div className="text-center mb-16 flex flex-col items-center">
                    <m.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-xl xs:text-2xl sm:text-3xl md:text-5xl lg:text-[3.5rem] font-bold font-kantumruy text-foreground mb-6 tracking-tight"
                    >
                        {t("faq.title")}
                    </m.h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <m.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className={cn("overflow-hidden rounded-[2rem] border transition-all duration-500", openIdx === idx ? "border-border bg-card shadow-sm" : "border-border bg-card/60 hover:bg-card")}
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                                className="w-full px-8 py-7 text-left flex items-center justify-between gap-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group/faq"
                            >
                                <span className={cn("font-bold font-kantumruy text-lg sm:text-xl transition-colors duration-300 tracking-tight", openIdx === idx ? "text-foreground" : "text-muted-foreground group-hover/faq:text-foreground")}>{faq.q}</span>
                                <span className={cn("shrink-0 w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-500", openIdx === idx ? "rotate-180 border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-sage group-hover/faq:scale-110")}>
                                    {openIdx === idx ? <Minus size={18} /> : <Plus size={18} />}
                                </span>
                            </button>
                            <AnimatePresence>
                                {openIdx === idx && (
                                    <m.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <div className="border-t border-border px-8 pb-8 pt-6 font-kantumruy text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
                                            {faq.a}
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
