import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { WeddingData } from '../types';
import { getDirectMapUrl, getMapEmbedUrl } from '../shared/mapUtils';

interface LocationSectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ wedding, primaryColor }) => {
    const location = wedding.location?.trim() || "";
    const locationTitle = wedding.themeSettings?.customLabels?.locationTitle || "ទីតាំងប្រារព្ធពិធី";
    const locationSubtitle = wedding.themeSettings?.customLabels?.locationSubtitle;
    const mapLink = wedding.themeSettings?.mapLink?.trim() || wedding.mapUrl?.trim() || "";
    const mapLocation = mapLink || location;
    if (!mapLocation) return null;

    const canEmbedMap = !mapLocation.startsWith("http")
        || mapLocation.includes("google.com/maps/embed")
        || (mapLocation.includes("google.com") && mapLocation.includes("q="));
    const embedUrl = canEmbedMap ? getMapEmbedUrl(mapLocation, location) : null;
    const directUrl = getDirectMapUrl(mapLocation, location);

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/60 to-[#fffaf8] px-4 py-12 text-center font-kantumruy sm:px-6 sm:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-rose-200/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-4 h-40 w-40 rounded-full bg-amber-100/40 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-md">
                <header className="mb-6">
                    <span
                        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-rose-200/80 bg-white/80 shadow-sm"
                        style={{ color: primaryColor }}
                    >
                        <MapPin aria-hidden="true" size={20} />
                    </span>
                    <h2 className="font-khmer-moul text-xl leading-relaxed text-[#70404e] sm:text-2xl">
                        {locationTitle}
                    </h2>
                    {locationSubtitle && <p className="mt-2 text-sm leading-relaxed text-[#6c6253]">{locationSubtitle}</p>}
                    <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
                </header>

                <div className="rounded-2xl border border-rose-100 bg-white/85 p-3 shadow-[0_12px_32px_rgba(112,64,78,0.10)] sm:p-4">
                    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-rose-50/70 px-3 py-3 text-left">
                        <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={18} style={{ color: primaryColor }} />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#97727d]">ទីតាំងរៀបចំពិធី</p>
                            <p className="mt-1 break-words text-sm font-bold leading-7 text-[#49343a] [overflow-wrap:anywhere]">
                                {location || mapLink}
                            </p>
                        </div>
                    </div>

                    {embedUrl && (
                        <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border border-rose-100 bg-rose-50">
                            <iframe
                                title={`ផែនទីបង្ហាញទីតាំង ${location || "ប្រារព្ធពិធី"}`}
                                src={embedUrl}
                                className="h-full w-full border-0"
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    )}

                    <a
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#814756] px-4 py-3 text-sm font-bold text-white shadow-[0_5px_14px_rgba(112,64,78,0.2)] transition hover:bg-[#6e3948] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#814756] focus-visible:ring-offset-2 active:scale-[0.99]"
                    >
                        <Navigation aria-hidden="true" size={16} />
                        <span>បើកទីតាំងក្នុង Google Maps</span>
                    </a>
                </div>
            </div>
        </section>
    );
};
