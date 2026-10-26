import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

export function Pricing() {
    const { locale } = useTranslation();
    const isKm = locale === "km";

    return (
        <section id="pricing" className="relative overflow-hidden border-t border-slate-200/50 bg-[#FDFDFD] py-24 dark:border-white/5 dark:bg-[#050505] md:py-32">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
            <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[40vw] w-[40vw] rounded-full bg-emerald-50/40 blur-[150px] dark:bg-emerald-900/10" />

            <div className="container relative z-10 mx-auto max-w-4xl px-6 text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-5 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <span className="font-kantumruy text-xs font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-white/90">
                        {isKm ? "តម្លៃ Template" : "Template pricing"}
                    </span>
                </div>

                <h2 className="mb-6 font-kantumruy text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    {isKm ? "ជ្រើសរើស Template ដែលអ្នកចូលចិត្ត" : "Choose the template you love"}
                </h2>
                <p className="mx-auto mb-10 max-w-2xl font-kantumruy text-base font-light leading-relaxed text-slate-600 dark:text-white/60 sm:text-xl">
                    {isKm
                        ? "តម្លៃ Template នីមួយៗនឹងបង្ហាញក្នុងកម្មវិធីរចនា មុនពេលអ្នកបញ្ជាក់ការទិញ។"
                        : "Each template's price is shown in the design editor before you confirm a purchase."}
                </p>

                <Link
                    to="/templates"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary bg-primary px-7 py-4 font-kantumruy text-base font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {isKm ? "មើលរចនា Template" : "Browse template designs"}
                    <ArrowRight size={18} />
                </Link>
            </div>
        </section>
    );
}
