import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";
import { MoneaLogo } from "@/components/ui/MoneaLogo";

export function Hero() {
    return (
        <section className="relative flex min-h-[72dvh] w-full items-center overflow-hidden bg-background font-kantumruy text-foreground transition-colors duration-300">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-8 sm:py-24">
                <div className="mx-auto flex max-w-4xl flex-col items-center">
                    <div
                        className="mb-5 sm:mb-6"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg">
                            <Sparkles className="h-3.5 w-3.5 origin-center animate-[spin_3s_linear_infinite]" aria-hidden="true" />
                            <MoneaLogo showText size="sm" variant="dark" />
                            <span>· ធៀបឌីជីថល</span>
                        </span>
                    </div>

                    <h1
                        className="mb-4 sm:mb-6"
                    >
                        <span className="block text-[26px] font-bold leading-[1.4] tracking-normal text-foreground sm:whitespace-nowrap sm:text-4xl lg:text-5xl xl:text-6xl">
                            បង្កើតធៀបអញ្ជើញមង្គលការរបស់អ្នក
                        </span>
                        <span className="mt-1 block text-[24px] font-bold leading-[1.4] tracking-normal sm:whitespace-nowrap sm:text-3xl lg:text-4xl xl:text-5xl">
                            <span className="text-gold">
                                ឱ្យស្រស់ស្អាត
                            </span>
                        </span>
                    </h1>

                    <p
                        className="mb-6 max-w-3xl text-base leading-[1.9] text-foreground/80 sm:mb-8 sm:text-lg"
                    >
                        បង្កើតធៀបអញ្ជើញមង្គលការឌីជីថលបានយ៉ាងងាយស្រួល ភ្ជាប់{" "}
                        <strong className="text-foreground">Google Maps</strong>,{" "}
                        <strong className="text-foreground">KHQR</strong> និង{" "}
                        <strong className="text-foreground">Telegram</strong> ក្នុងពេលតែមួយ
                    </p>

                    <div
                        className="flex w-full max-w-xs flex-col items-center sm:max-w-none sm:flex-row sm:justify-center"
                    >
                        <Link
                            to={AUTH_URLS.SIGN_UP}
                            className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-primary bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation sm:h-14 sm:w-auto sm:px-9"
                        >
                            <span>បង្កើតធៀបឥឡូវ</span>
                            <ArrowRight size={17} className="text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
