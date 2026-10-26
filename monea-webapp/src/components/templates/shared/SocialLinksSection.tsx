import { Facebook, Phone, Send } from "lucide-react";
import type { WeddingData } from "../types";

function getSocialHref(value: string | undefined, allowedDomains: string[]) {
    const input = value?.trim();
    if (!input) return null;

    try {
        const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        const hostname = url.hostname.toLowerCase();
        if (!allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return null;
        return url.toString();
    } catch {
        return null;
    }
}

export function SocialLinksSection({ wedding }: { wedding: WeddingData }) {
    const settings = wedding.themeSettings;
    if (settings?.showSocialLinks === false) return null;

    const facebookUrl = getSocialHref(settings?.facebookUrl, ["facebook.com", "fb.com"]);
    const telegramUrl = getSocialHref(settings?.telegramUrl, ["t.me", "telegram.me"]);
    const phoneNumber = settings?.phoneNumber?.trim();
    const phoneHref = phoneNumber?.replace(/[^\d+]/g, "");
    const links: Array<{ href: string; label: string; icon: typeof Facebook }> = [];
    if (facebookUrl) links.push({ href: facebookUrl, label: "Facebook", icon: Facebook });
    if (telegramUrl) links.push({ href: telegramUrl, label: "Telegram", icon: Send });
    if (phoneNumber && phoneHref) links.push({ href: `tel:${phoneHref}`, label: phoneNumber, icon: Phone });

    if (links.length === 0) return null;

    return (
        <section
            aria-label="តំណភ្ជាប់ទំនាក់ទំនង"
            className="border-t border-[#c8a96b]/20 bg-[#fbfaf7] px-5 py-8 text-center sm:py-10"
        >
            <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-3">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith("tel:") ? undefined : "_blank"}
                            rel={link.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#c8a96b]/35 bg-white px-4 py-2 font-kantumruy text-sm font-semibold text-[#66542f] transition-colors hover:bg-[#f5efdf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b8055]"
                        >
                            <Icon aria-hidden="true" className="h-4 w-4" />
                            <span>{link.label}</span>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
