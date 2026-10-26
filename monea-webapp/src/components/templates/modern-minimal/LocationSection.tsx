import React from 'react';
import { motion } from 'framer-motion';
import { WeddingData } from "../types";
import { MapPin, Navigation } from 'lucide-react';
import { getDirectMapUrl, getMapEmbedUrl, isGoogleMapsShortLink } from "../shared/mapUtils";

export const LocationSection = ({ wedding }: { wedding: WeddingData }) => {
    const venueName = wedding.location || "";
    const mapLink = wedding.themeSettings?.mapLink?.trim() || wedding.mapUrl?.trim() || "";
    const locationTitle = wedding.themeSettings?.customLabels?.locationTitle || "ទីតាំងកម្មវិធី";
    const locationSubtitle = wedding.themeSettings?.customLabels?.locationSubtitle;
    if (!venueName && !mapLink) return null;

    const hasEmbeddableMap = !isGoogleMapsShortLink(mapLink)
        && Boolean(venueName || mapLink.includes("google.com/maps/embed") || mapLink.includes("q="));
    const directMapUrl = getDirectMapUrl(mapLink, venueName);
    const mapEmbedUrl = hasEmbeddableMap ? getMapEmbedUrl(mapLink, venueName) : "";

    return (
        <section className="relative overflow-hidden bg-[#f7f1ea] px-4 py-16 sm:py-20" id="location-modern">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%)]" />

            <div className="relative z-10 mx-auto max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="mb-6 text-center">
                        <MapPin aria-hidden="true" className="mx-auto mb-3 h-5 w-5 text-[#9b8055]" />
                        <h2 className="font-khmer-moul text-xl leading-relaxed text-slate-900 sm:text-2xl">{locationTitle}</h2>
                        {locationSubtitle && <p className="mt-2 text-sm leading-7 text-slate-600">{locationSubtitle}</p>}
                        <div className="mx-auto mt-3 h-px w-12 bg-[#9b8055]/50" />
                    </div>

                    {hasEmbeddableMap && (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#d9d1c1] bg-[#e8e5dd] shadow-[0_12px_32px_rgba(55,53,47,0.08)]">
                            <iframe
                                src={mapEmbedUrl}
                                title={`Map: ${venueName || "event location"}`}
                                className="pointer-events-none absolute inset-0 h-full w-full border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                                tabIndex={-1}
                            />
                        </div>
                    )}

                    {venueName && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4">
                            <MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-[#806a47]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-500">ទីតាំងរៀបចំពិធី</p>
                                <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-800">{venueName}</p>
                            </div>
                        </div>
                    )}

                    <a
                        href={directMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#43513b] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#35412f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43513b] focus-visible:ring-offset-2"
                    >
                        <Navigation aria-hidden="true" size={16} />
                        <span>បើកទីតាំងក្នុង Google Maps</span>
                    </a>
                </motion.div>
            </div>
        </section>
    );
};
