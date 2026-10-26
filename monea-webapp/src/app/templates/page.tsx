import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AUTH_URLS } from '@/lib/constants';
import { NavBar } from '@/components/landing/NavBar';
import { Footer } from '@/components/landing/StaticSections';
import {
    normalizeTemplatePresentationMetadata,
    TEMPLATE_CATALOG,
    type TemplatePresentationMetadata,
} from '@/components/templates/template-config';
import { moneaClient } from '@/lib/api-client';

const TEMPLATES = TEMPLATE_CATALOG;

type PublicTemplatePrice = {
    price: number;
    isFree: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

function normalizePublicTemplatePricing(value: unknown): Record<string, PublicTemplatePrice> {
    if (!isRecord(value)) return {};
    const payload = isRecord(value.data) ? value.data : value;
    const pricing = isRecord(payload.templatePricing) ? payload.templatePricing : payload;

    return Object.fromEntries(
        Object.entries(pricing).flatMap(([templateId, entry]) => {
            if (!isRecord(entry)) return [];
            const price = Number(entry.price ?? entry.amount);
            if (!Number.isFinite(price) || price < 0 || price > 99.99) return [];
            return [[templateId, { price, isFree: entry.isFree === true || price === 0 }]];
        }),
    );
}

const FILTER_LABELS = {
    all: 'ទាំងអស់',
    wedding: 'មង្គលការ',
    anniversary: 'ខួបអនុស្សាវរីយ៍',
} as const;

export default function TemplateGalleryPage() {
    const [filter, setFilter] = useState<'all' | 'wedding' | 'anniversary'>('all');
    const [presentationMetadata, setPresentationMetadata] = useState<Record<string, TemplatePresentationMetadata> | null>(null);
    const [templatePricing, setTemplatePricing] = useState<Record<string, PublicTemplatePrice>>({});

    useEffect(() => {
        let cancelled = false;

        const loadPresentationMetadata = async () => {
            try {
                const response = await moneaClient.get<unknown>('/api/templates/metadata', { cache: 'no-store' });
                if (response.error || !response.data) {
                    throw new Error(response.error || 'Template metadata response was empty');
                }

                const metadata = normalizeTemplatePresentationMetadata(response.data);
                if (!cancelled) {
                    setPresentationMetadata(metadata);
                }
            } catch (error) {
                console.error('[TemplateGalleryPage] Failed to load template metadata:', error);
            }
        };

        const loadTemplatePricing = async () => {
            const response = await moneaClient.get<unknown>('/api/template-pricing', { cache: 'no-store' });
            if (response.error || !response.data) {
                console.error('[TemplateGalleryPage] Failed to load template pricing:', response.error || 'Pricing response was empty');
                return;
            }
            if (!cancelled) {
                setTemplatePricing(normalizePublicTemplatePricing(response.data));
            }
        };

        void loadPresentationMetadata();
        void loadTemplatePricing();
        return () => {
            cancelled = true;
        };
    }, []);

    const galleryTemplates = TEMPLATES.map((template) => {
        const metadata = presentationMetadata?.[template.id];
        return {
            ...template,
            title: metadata?.title ?? template.title,
            description: metadata?.description ?? template.description,
            image: metadata?.image ?? template.image,
            eventType: metadata?.eventType ?? template.eventType,
        };
    });
    const filteredTemplates = galleryTemplates.filter((template) =>
        filter === 'all' || template.eventType === filter || template.eventType === 'both',
    );
    const heroTemplateImage = galleryTemplates.find((template) => template.id === 'blossom-romance')?.image
        ?? TEMPLATE_CATALOG.find((template) => template.id === 'blossom-romance')?.image;

    return (
        <>
        <Helmet>
            <title>MONEO | Khmer Digital Wedding Invitation Templates | គំរូធៀបការឌីជីថល</title>
            <meta name="description" content="មើលគំរូធៀបអាពាហ៍ពិពាហ៍ឌីជីថលជាភាសាខ្មែរ ជ្រើសរើសរចនាបថ និងចាប់ផ្តើមបង្កើតធៀបសម្រាប់ថ្ងៃពិសេសរបស់អ្នកជាមួយ MONEO។" />
            <link rel="canonical" href="https://moneoez.com/templates" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="MONEO" />
            <meta property="og:url" content="https://moneoez.com/templates" />
            <meta property="og:title" content="MONEO | Khmer Digital Wedding Invitation Templates | គំរូធៀបការឌីជីថល" />
            <meta property="og:description" content="ស្វែងរកគំរូធៀបមង្គលការ និងគំរូខួបអនុស្សាវរីយ៍ដែលសមនឹងអ្នក។" />
            <meta property="og:image" content="https://moneoez.com/icons/SE.png" />
            <meta property="og:image:alt" content="គំរូធៀបអាពាហ៍ពិពាហ៍ឌីជីថលពី MONEO" />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content="https://moneoez.com/templates" />
            <meta name="twitter:title" content="MONEO | Khmer Digital Wedding Invitation Templates | គំរូធៀបការឌីជីថល" />
            <meta name="twitter:description" content="ស្វែងរកគំរូធៀបមង្គលការ និងគំរូខួបអនុស្សាវរីយ៍ដែលសមនឹងអ្នក។" />
            <meta name="twitter:image" content="https://moneoez.com/icons/SE.png" />
            <meta name="twitter:image:alt" content="គំរូធៀបអាពាហ៍ពិពាហ៍ឌីជីថលពី MONEO" />
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: "MONEO | Khmer Digital Wedding Invitation Templates | គំរូធៀបការឌីជីថល",
                url: "https://moneoez.com/templates",
                description: "មើលគំរូធៀបអាពាហ៍ពិពាហ៍ឌីជីថលជាភាសាខ្មែរ និងជ្រើសរើសរចនាបថសម្រាប់ថ្ងៃពិសេសរបស់អ្នក។",
                isPartOf: { "@id": "https://moneoez.com/#website" },
                mainEntity: {
                    "@type": "ItemList",
                    itemListElement: TEMPLATES.map((template, index) => ({
                        "@type": "ListItem",
                        position: index + 1,
                        name: template.title,
                        url: "https://moneoez.com/templates",
                    })),
                },
                inLanguage: "km-KH",
            })}</script>
        </Helmet>
        <div className="min-h-screen overflow-hidden bg-[#f5f2eb] font-kantumruy text-[#1c2e28] transition-colors duration-300 dark:bg-[#0d1210] dark:text-[#f1eee6]">
            <NavBar />
            <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-10">
                <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#173d32] px-6 py-8 text-[#f7f2e8] shadow-[0_30px_80px_rgba(27,51,42,.16)] sm:rounded-[2.5rem] sm:px-10 sm:py-10 lg:px-16 lg:py-12">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full border border-[#d8c69a]/20 sm:right-8 sm:top-1/2 sm:-translate-y-1/2">
                        <div className="absolute inset-8 rounded-full border border-[#d8c69a]/15" />
                        <div className="absolute inset-16 rounded-full border border-[#d8c69a]/10" />
                    </div>
                    <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.72fr]">
                        <div className="relative z-10">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7d7b1]/25 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#e6d8b8]">
                                <Sparkles size={13} />
                                MONEO · DIGITAL INVITATIONS
                            </div>
                            <h1 className="max-w-2xl text-3xl font-bold leading-[1.5] tracking-tight sm:text-4xl lg:text-5xl">
                                ធៀបដ៏មានន័យ<br className="hidden sm:block" /> សម្រាប់ថ្ងៃដ៏ពិសេស
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-[#f7f2e8]/70 sm:text-base sm:leading-8">
                                ជ្រើសរើសមើលរូបគម្របគំរូដែលអ្នកពេញចិត្ត រួចចាប់ផ្តើមបង្កើតធៀបផ្ទាល់ខ្លួនរបស់អ្នក។
                            </p>
                            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#f7f2e8]/70">
                                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d8c69a]" />{TEMPLATES.length} គំរូរចនា</span>
                                <span className="hidden h-4 w-px bg-white/20 sm:block" />
                                <span>សម្រាប់មង្គលការ និងពិធីភ្ជាប់ពាក្យ</span>
                            </div>
                        </div>

                        <div aria-hidden="true" className="relative mx-auto hidden h-[220px] w-full max-w-[320px] lg:block lg:h-[250px]">
                            <div className="absolute right-5 top-6 h-[200px] w-[142px] rotate-[10deg] rounded-[1.4rem] border border-[#eadbb9]/30 bg-[#f1e8d5] p-2 shadow-2xl">
                                {heroTemplateImage && <img src={heroTemplateImage} alt="" className="h-full w-full rounded-[1rem] object-cover" />}
                            </div>
                            <div className="absolute left-8 top-1 flex h-[220px] w-[156px] -rotate-[7deg] flex-col items-center justify-center overflow-hidden rounded-[1.4rem] border border-[#d9c89e]/60 bg-[#e9e0cd] p-5 text-center text-[#244136] shadow-2xl">
                                <div className="absolute inset-2 border border-[#9d8558]/35" />
                                <img src="/khmer-invite-starter-kit/elements/crest.svg" alt="" className="relative h-12 w-12 opacity-80" />
                                <span className="relative mt-4 font-serif text-[9px] uppercase tracking-[0.3em] text-[#8d7448]">Save the date</span>
                                <span className="relative mt-2 font-khmer-moul text-lg">សិរីមង្គល</span>
                                <span className="relative mt-2 h-px w-10 bg-[#a68d5d]/60" />
                                <span className="relative mt-2 font-serif text-[8px] tracking-[0.22em] text-[#8d7448]">MONEO · 2026</span>
                            </div>
                            <div className="absolute bottom-2 right-0 flex h-12 w-12 items-center justify-center rounded-full border border-[#e7d7b1]/25 bg-[#214a3e] text-[#e7d7b1] shadow-lg">
                                <Heart size={17} strokeWidth={1.4} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-10 sm:py-14" aria-labelledby="template-list-heading">
                    <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#8c7955]">The collection</p>
                            <h2 id="template-list-heading" className="text-2xl font-bold tracking-tight text-[#1c2e28] dark:text-[#f1eee6] sm:text-3xl">ជ្រើសរើសរចនាបថរបស់អ្នក</h2>
                            <p className="mt-2 text-sm text-[#6d756e] dark:text-[#a7afa8]">មើលរូបគម្រប ឈ្មោះ ព័ត៌មាន និងតម្លៃរបស់គំរូនីមួយៗ។</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-xs text-[#7b817b] dark:text-[#a7afa8] sm:inline">បង្ហាញ {filteredTemplates.length} គំរូ</span>
                            <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-[#dfd9cc] bg-[#fbfaf7] p-1 dark:border-white/10 dark:bg-white/[0.04] sm:w-auto">
                                {(['all', 'wedding', 'anniversary'] as const).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setFilter(item)}
                                        aria-pressed={filter === item}
                                        className={cn(
                                            'shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527568] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f2eb] dark:focus-visible:ring-offset-[#0d1210]',
                                            filter === item ? 'bg-[#21483b] text-white shadow-sm dark:bg-[#b8c8ae] dark:text-[#17251e]' : 'text-[#6c756e] hover:bg-[#eeeae1] hover:text-[#21382e] dark:text-[#b4bcb5] dark:hover:bg-white/[0.08] dark:hover:text-white',
                                        )}
                                    >
                                        {FILTER_LABELS[item]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredTemplates.map((template, templateIndex) => {
                                return (
                                    <article
                                        key={template.id}
                                            aria-label={`គំរូ ${template.code}: ${template.title}`}
                                        className="overflow-hidden rounded-[1.4rem] border border-[#e3ded3] bg-[#fbfaf7] shadow-[0_8px_24px_rgba(48,55,46,.05)] dark:border-white/10 dark:bg-[#171e1a] dark:shadow-[0_12px_30px_rgba(0,0,0,.22)]"
                                    >
                                        <div className="relative aspect-[1.08/1] overflow-hidden bg-[#e9e3d5] dark:bg-[#242a25]">
                                            {template.image ? (
                                                <img
                                                    src={template.image}
                                                    alt=""
                                                    loading={templateIndex < 2 ? 'eager' : 'lazy'}
                                                    fetchPriority={templateIndex === 0 ? 'high' : 'auto'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#e9e3d5] via-[#e2e8df] to-[#d9d2c4] dark:from-[#242a25] dark:via-[#202923] dark:to-[#29271f]" />
                                            )}
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14231d]/65 via-transparent to-[#14231d]/10" />
                                            <div className="absolute left-4 top-4">
                                                <span className="rounded-full border border-white/45 bg-[#fbfaf7]/90 px-3 py-1 text-xs font-bold tracking-[0.16em] text-[#25392f] shadow-sm backdrop-blur-sm dark:border-white/25 dark:bg-[#111714]/85 dark:text-[#f1eee6]">
                                                    {template.code}
                                                </span>
                                            </div>
                                        </div>
                                        {templatePricing[template.id] && (
                                            <div className="p-4 sm:p-5">
                                                <span className="inline-flex rounded-full bg-[#e9eee7] px-3 py-1 text-xs font-bold text-[#315844] dark:bg-white/10 dark:text-[#c5d8c2]">
                                                    {templatePricing[template.id].isFree
                                                        ? 'ឥតគិតថ្លៃ'
                                                        : `$${templatePricing[template.id].price.toFixed(2)}`}
                                                </span>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e1dbce] bg-[#ebe7dc] px-5 py-5 dark:border-white/10 dark:bg-[#171e1a] sm:flex-row sm:px-7">
                        <div>
                            <p className="text-sm font-semibold text-[#26392f] dark:text-[#f1eee6]">បានរកឃើញរចនាបថដែលអ្នកចូលចិត្តហើយឬនៅ?</p>
                            <p className="mt-1 text-xs text-[#687168] dark:text-[#a7afa8]">ចាប់ផ្តើមបង្កើតធៀបផ្ទាល់ខ្លួនរបស់អ្នកបានភ្លាមៗ។</p>
                        </div>
                        <Button asChild className="h-11 w-full rounded-full bg-[#21483b] px-6 text-xs font-semibold text-white hover:bg-[#183a30] dark:bg-[#b8c8ae] dark:text-[#17251e] dark:hover:bg-[#c9d7c0] sm:w-auto">
                            <Link to={AUTH_URLS.SIGN_UP}>ចាប់ផ្តើមបង្កើតធៀប <ChevronRight size={15} /></Link>
                        </Button>
                    </div>
                </section>
            </main>
            <Footer />

        </div>
        </>
    );
}
