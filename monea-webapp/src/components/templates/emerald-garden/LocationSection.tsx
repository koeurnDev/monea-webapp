import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { WeddingData } from '../types';
import { getDirectMapUrl, getMapEmbedUrl, isGoogleMapsShortLink } from '../shared/mapUtils';
import { getWeddingHeroImage, getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { PhotoImage } from "../shared/PhotoImage";

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

    const directUrl = getDirectMapUrl(mapLocation, location);
    const embedUrl = !isGoogleMapsShortLink(mapLocation) ? getMapEmbedUrl(mapLocation, location) : null;
    const locationPhoto = getWeddingSectionPhoto(wedding, "location")?.url || getWeddingHeroImage(wedding);

    return (
        <section className="relative overflow-hidden bg-emerald-50/30 px-4 py-12 text-center font-kantumruy sm:px-6" style={{ backgroundColor: "var(--emerald-card-surface)" }}>
            <div className="relative z-10 mx-auto max-w-md space-y-6">
                <div className="space-y-1">
                    <h2 className="block font-khmer-moul text-xl text-[#1B4332] sm:text-2xl">
                        {locationTitle}
                    </h2>
                    {locationSubtitle && <p className="mt-2 text-sm leading-relaxed text-emerald-900/70">{locationSubtitle}</p>}
                    <div className="mx-auto h-0.5 w-12 bg-gradient-to-r from-transparent via-emerald-600 to-transparent" />
                </div>

                <div className={`grid items-center gap-4 text-left ${locationPhoto ? "grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "grid-cols-1"}`}>
                    {locationPhoto && (
                        <div className="aspect-[4/3] overflow-hidden">
                            <PhotoImage
                                src={locationPhoto}
                                alt="រូបភាពទីតាំងប្រារព្ធពិធី"
                                className="h-full w-full object-cover"
                                sizes="(max-width: 640px) 50vw, 400px"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="flex min-w-0 items-start gap-2 text-left text-sm font-bold leading-relaxed text-emerald-900">
                        <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                        <span className="break-words">{location || mapLink}</span>
                    </div>
                </div>

                {embedUrl && (
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-emerald-900/10 bg-white">
                        <iframe
                            title={`ផែនទីបង្ហាញទីតាំង ${location || "កម្មវិធី"}`}
                            src={embedUrl}
                            className="h-full w-full border-0"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                )}

                <div>
                    <a
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-98"
                    >
                        <Navigation size={14} />
                        <span>បើកមើលផ្លូវតាម Google Maps</span>
                    </a>
                </div>
            </div>
        </section>
    );
};
