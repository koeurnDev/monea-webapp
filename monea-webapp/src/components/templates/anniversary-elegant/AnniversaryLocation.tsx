import React from 'react';
import { m } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { getDirectMapUrl, getMapEmbedUrl, isGoogleMapsShortLink } from '../shared/mapUtils';
import type { WeddingData } from '../types';
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";

export default function AnniversaryLocation({ wedding }: { wedding: WeddingData }) {
    const settings = wedding.themeSettings as any;
    const locationString = settings?.mapLink || wedding.mapUrl || wedding.location || "";
    const venueName = wedding.location || "";
    const locationTitle = settings?.customLabels?.locationTitle || "ទីតាំងកម្មវិធី";
    const locationSubtitle = settings?.customLabels?.locationSubtitle;
    if (!locationString && !venueName) return null;

    const directMapUrl = getDirectMapUrl(locationString);
    const embedSource = locationString || venueName;
    const mapEmbedUrl = !isGoogleMapsShortLink(embedSource) ? getMapEmbedUrl(embedSource, venueName) : null;
    const couplePhoto = getWeddingSectionPhoto(wedding, "location")?.url;

    // Safe Maps QR code URL
    const mapQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(directMapUrl)}&color=4A154B`;

    return (
        <section className="py-14 px-4 bg-white font-kantumruy relative overflow-hidden" id="location">
            <div className="max-w-xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#F0E3D1] flex items-center justify-center text-[#966B4E] mb-1 shadow-sm">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-khmer-moul text-[#633E42] leading-relaxed">
                        {locationTitle}
                    </h2>
                    {locationSubtitle && <p className="mt-2 text-sm leading-relaxed text-[#76665d]">{locationSubtitle}</p>}
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#CBAF78] to-transparent mx-auto mt-1" />
                </div>

                {/* Clean 2-Column Split: Couple Photo + Google Maps QR */}
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-[#F1ECE5] p-5 sm:p-7 rounded-[2.5rem] border border-[#D9C6AA] shadow-md space-y-5"
                >
                    {/* Venue Title */}
                    <div className="text-center space-y-1">
                        <p className="text-xs text-[#966B4E] font-bold font-kantumruy">
                            ទីតាំងប្រារព្ធពិធី
                        </p>
                        <h3 className="font-khmer-moul text-base sm:text-lg text-slate-900 leading-snug">
                            {venueName || "Google Maps"}
                        </h3>
                    </div>

                    {/* 2-Column Layout with Equal Stretched Heights */}
                    <div className={`grid ${couplePhoto ? "grid-cols-2" : "grid-cols-1"} gap-3.5 sm:gap-5 items-stretch`}>
                        {/* Left: Vertical Couple Portrait (Full Height) */}
                        {couplePhoto && <div className="relative h-full min-h-[210px] sm:min-h-[240px] rounded-2xl overflow-hidden shadow-md border-2 border-white bg-slate-100 group">
                            <img 
                                src={couplePhoto} 
                                alt="Couple Portrait" 
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>}

                        {/* Right: Golden Google Maps QR Card */}
                        <a
                            href={directMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col justify-between items-center p-3 sm:p-4 bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all group text-center space-y-2 h-full"
                        >
                            <span className="font-serif italic font-bold text-xs sm:text-sm text-[#4A154B]">
                                Location
                            </span>

                            {/* QR Frame with Google Pin in Center */}
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 p-1.5 bg-purple-50/40 rounded-xl border border-purple-200/80 flex items-center justify-center">
                                <img
                                    src={mapQrUrl}
                                    alt="Google Maps QR"
                                    className="w-full h-full object-contain rounded-lg"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center border border-purple-100">
                                        <MapPin size={11} className="text-red-500 fill-red-500" />
                                    </div>
                                </div>
                            </div>

                            <p className="font-sans font-black text-[8.5px] sm:text-[10px] text-purple-900 uppercase tracking-wide group-hover:text-purple-600 transition-colors whitespace-nowrap">
                                SCAN OR CLICK HERE
                            </p>
                        </a>
                    </div>
                    {mapEmbedUrl && (
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#D9C6AA] bg-white">
                            <iframe
                                title={`ផែនទីបង្ហាញទីតាំង ${venueName || "កម្មវិធី"}`}
                                src={mapEmbedUrl}
                                className="h-full w-full border-0"
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    )}
                </m.div>
            </div>
        </section>
    );
}
