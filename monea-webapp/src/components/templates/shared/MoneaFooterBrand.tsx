import { MoneaLogoMark } from "@/components/ui/MoneaLogoMark";
import { useTranslation } from "@/i18n/LanguageProvider";

interface MoneaFooterBrandProps {
    className?: string;
}

export function MoneaFooterBrand({ className = "" }: MoneaFooterBrandProps) {
    const { locale } = useTranslation();
    const isKhmer = locale === "km";

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <a
                href="https://moneoez.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MONEO — moneoez.com"
                className="group flex flex-col items-center gap-3 rounded-2xl px-5 py-3 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6bd83]"
            >
                <MoneaLogoMark className="h-14 w-14 border-[#c8a96b]/70 shadow-[0_0_24px_rgba(200,169,107,0.18)]" />
                <span className="font-outfit text-lg font-black tracking-[0.24em] text-[#765817]">
                    MONEO
                </span>
                <span className="font-kantumruy text-xs leading-relaxed text-[#5c5140]">
                    {isKhmer
                        ? "ធៀបការដែលជាប់ចិត្ត កុំភ្លេច MONEO"
                        : "Modern Digital Wedding Invitations"}
                </span>
                <span className="font-outfit text-[10px] font-semibold tracking-[0.16em] text-[#8c6b2f]">
                    MONEOEZ.COM
                </span>
            </a>
            <div className="mt-2 flex w-full max-w-sm items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c8a96b]/45" />
                <span className="h-1 w-1 rounded-full bg-[#c8a96b]/70" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c8a96b]/45" />
            </div>
            <p className="mt-3 font-kantumruy text-[10px] text-[#7b7468]">
                © {new Date().getFullYear()} MONEO. {isKhmer ? "រក្សាសិទ្ធិគ្រប់យ៉ាង" : "All rights reserved."}
            </p>
        </div>
    );
}
