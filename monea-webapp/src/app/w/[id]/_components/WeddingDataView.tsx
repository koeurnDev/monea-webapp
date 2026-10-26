import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiUrl } from "@/lib/api-url";
import { NETWORK_ERROR_MESSAGE } from "@/lib/network-errors";
import { optimizeMediaUrl } from "@/lib/media";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { preloadTemplate } from "@/components/templates/template-config";
import { WeddingSkeleton } from "./WeddingSkeleton";
import { GuestViewTracker } from "@/components/analytics/GuestViewTracker";
import { WeddingDataCache } from "@/lib/wedding-data-cache";
import { ErrorBoundary } from "@/components/error-boundary";
import { SEOHead } from "@/components/seo/SEOHead";

type PublicWeddingData = {
    id: string;
    groomName: string;
    brideName: string;
    date: Date | string;
    location: string | null;
    eventType: string;
    templateId: string | null;
    themeSettings: any;
    activities: any[];
    galleryItems: any[];
};

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache
const MAX_WEDDING_CACHE_ENTRIES = 12;
let weddingCacheStorage: Storage | null = null;
if (typeof window !== "undefined") {
    try {
        weddingCacheStorage = window.sessionStorage;
    } catch {
        // Memory cache remains available when browser storage is disabled.
    }
}
const weddingDataCache = new WeddingDataCache<PublicWeddingData>(
    weddingCacheStorage,
    CACHE_TTL_MS,
    MAX_WEDDING_CACHE_ENTRIES,
);

interface WeddingDataViewProps {
    id: string;
    template?: string;
    guestId?: string;
    guestName?: string;
}

