import * as React from "react";
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";
import { MoneaLogoMark } from "@/components/ui/MoneaLogoMark";

export function NavBar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 15);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="fixed top-3 sm:top-4 inset-x-0 z-50 px-4 sm:px-6 transition-all duration-300 pointer-events-none">
            {isMenuOpen && (
                <button
                    type="button"
                    aria-label="បិទម៉ឺនុយ"
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-0 bg-primary/15 backdrop-blur-[1px] pointer-events-auto dark:bg-black/25 sm:hidden"
                />
            )}
            <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
                <div className={cn(
                    "w-full flex items-center justify-between rounded-full transition-all duration-300 px-4 sm:px-6 py-2.5",
                    "bg-card/90 backdrop-blur-xl border border-border/80 shadow-md shadow-foreground/5",
                    isScrolled ? "shadow-lg border-border" : ""
                )}>
                    {/* Brand Logo */}
                    <Link 
                        to="/" 
                        aria-label="MONEO - ទំព័រដើម"
                        className="group flex shrink-0 items-center"
                    >
                        <MoneaLogoMark className="h-10 w-10" />
                    </Link>

                    <nav className="hidden items-center gap-3 font-kantumruy text-xs font-bold text-foreground sm:flex">
                        <Link to="/" className="transition-colors hover:text-primary">
                            ទំព័រដើម
                        </Link>
                        <a href="/#how-it-works" className="transition-colors hover:text-primary">
                            របៀបប្រើប្រាស់
                        </a>
                        <Link to="/contact" className="transition-colors hover:text-primary">
                            ទំនាក់ទំនង និងជំនួយ
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2 shrink-0 font-kantumruy">
                        <Link
                            to={AUTH_URLS.SIGN_UP}
                            className="inline-flex min-h-9 items-center justify-center rounded-full border border-primary bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5 sm:text-xs"
                        >
                            ចុះឈ្មោះ
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-foreground transition-colors hover:bg-muted sm:hidden"
                            aria-label={isMenuOpen ? "បិទម៉ឺនុយ" : "បើកម៉ឺនុយ"}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <nav className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-border bg-card p-2 shadow-xl sm:hidden">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-card-foreground hover:bg-accent">
                            ទំព័រដើម
                        </Link>
                        <a href="/#how-it-works" onClick={() => setIsMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-card-foreground hover:bg-accent">
                            របៀបប្រើប្រាស់
                        </a>
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-card-foreground hover:bg-accent">
                            ទំនាក់ទំនង និងជំនួយ
                        </Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
