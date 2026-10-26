import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SmoothScroll from "@/components/layout/SmoothScroll";
import PageTransition from "@/components/layout/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/LanguageProvider";
import { createLegalDocument, isLegalContent, parseLegalBody, type LegalDocument } from "@/lib/legal-content";
import { moneaClient } from "@/lib/api-client";

type LegalDocumentKey = "privacy" | "terms";

export function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
    const { t, locale } = useTranslation();
    const [savedDocumentState, setSavedDocumentState] = useState<{
        documentKey: LegalDocumentKey;
        locale: "km" | "en";
        document: LegalDocument;
    } | null>(null);
    const translation = t(`common.${documentKey}`, { returnObjects: true });
    const fallbackDocument = createLegalDocument(translation);

    useEffect(() => {
        let cancelled = false;

        const loadLegalContent = async () => {
            const response = await moneaClient.get<{ content: unknown }>("/api/system/legal-content", { cache: "no-store" });
            if (cancelled) return;
            if (response.error) {
                console.error(`[LegalDocumentPage] Could not load ${documentKey}:`, response.error);
                return;
            }
            if (!response.data || response.data.content === null) return;
            if (!isLegalContent(response.data.content)) {
                console.error(`[LegalDocumentPage] Invalid ${documentKey} content response`);
                return;
            }
            setSavedDocumentState({
                documentKey,
                locale,
                document: response.data.content[documentKey][locale],
            });
        };

        void loadLegalContent();
        return () => { cancelled = true; };
    }, [documentKey, locale]);

    const savedDocument = savedDocumentState?.documentKey === documentKey && savedDocumentState.locale === locale
        ? savedDocumentState.document
        : null;
    const document = savedDocument || fallbackDocument;
    const pageUrl = `https://moneoez.com/${documentKey === "privacy" ? "privacy-policy" : "terms-and-conditions"}`;
    const description = documentKey === "privacy"
        ? "ស្វែងយល់អំពីរបៀបដែល MONEO ប្រមូល ប្រើប្រាស់ និងការពារព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នក។"
        : "សូមអានលក្ខខណ្ឌនៃការប្រើប្រាស់សេវាកម្មបង្កើតធៀបអាពាហ៍ពិពាហ៍ឌីជីថលរបស់ MONEO។";
    const fallbackSections = Object.keys(translation)
        .filter((key) => /^s\d+$/.test(key))
        .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

    return (
        <>
        <Helmet>
            <title>{document.title} | MONEO</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={pageUrl} />
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="MONEO" />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:title" content={`${document.title} | MONEO`} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content="https://moneoez.com/icons/logomoneo.webp" />
            <meta property="og:image:type" content="image/webp" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:url" content={pageUrl} />
            <meta name="twitter:title" content={`${document.title} | MONEO`} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content="https://moneoez.com/icons/logomoneo.webp" />
        </Helmet>
        <SmoothScroll>
            <PageTransition>
                <div className="min-h-screen bg-background font-kantumruy text-foreground transition-colors duration-300">
                    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
                        <div className="container relative mx-auto flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6">
                            <Link to="/" className="group flex max-w-[42%] items-center gap-1.5 truncate text-xs text-primary transition-colors hover:text-sage sm:gap-2 sm:text-sm">
                                <ArrowLeft size={17} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                                {t("common.auth.backToHome")}
                            </Link>
                            <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-widest text-primary sm:text-xl">
                                {t("common.constants.brandName")}
                            </span>
                            <ThemeToggle className="h-9 w-9 border border-border bg-card text-primary hover:bg-accent" />
                        </div>
                    </header>

                    <main className="container mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-24 sm:space-y-12 sm:px-6 sm:pb-24 sm:pt-32">
                        <div className="space-y-3 text-center sm:space-y-4">
                            <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{document.title}</h1>
                            <p className="text-gold">{document.lastUpdated}</p>
                        </div>

                        {savedDocument ? (
                            <div className="prose max-w-none space-y-7 break-words text-sm leading-8 text-foreground marker:text-sage sm:space-y-8 sm:text-base sm:leading-relaxed dark:prose-invert">
                                {parseLegalBody(document.body).map((block, index) => {
                                    if (block.type === "heading") {
                                        return <h2 key={index} className="mb-3 break-words text-xl font-bold text-primary sm:mb-4 sm:text-2xl">{block.text}</h2>;
                                    }
                                    if (block.type === "list") {
                                        return <ul key={index} className="mt-3 list-disc space-y-2 pl-5 sm:mt-4 sm:pl-6">{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
                                    }
                                    return <p key={index} className="whitespace-pre-line">{block.text}</p>;
                                })}
                            </div>
                        ) : (
                            <div className="prose max-w-none space-y-7 break-words text-sm leading-8 text-foreground marker:text-sage sm:space-y-8 sm:text-base sm:leading-relaxed dark:prose-invert">
                                {fallbackSections.map((sectionKey) => {
                                    const section = translation[sectionKey];
                                    return (
                                        <section key={sectionKey}>
                                            <h2 className="mb-3 break-words text-xl font-bold text-primary sm:mb-4 sm:text-2xl">{section.title}</h2>
                                            {Object.entries(section).filter(([key]) => key !== "title").map(([key, value]) => {
                                                if (Array.isArray(value)) {
                                                    return (
                                                        <ul key={key} className="mt-3 list-disc space-y-2 pl-5 sm:mt-4 sm:pl-6">
                                                            {value.map((item, index) => {
                                                                if (key !== "items" || typeof item !== "string") return <li key={index}>{item}</li>;
                                                                const match = item.match(/^([^៖:]+)([៖:])\s*(.*)$/);
                                                                return <li key={index}>{match ? <><strong>{match[1]}{match[2]}</strong> {match[3]}</> : item}</li>;
                                                            })}
                                                        </ul>
                                                    );
                                                }
                                                if (typeof value === "string") {
                                                    const match = (key === "email" || key === "phone") ? value.match(/^([^៖:]+)([៖:])\s*(.*)$/) : null;
                                                    return <p key={key} className="mt-4 first:mt-0">{match ? <><strong>{match[1]}{match[2]}</strong> {match[3]}</> : value}</p>;
                                                }
                                                return null;
                                            })}
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </main>

                    <footer className="border-t border-border py-8">
                        <div className="container mx-auto px-6 text-center">
                            <p className="text-sm text-muted-foreground">{t("common.footer.copyright")}</p>
                        </div>
                    </footer>
                </div>
            </PageTransition>
        </SmoothScroll>
        </>
    );
}