export default function WeddingDataView({
    id,
    template,
    guestId: propGuestId,
    guestName: propGuestName,
}: WeddingDataViewProps) {
    const [searchParams] = useSearchParams();
    const guestNameParam = searchParams.get("to");
    const resolvedGuestName = propGuestName || (guestNameParam
        ? (() => { try { return decodeURIComponent(guestNameParam); } catch { return guestNameParam; } })()
        : undefined);
    const resolvedGuestId = propGuestId || searchParams.get("g") || searchParams.get("guestId") || undefined;

    // Check cache synchronously for 0ms reloads
    const cached = weddingDataCache.get(id);
    const [wedding, setWedding] = useState<PublicWeddingData | null>(cached);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<"not-found" | "load-failed" | null>(null);
    const [retryAttempt, setRetryAttempt] = useState(0);

    // Eagerly prefetch template chunk if already known from cache or URL
    useEffect(() => {
        const eagerTemplate = template || cached?.templateId;
        if (eagerTemplate) {
            preloadTemplate(eagerTemplate);
        }
    }, [template, cached]);

    useEffect(() => {
        let isCancelled = false;

        async function fetchWedding() {
            try {
                const url = getApiUrl(`api/wedding/${id}`);
                let res: Response | null = null;

                // This is a public endpoint. Avoid forwarding stale auth cookies
                // and retry transient edge/worker failures.
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    res = await fetch(url, {
                        credentials: "omit",
                        cache: "default",
                    });

                    if (![408, 425, 429, 500, 502, 503, 504].includes(res.status)) {
                        break;
                    }

                    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
                }

                if (isCancelled) return;

                if (!res) {
                    throw new Error("Wedding request did not return a response");
                }

                if (!res.ok) {
                    if (res.status === 404) {
                        setError("not-found");
                        return;
                    }
                    if (!wedding) {
                        throw new Error("Failed to fetch wedding");
                    }
                    return;
                }

                const data: PublicWeddingData = await res.json();
                if (isCancelled) return;

                setWedding(data);
                weddingDataCache.set(id, data);
                setError(null);

                // Prefetch the template code immediately as soon as API responds
                if (data.templateId) {
                    preloadTemplate(data.templateId);
                }
            } catch (e) {
                console.error("[WeddingDataView] Fetch error:", e);
                if (!wedding) setError("load-failed");
            } finally {
                if (!isCancelled) setLoading(false);
            }
        }

        fetchWedding();

        return () => {
            isCancelled = true;
        };
        // wedding is used solely to avoid replacing already cached data on background revalidation failure
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, retryAttempt]);

    if (loading && !wedding) {
        return <WeddingSkeleton />;
    }

    if (error || !wedding) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[#FDFBF7] p-4 sm:p-6">
                <div className="w-full min-w-0 max-w-md rounded-3xl border border-black/5 bg-white p-5 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
                    <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-black" aria-hidden="true">
                        {error === "not-found" ? "404" : "!"}
                    </div>
                    <h1 className="mb-3 break-words font-kantumruy text-xl font-black leading-snug tracking-tight text-slate-800 sm:text-2xl">
                        {error === "not-found" ? "រកមិនឃើញទំព័រនេះទេ" : "មិនអាចផ្ទុកសំបុត្រអញ្ជើញបានទេ"}
                    </h1>
                    <p className="mb-6 break-words font-kantumruy text-sm font-medium leading-relaxed text-slate-500 sm:mb-8">
                        {error === "not-found"
                            ? "ទំព័រដែលអ្នកកំពុងស្វែងរកប្រហែលជាត្រូវបានលុប ប្ដូរឈ្មោះ ឬមិនមានតាំងពីដំបូង។"
                            : NETWORK_ERROR_MESSAGE}
                    </p>
                    {error === "load-failed" && (
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                setRetryAttempt((attempt) => attempt + 1);
                            }}
                            className="mb-3 inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-rose-600 px-4 py-3 font-kantumruy text-sm font-black text-white shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.99] sm:px-6"
                        >
                            ព្យាយាមម្តងទៀត
                        </button>
                    )}
                    <a href="/" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 px-4 py-3 font-kantumruy text-sm font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.99] sm:px-6">
                        ត្រឡប់ទៅទំព័រដើម
                    </a>
                </div>
            </div>
        );
    }

    if (!wedding.templateId) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[#FDFBF7] p-4 sm:p-6">
                <div className="w-full min-w-0 max-w-md rounded-3xl border border-black/5 bg-white p-5 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
                        🎨
                    </div>
                    <h1 className="mb-3 break-words font-kantumruy text-xl font-black leading-snug tracking-tight text-slate-800 sm:text-2xl">សំបុត្រមិនទាន់រួចរាល់ទេ</h1>
                    <p className="mb-6 break-words font-kantumruy text-sm font-medium leading-relaxed text-slate-500 sm:mb-8">
                        សូមបងធ្វើការរចនា (Design) Template សម្រាប់សំបុត្រអញ្ជើញជាមុនសិន។ សូមចុចប៊ូតុងខាងក្រោម៖
                    </p>
                    <a href="/dashboard/design" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 font-kantumruy text-sm font-black text-white shadow-xl shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.99] sm:px-6">
                        ទៅកាន់ការរចនាឥឡូវនេះ
                    </a>
                </div>
            </div>
        );
    }

    // Parse theme settings
    let themeSettings: any = {};
    try {
        if (typeof wedding.themeSettings === "string") {
            themeSettings = JSON.parse(wedding.themeSettings);
        } else if (wedding.themeSettings) {
            themeSettings = wedding.themeSettings;
        }
    } catch (e) {
        console.error("Failed to parse themeSettings", e);
    }

    let parsedActivities = wedding.activities || [];
    if (typeof parsedActivities === "string") {
        try { parsedActivities = JSON.parse(parsedActivities); } catch { parsedActivities = []; }
    }

    let parsedGalleryItems = wedding.galleryItems || [];
    if (typeof parsedGalleryItems === "string") {
        try { parsedGalleryItems = JSON.parse(parsedGalleryItems); } catch { parsedGalleryItems = []; }
    }
    if (themeSettings.galleryItems && Array.isArray(themeSettings.galleryItems)) {
        parsedGalleryItems = themeSettings.galleryItems;
    }

    // High performance media optimization (reduces payload by up to 95%)
    const optimizedThemeSettings = { ...themeSettings };
    for (const key of ["heroImage", "coverImageUrl"] as const) {
        const imageUrl = optimizedThemeSettings[key];
        if (typeof imageUrl === "string") {
            optimizedThemeSettings[key] = optimizeMediaUrl(imageUrl, { width: 1200, quality: 78 });
        }
    }

    parsedGalleryItems = parsedGalleryItems.map((item: any) => {
        const mediaType = typeof item?.type === "string" ? item.type.toUpperCase() : "";
        if (
            !item ||
            typeof item !== "object" ||
            mediaType === "VIDEO" ||
            typeof item.url !== "string" ||
            /\.(?:pdf|mp3|mp4|webm|mov|m4v)(?:$|[?#])/i.test(item.url)
        ) {
            return item;
        }
        return {
            ...item,
            url: optimizeMediaUrl(item.url, { width: 800, quality: 75 }),
        };
    });

    const weddingForTemplate = {
        ...wedding,
        themeSettings: optimizedThemeSettings,
        activities: parsedActivities,
        galleryItems: parsedGalleryItems,
        eventType: (wedding.eventType || "wedding") as "wedding" | "anniversary",
        guestId: resolvedGuestId,
    } as any;

    const customShareTitle = wedding.themeSettings?.customLabels?.invite_title?.trim();
    const shareTitle = customShareTitle || `${wedding.groomName || "កូនកំលោះ"} & ${wedding.brideName || "កូនក្រមុំ"} - អាពាហ៍ពិពាហ៍ | MONEO`;
    const shareDesc = `សូមគោរពអញ្ជើញចូលរួមពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ ${wedding.date ? "នៅថ្ងៃ " + new Date(wedding.date).toLocaleDateString("km-KH", { dateStyle: "full" }) : ""}`;
    const imageSource = [
        weddingForTemplate.themeSettings?.socialPreviewImage,
        weddingForTemplate.themeSettings?.heroImage,
        weddingForTemplate.galleryItems?.[0]?.url,
    ].find((candidate): candidate is string =>
        typeof candidate === "string" && candidate.length > 0 && !/^(?:data|blob):/i.test(candidate)
    ) || "/icons/logomoneo.webp";
    const optimizedHeroImage = optimizeMediaUrl(imageSource, {
        width: 1200,
        height: 630,
        quality: "auto",
        crop: "fill",
    });
    const seoImage = new URL("/icons/SE.png", window.location.origin).href;

    const requestedTemplate = template || wedding.templateId || "blossom-romance";
    const selectedTemplate = wedding.eventType === "anniversary" && requestedTemplate === "anniversary-elegant"
        ? "blossom-romance"
        : requestedTemplate;

    // Format wedding date for structured data
    const weddingDate = wedding.date ? new Date(wedding.date) : null;
    const weddingISODate = weddingDate?.toISOString();
    const locationName = wedding.location || "កម្ពុជា";
    
    // Event type for structured data
    const eventTypeName = wedding.eventType === "anniversary" ? "ខួបអនុស្សាវរីយ៍" : "មង្គលការ";
    
    return (
        <>
            <SEOHead
                title={shareTitle}
                description={shareDesc}
                canonical={`${window.location.origin}/w/${encodeURIComponent(wedding.id)}`}
                ogImage={seoImage}
                ogImageAlt="MONEO — ធៀបអញ្ជើញមង្គលការឌីជីថលនៅកម្ពុជា"
                ogType="website"
                robots={resolvedGuestId || resolvedGuestName
                    ? "noindex, nofollow, noimageindex, max-image-preview:none"
                    : "index, follow, noimageindex, max-image-preview:none"}
                keywords={`${wedding.groomName}, ${wedding.brideName}, មង្គលការ, wedding invitation Cambodia, ធៀបការឌីជីថល`}
                structuredData={[
                    // Event Schema
                    {
                        "@context": "https://schema.org",
                        "@type": "Event",
                        "name": `${eventTypeName}របស់ ${wedding.groomName} និង ${wedding.brideName}`,
                        "description": shareDesc,
                        "startDate": weddingISODate || new Date().toISOString(),
                        "endDate": weddingISODate || new Date().toISOString(),
                        "eventStatus": "https://schema.org/EventScheduled",
                        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                        "location": {
                            "@type": "Place",
                            "name": locationName,
                            "address": {
                                "@type": "PostalAddress",
                                "addressCountry": "KH"
                            }
                        },
                        "image": seoImage,
                        "organizer": {
                            "@type": "Person",
                            "name": `${wedding.groomName} & ${wedding.brideName}`
                        },
                        "url": `${window.location.origin}/w/${encodeURIComponent(wedding.id)}`
                    },
                    // Breadcrumb Schema
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "ទំព័រដើម",
                                "item": window.location.origin
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": `${wedding.groomName} & ${wedding.brideName}`,
                                "item": `${window.location.origin}/w/${encodeURIComponent(wedding.id)}`
                            }
                        ]
                    }
                ]}
            >
                {/* Performance Preloads */}
                {optimizedHeroImage && (
                    <link rel="preload" as="image" href={optimizedHeroImage} fetchPriority="high" />
                )}
                <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            </SEOHead>

            {resolvedGuestId && (
                <GuestViewTracker
                    weddingId={weddingForTemplate.id}
                    guestId={resolvedGuestId}
                    guestName={resolvedGuestName}
                />
            )}

            <main className="relative isolate z-10 min-h-screen bg-transparent font-kantumruy">
                <div className="w-full min-h-screen scroll-smooth" id="mobile-scroll-container">
                    <Suspense fallback={<WeddingSkeleton />}>
                        <ErrorBoundary
                            name={`Wedding template ${selectedTemplate}`}
                            fallback={
                                <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0d12] px-4 py-8 text-center text-white">
                                    <div className="max-w-sm space-y-4">
                                        <h1 className="font-kantumruy text-xl font-black">មិនអាចបង្ហាញធៀបការបានទេ</h1>
                                        <p className="font-kantumruy text-sm leading-7 text-white/70">
                                            សូមផ្ទុកទំព័រឡើងវិញ ឬទាក់ទងក្រុមការងារ ប្រសិនបើបញ្ហានេះនៅតែបន្ត។
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="rounded-xl bg-white px-5 py-3 font-kantumruy text-sm font-bold text-slate-900"
                                        >
                                            ផ្ទុកឡើងវិញ
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            <TemplateRenderer
                                wedding={weddingForTemplate}
                                templateId={selectedTemplate}
                                guestName={resolvedGuestName}
                            />
                        </ErrorBoundary>
                    </Suspense>
                </div>
            </main>
        </>
    );
}