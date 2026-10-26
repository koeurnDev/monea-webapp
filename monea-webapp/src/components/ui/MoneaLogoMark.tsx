import { cn } from "@/lib/utils";

interface MoneaLogoMarkProps {
    className?: string;
}

export function MoneaLogoMark({ className }: MoneaLogoMarkProps) {
    return (
        <span
            className={cn(
                "inline-block h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#C2A15A]/70 bg-[#243E2E] shadow-sm",
                className
            )}
        >
            <img
                src="/icons/logomoneo.webp"
                alt=""
                aria-hidden="true"
                draggable={false}
                className="h-full w-full object-cover"
            />
        </span>
    );
}
