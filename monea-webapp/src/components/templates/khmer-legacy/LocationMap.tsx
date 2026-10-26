import * as React from 'react';
import { m } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { RevealSection } from '../shared/CinematicComponents';
import { WeddingData } from '../types';
import { getDirectMapUrl, getMapEmbedUrl, isGoogleMapsShortLink } from '../shared/mapUtils';
import { getWeddingPhotoAtSlot } from '../shared/weddingPhotos';

interface LocationMapProps {
    wedding: WeddingData;
    mapPan: any;
}

export function LocationMap({ wedding, mapPan }: LocationMapProps) {
    const mapLink = wedding.themeSettings?.mapLink || wedding.mapUrl || "";
    const locationText = wedding.location || "";
    const locationTitle = wedding.themeSettings?.customLabels?.locationTitle || "ទីតាំងកម្មវិធី";
    const locationSubtitle = wedding.themeSettings?.customLabels?.locationSubtitle;
    if (!mapLink && !locationText) return null;

    const portraitImage = getWeddingPhotoAtSlot(wedding, "location")?.url
        || getWeddingPhotoAtSlot(wedding, "locationBackup")?.url
        || getWeddingPhotoAtSlot(wedding, "couple")?.url
        || getWeddingPhotoAtSlot(wedding, "cover")?.url;
    const directMapUrl = getDirectMapUrl(mapLink, locationText);
    const mapLocation = mapLink || locationText;
    const embedUrl = !isGoogleMapsShortLink(mapLocation) ? getMapEmbedUrl(mapLocation, locationText) : null;

    return (
        <section id="location" className="relative overflow-hidden bg-white px-4 py-10 font-kantumruy">
            {/* Background subtle luxury glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] md:w-[1000px] h-[500px] bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.04)_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 mx-auto w-full max-w-sm">
                <RevealSection>
                    <div className="grid grid-cols-1 items-center gap-6">
                        {/* Left: Portrait Photo */}
                        {portraitImage && <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl group">
                            <img
                                src={portraitImage}
                                className={`h-full w-full rounded-xl object-cover transition-all duration-1000 ${mapPan.isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'}`}
                                style={{
                                    objectPosition: `${mapPan.localX} ${mapPan.localY}`,
                                    userSelect: 'none',
                                    touchAction: 'none'
                                }}
                                onMouseDown={mapPan.onStart}
                                onTouchStart={mapPan.onStart}
                                draggable={false}
                                alt="Location Portrait"
                            />
                        </div>}

                        {embedUrl && (
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#FBF8F0]">
                                <iframe
                                    title={`ផែនទីបង្ហាញទីតាំង ${locationText || "កម្មវិធី"}`}
                                    src={embedUrl}
                                    className="h-full w-full border-0"
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        )}

                        {/* Right: Location & QR Block */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#FBF8F0] text-[#A27A1E]">
                                <MapPin size={22} strokeWidth={1.8} aria-hidden="true" />
                            </div>
                            <h3 className="font-khmer-moul text-lg leading-relaxed text-[#805C00]">
                                {locationTitle}
                            </h3>
                            {locationSubtitle && <p className="mt-2 max-w-xs break-words text-sm leading-7 text-stone-600">{locationSubtitle}</p>}
                            {locationText && (
                                <p className="mt-2 max-w-xs break-words text-sm leading-7 text-stone-600">
                                    {locationText}
                                </p>
                            )}
                            {mapLink && (
                                <m.a
                                    href={directMapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#B8921E]/50 bg-[#FBF8F0] px-5 py-2.5 text-sm font-bold text-[#805C00] shadow-sm transition-colors hover:bg-[#F5EEDC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8921E]/50"
                                >
                                    <Navigation size={16} aria-hidden="true" />
                                    <span>បើកក្នុង Google Maps</span>
                                </m.a>
                            )}
                        </div>
                    </div>
                </RevealSection>
            </div>
        </section>
    );
}
