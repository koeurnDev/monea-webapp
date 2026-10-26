import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, CalendarDays, Clock3, Flower2, Gift, Heart, Leaf, MapPin, Music2, Navigation, Volume2, VolumeX, X } from "lucide-react";
import type { TemplateProps, WeddingData } from "./types";
import { getTemplatePaletteStyles } from "@/lib/template-color-palette";
import { isSectionVisible } from "./shared/template-settings";
import { GuestbookSection } from "./shared/GuestbookSection";
import { getConfiguredPaymentAccounts, getWeddingPhotos, getWeddingSectionPhoto } from "./shared/weddingPhotos";
import { getDirectMapUrl, getMapEmbedUrl } from "./shared/mapUtils";
import { PhotoImage } from "./shared/PhotoImage";
import { CoupleNamesLine, OneLineName } from "./shared/OneLineName";
import { MoneaFooterBrand } from "./shared/MoneaFooterBrand";
import { SocialLinksSection } from "./shared/SocialLinksSection";

interface YouTubePlayerStateEvent {
    data: number;
}

interface YouTubePlayer {
    destroy: () => void;
}

interface YouTubeIframeApi {
    PlayerState: { ENDED: number };
    Player: new (
        target: HTMLIFrameElement,
        options: { events: { onStateChange: (event: YouTubePlayerStateEvent) => void } },
    ) => YouTubePlayer;
}

interface YouTubeWindow extends Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
}

const formatDate = (value: Date | string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const months = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
    return `${toKhmerNumber(date.getDate())} ${months[date.getMonth()]} ${toKhmerNumber(date.getFullYear())}`;
};

const toKhmerNumber = (value: number) => String(value).replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]);

const getInvitationTitle = (wedding: WeddingData) =>
    wedding.themeSettings?.customLabels?.invitationTitle
    || wedding.themeSettings?.customLabels?.invite_title
    || (wedding.eventType === "anniversary" ? "សិរីមង្គលពិធីភ្ជាប់ពាក្យ" : "សិរីមង្គលអាពាហ៍ពិពាហ៍");

const KHMER_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
const KHMER_WEEKDAYS = [
    { short: "អា", full: "អាទិត្យ" },
    { short: "ច", full: "ចន្ទ" },
    { short: "អ", full: "អង្គារ" },
    { short: "ពុ", full: "ពុធ" },
    { short: "ព្រ", full: "ព្រហស្បតិ៍" },
    { short: "សុ", full: "សុក្រ" },
    { short: "ស", full: "សៅរ៍" },
];

function GardenEventCalendar({ wedding }: { wedding: WeddingData }) {
    const eventDate = new Date(wedding.date);
    const validDate = Number.isFinite(eventDate.getTime());
    const month = validDate ? eventDate.getMonth() : 0;
    const year = validDate ? eventDate.getFullYear() : 0;
    const eventDay = validDate ? eventDate.getDate() : 0;
    const leadingDays = validDate ? new Date(year, month, 1).getDay() : 0;
    const daysInMonth = validDate ? new Date(year, month + 1, 0).getDate() : 0;
    const calendarCellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

    return (
        <section id="event-calendar" className="relative isolate overflow-hidden border-y border-[#b8944c]/25 bg-gradient-to-b from-[#f8f2e5] to-[#f3ead7] px-5 py-10 text-center text-[#493b2c] sm:px-8 sm:py-12">
            <div className="relative mx-auto max-w-lg px-4 py-7 sm:px-7 sm:py-9 lg:max-w-3xl lg:px-12 lg:py-12">
                <div className="mx-auto inline-flex min-h-10 items-center gap-2 px-5 py-2 font-khmer-moul text-[11px] text-[#654d17] sm:text-xs lg:min-h-12 lg:px-6 lg:text-sm">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    <span>សូមគោរពអញ្ជើញចូលរួម</span>
                </div>
                {validDate ? (
                    <>
                        <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#c4a44c] bg-gradient-to-b from-[#fff8df] to-[#ead48e] shadow-[0_0_0_5px_rgba(255,250,239,.75),0_8px_20px_rgba(111,78,20,.16)] sm:h-32 sm:w-32 lg:mt-7 lg:h-36 lg:w-36">
                            <p className="m05-font-name text-6xl leading-none text-[#755414] sm:text-7xl lg:text-8xl">
                                {toKhmerNumber(eventDay)}
                            </p>
                        </div>
                        <h2 className="mt-4 font-khmer-moul text-base text-[#55421c] sm:text-xl lg:mt-5 lg:text-2xl">
                            ខែ{KHMER_MONTHS[month]} ឆ្នាំ{toKhmerNumber(year)}
                        </h2>
                        <div className="mx-auto mt-5 max-w-sm p-3 sm:mt-6 sm:p-4 lg:mt-7 lg:max-w-xl lg:p-6">
                            <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 lg:gap-y-3" aria-label={`ប្រតិទិនខែ${KHMER_MONTHS[month]} ឆ្នាំ${year}`}>
                                {KHMER_WEEKDAYS.map(({ short, full }) => (
                                    <div key={full} aria-label={full} className="pb-2 font-khmer-moul text-[10px] text-[#80672e] sm:text-xs lg:pb-3 lg:text-sm">
                                        {short}
                                    </div>
                                ))}
                                {Array.from({ length: calendarCellCount }, (_, index) => {
                                    const day = index - leadingDays + 1;
                                    if (day < 1 || day > daysInMonth) {
                                        return <span key={`empty-${index}`} aria-hidden="true" className="mx-auto h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11" />;
                                    }
                                    const isEventDay = day === eventDay;
                                    return (
                                        <span
                                            key={day}
                                            aria-label={isEventDay ? `ថ្ងៃកម្មវិធី ${day} ${KHMER_MONTHS[month]} ${year}` : undefined}
                                            className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full font-serif text-[11px] sm:text-xs lg:h-11 lg:w-11 lg:text-sm ${
                                                isEventDay
                                                    ? "bg-gradient-to-b from-[#f3df91] to-[#c89c27] font-bold text-[#644b12] shadow-[0_3px_10px_rgba(129,94,20,.25)]"
                                                    : "text-[#554832]"
                                            }`}
                                        >
                                            {isEventDay && <Heart aria-hidden="true" className="absolute -right-0.5 -top-1 h-3.5 w-3.5 fill-[#c9a328] text-[#c9a328]" />}
                                            {day}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        {wedding.time && <p className="mt-4 flex items-center justify-center gap-1.5 font-kantumruy text-xs text-[#746344] lg:mt-5 lg:text-sm"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{wedding.time}</p>}
                        {wedding.themeSettings?.lunarDate && <p className="mt-2 break-words font-kantumruy text-xs leading-6 text-[#746344] lg:text-sm">{wedding.themeSettings.lunarDate}</p>}
                    </>
                ) : (
                    <p className="mt-5 font-kantumruy text-sm text-[#746344]">សូមបញ្ចូលកាលបរិច្ឆេទកម្មវិធី</p>
                )}
            </div>
        </section>
    );
}

function GardenSectionHeading({ eyebrow, children, className = "mb-7" }: { eyebrow?: string; children: ReactNode; className?: string }) {
    return (
        <div className={`${className} text-center`}>
            {eyebrow && <p className="mb-2 font-serif text-[11px] uppercase tracking-[0.28em] text-[#9b7a2e]">{eyebrow}</p>}
            <h2 className="khmer-readable-type-system font-khmer-moul text-xl text-[#34452f] sm:text-2xl">{children}</h2>
            <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-[#b2944e]">
                <span className="h-px w-10 bg-[#b2944e]/55" />
                <Leaf className="h-3.5 w-3.5" />
                <span className="h-px w-10 bg-[#b2944e]/55" />
            </div>
        </div>
    );
}

function GardenStory({ wedding }: { wedding: WeddingData }) {
    const story = wedding.themeSettings?.loveStory?.trim()
        || wedding.themeSettings?.story?.kh?.trim()
        || wedding.themeSettings?.story?.km?.trim()
        || "";
    const images = wedding.themeSettings?.storyImages?.filter(Boolean) || [];
    const fallbackPhoto = getWeddingSectionPhoto(wedding, "story")?.url;
    const storyImages = images.length ? images : fallbackPhoto ? [fallbackPhoto] : [];
    if (!story && storyImages.length === 0) return null;

    return (
        <section id="story" className="bg-gradient-to-b from-[#f6efdd] to-[#fffaf0] px-5 py-12 sm:px-8 sm:py-14">
            <GardenSectionHeading eyebrow="OUR STORY">
                {wedding.themeSettings?.customLabels?.storyTitle || "រឿងរ៉ាវស្នេហារបស់យើង"}
            </GardenSectionHeading>
            {story && (
                <div className="mx-auto mb-6 max-w-lg px-5 py-4 sm:mb-7 sm:px-7 sm:py-5 lg:max-w-3xl lg:px-10 lg:py-7">
                    <p className="whitespace-pre-line break-words text-center font-kantumruy text-sm leading-8 text-[#566049] sm:text-base sm:leading-9 lg:text-lg lg:leading-10">{story}</p>
                </div>
            )}
            {storyImages.length > 0 && (
                <div className={`mx-auto grid gap-3 sm:gap-4 lg:gap-5 ${storyImages.length > 1 ? "max-w-lg grid-cols-2 lg:max-w-5xl lg:grid-cols-3" : "max-w-lg grid-cols-1 lg:max-w-3xl"}`}>
                    {storyImages.map((image, index) => (
                        <div key={`${image}-${index}`} className={`relative overflow-hidden ${storyImages.length > 1 && index === 0 ? "col-span-2 lg:col-span-2" : ""}`}>
                            <PhotoImage
                                src={image}
                                alt={`រូបភាពរឿងរ៉ាវស្នេហាទី ${index + 1}`}
                                className={`w-full object-cover ${storyImages.length > 1 && index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                                sizes={storyImages.length > 1 && index === 0
                                    ? "(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 800px"
                                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"}
                                loading="lazy"
                            />
                            {wedding.themeSettings?.storyImageCaptions?.[index]?.trim() && (
                                <p className="px-3 py-2 text-center font-kantumruy text-xs leading-6 text-[#566049]">
                                    {wedding.themeSettings.storyImageCaptions[index]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function GardenSchedule({ wedding }: { wedding: WeddingData }) {
    const activities = wedding.activities || [];
    if (!activities.length) return null;
    let eventIndex = 0;

    return (
        <section id="timeline" className="m08-schedule-section bg-gradient-to-b from-[#fffdf7] to-[#f8f2e5] px-5 py-12 sm:px-8 sm:py-14">
            <div className="m08-schedule-track relative mx-auto max-w-md before:absolute before:bottom-3 before:left-[7px] before:top-2 before:w-px before:bg-[#b99a50]/45">
                {activities.map((item, index) => {
                    const isHeader = item.icon === "header" || (!item.time && !item.description);
                    if (isHeader) {
                        return (
                            <div key={`${item.title}-${index}`} className="m08-schedule-header relative z-10 py-3 pl-8 text-left">
                                <span aria-hidden="true" className="m08-schedule-header-dot absolute left-[2px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#b8944c] bg-[#f7f0de]" />
                                <span className="inline-flex max-w-full items-center gap-2 font-khmer-moul text-sm text-[#80632e]">
                                    <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-[#9b7a2e]" />
                                    <span className="break-words">{item.title}</span>
                                </span>
                            </div>
                        );
                    }

                    const isLeft = eventIndex++ % 2 === 0;
                    return (
                        <div key={`${item.title}-${index}`} data-side={isLeft ? "left" : "right"} className="m08-schedule-event relative mb-5 pl-8 last:mb-0">
                            <span aria-hidden="true" className="m08-schedule-node absolute left-[2px] top-2 h-3 w-3 rounded-full border-2 border-[#b8944c] bg-[#fffaf0] shadow-[0_0_0_3px_rgba(255,250,239,.8)]" />
                            <article className="m08-schedule-copy">
                                {item.time && <p className="m08-schedule-time mb-1 inline-flex items-center gap-1.5 font-kantumruy text-xs font-bold tracking-wide text-[#92772f]"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{item.time}</p>}
                                <h3 className="m08-schedule-title font-khmer-moul text-sm leading-7 text-[#394a34]">{item.title}</h3>
                                {item.description && <p className="m08-schedule-description mt-1 break-words font-kantumruy text-xs leading-6 text-[#626957]">{item.description}</p>}
                            </article>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function GardenLocation({ wedding }: { wedding: WeddingData }) {
    const location = wedding.location?.trim() || "";
    const mapLink = wedding.themeSettings?.mapLink?.trim() || wedding.mapUrl?.trim() || "";
    const destination = mapLink || location;
    const photo = getWeddingSectionPhoto(wedding, "location")?.url;
    if (!destination && !photo) return null;

    const embedUrl = destination && (
        !destination.startsWith("http")
        || destination.includes("google.com/maps/embed")
        || (destination.includes("google.com") && destination.includes("q="))
    ) ? getMapEmbedUrl(destination, location) : null;

    return (
        <section id="location" className="bg-gradient-to-b from-[#e9eadb] to-[#f6efdd] px-5 py-12 sm:px-8 sm:py-14">
            <GardenSectionHeading eyebrow="THE VENUE">
                {wedding.themeSettings?.customLabels?.locationTitle || "ទីតាំងប្រារព្ធពិធី"}
            </GardenSectionHeading>
            {wedding.themeSettings?.customLabels?.locationSubtitle && (
                <p className="mx-auto -mt-4 mb-3 max-w-md px-5 text-center font-kantumruy text-sm leading-7 text-[#756948]">
                    {wedding.themeSettings.customLabels.locationSubtitle}
                </p>
            )}
            <div className="mx-auto max-w-md p-3 sm:p-4 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-5 lg:p-6">
                {(photo || embedUrl) && (
                    <div className="space-y-4">
                        {photo && (
                            <div className="relative overflow-hidden">
                                <PhotoImage
                                    src={photo}
                                    alt={location || "រូបទីតាំងកម្មវិធី"}
                                    className="aspect-[4/3] w-full object-cover lg:aspect-[16/10]"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {embedUrl && <div className="h-52 overflow-hidden lg:h-64"><iframe title="Wedding map" src={embedUrl} className="h-full w-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>}
                    </div>
                )}
                <div className={`flex flex-col justify-center ${(photo || embedUrl) ? "" : "lg:col-span-2"}`}>
                    {location && (
                        <div className="mb-4 flex items-start gap-3 px-1 py-3 lg:px-2 lg:py-4">
                            <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#9b7a2e] lg:h-5 lg:w-5" />
                            <p className="break-words text-left font-kantumruy text-sm font-bold leading-7 text-[#46513b] lg:text-base lg:leading-8">{location}</p>
                        </div>
                    )}
                    {destination && (
                        <a href={getDirectMapUrl(destination, location)} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#b38b1d] bg-gradient-to-b from-[#f5df8d] to-[#d1aa35] px-4 py-3 font-khmer-moul text-xs text-[#624b16] shadow-[0_4px_14px_rgba(111,78,20,.16)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b7a2e] focus-visible:ring-offset-2 lg:min-h-14 lg:text-sm">
                            <Navigation aria-hidden="true" className="h-4 w-4" />បើកមើលផ្លូវ
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}

function GardenGallery({ wedding }: { wedding: WeddingData }) {
    const photos = getWeddingPhotos(wedding);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    if (!photos.length) return null;

    return (
        <section id="gallery" className="bg-gradient-to-b from-[#fffdf7] to-[#f6efdd] px-5 py-12 sm:px-8 sm:py-14">
            <GardenSectionHeading eyebrow="MEMORIES">
                {wedding.themeSettings?.customLabels?.galleryTitle || wedding.themeSettings?.customLabels?.gallery_title || "កម្រងរូបភាពអនុស្សាវរីយ៍"}
            </GardenSectionHeading>
            <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 sm:gap-4 lg:max-w-2xl lg:grid-cols-3">
                {photos.map((photo, index) => (
                    <button key={`${photo.url}-${index}`} type="button" onClick={() => setSelectedPhoto(photo.url)} aria-label={`មើលរូបភាពទី ${index + 1}`} className={`group relative overflow-hidden transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b7a2e] focus-visible:ring-offset-2 ${index === 0 ? photos.length > 1 ? "col-span-2 lg:col-span-2" : "col-span-2 lg:col-span-3" : ""}`}>
                        <PhotoImage
                            src={photo.url}
                            alt={`រូបភាពអនុស្សាវរីយ៍ទី ${index + 1}`}
                            className={`w-full object-cover transition duration-500 group-hover:scale-[1.02] ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                            sizes={index === 0
                                ? "(max-width: 640px) 100vw, 800px"
                                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"}
                            loading="lazy"
                        />
                    </button>
                ))}
            </div>
            {selectedPhoto && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#172017]/95 p-4" role="dialog" aria-modal="true" aria-label="រូបភាពពង្រីក" onClick={() => setSelectedPhoto(null)}>
                    <button type="button" onClick={() => setSelectedPhoto(null)} aria-label="បិទរូបភាព" className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white"><X className="h-5 w-5" /></button>
                    <div className="relative max-h-[85dvh] max-w-3xl overflow-hidden rounded-2xl" onClick={(event) => event.stopPropagation()}>
                        <PhotoImage
                            src={selectedPhoto}
                            alt="រូបភាពអនុស្សាវរីយ៍ពង្រីក"
                            className="max-h-[85dvh] max-w-full object-contain"
                            sizes="(max-width: 768px) 100vw, 800px"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

function GardenGift({ wedding }: { wedding: WeddingData }) {
    const accounts = getConfiguredPaymentAccounts(wedding.themeSettings?.bankAccounts);
    const qrUrl = wedding.themeSettings?.paymentQrUrl;
    if (!accounts.length && !qrUrl) return null;

    return (
        <section id="gift" className="bg-gradient-to-b from-[#f6efdd] to-[#fffaf0] px-5 py-12 sm:px-8 sm:py-14">
            <GardenSectionHeading eyebrow="WEDDING GIFT">
                {wedding.themeSettings?.customLabels?.giftTitle || "ចំណងដៃ"}
            </GardenSectionHeading>
            <p className="mx-auto mb-7 max-w-md text-center font-kantumruy text-sm leading-7 text-[#756948] lg:mb-9 lg:max-w-2xl lg:text-base lg:leading-8">
                {wedding.themeSettings?.customLabels?.giftSubtitle
                    || "សម្រាប់ភ្ញៀវកិត្តិយសដែលមិនអាចអញ្ជើញចូលរួមដោយផ្ទាល់ អាចផ្ញើចំណងដៃតាមរយៈ KHQR ខាងក្រោម"}
            </p>
            {wedding.themeSettings?.customLabels?.giftBadge && (
                <p className="mx-auto -mt-4 mb-5 w-fit rounded-full border border-[#b38b1d]/35 px-3 py-1 text-xs font-semibold text-[#756948]">
                    {wedding.themeSettings.customLabels.giftBadge}
                </p>
            )}
            <div className="mx-auto grid max-w-md gap-4 lg:max-w-4xl lg:gap-5">
                {accounts.map((account, index) => {
                    const accountQr = account.qrUrl || account.qrCodeUrl;
                    return (
                        <article key={`${account.bankName || "account"}-${index}`} className="grid gap-4 py-4 text-center sm:grid-cols-[1fr_auto] sm:items-center sm:py-5 sm:text-left lg:gap-8 lg:py-6">
                            <div className="min-w-0">
                                <Gift aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-[#9b7a2e] sm:mx-0 lg:mb-3 lg:h-6 lg:w-6" />
                                {account.bankName && <h3 className="font-serif text-sm font-semibold tracking-wide text-[#596443] lg:text-base">{account.bankName}</h3>}
                                {account.accountName && <p className="mt-2 break-words font-kantumruy text-sm font-bold text-[#414c38] lg:text-base">{account.accountName}</p>}
                                {account.accountNumber && <p className="mt-1 break-all font-kantumruy text-sm tracking-wide text-[#7e6c3c] lg:text-base">{account.accountNumber}</p>}
                            </div>
                            {accountQr && (
                                <div className="mx-auto bg-white p-2 sm:mx-0 lg:p-3">
                                    <img src={accountQr} alt={`QR ${account.bankName || "ចំណងដៃ"}`} className="h-36 w-36 object-contain sm:h-40 sm:w-40 lg:h-44 lg:w-44" loading="lazy" />
                                </div>
                            )}
                        </article>
                    );
                })}
                {qrUrl && (
                    <article className="py-5 text-center lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8 lg:py-6 lg:text-left">
                        <div>
                            <Gift aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-[#9b7a2e] lg:mx-0 lg:mb-3 lg:h-6 lg:w-6" />
                            <p className="font-khmer-moul text-sm text-[#80632e] lg:text-base">KHQR សម្រាប់ចំណងដៃ</p>
                        </div>
                        <div className="mx-auto w-fit bg-white p-2">
                            <img src={qrUrl} alt="QR សម្រាប់ចំណងដៃ" className="h-40 w-40 object-contain sm:h-44 sm:w-44 lg:h-48 lg:w-48" loading="lazy" />
                        </div>
                    </article>
                )}
            </div>
        </section>
    );
}

export default function GardenEditorial({ wedding, guestName, config }: TemplateProps) {
    const [revealed, setRevealed] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const musicUrl = wedding.themeSettings?.musicUrl;
    const videoUrl = wedding.themeSettings?.videoUrl?.trim();
    const youtubeVideoId = videoUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
    const heroPhoto = getWeddingSectionPhoto(wedding, "cover")?.url;
    const paletteStyles = getTemplatePaletteStyles(wedding.themeSettings, "#A78337", "#FBF4E8");
    const weddingDate = formatDate(wedding.date);
    const welcomeMessage = wedding.themeSettings?.welcomeMessage?.trim();
    const invitationText = wedding.themeSettings?.invitationText?.trim();
    const acknowledgment = wedding.themeSettings?.acknowledgment?.trim();
    const parents = wedding.themeSettings?.parents;
    const groomParents = [
        (parents?.groomFather ?? wedding.groomFather)?.trim(),
        (parents?.groomMother ?? wedding.groomMother)?.trim(),
    ].filter(Boolean);
    const brideParents = [
        (parents?.brideFather ?? wedding.brideFather)?.trim(),
        (parents?.brideMother ?? wedding.brideMother)?.trim(),
    ].filter(Boolean);
    const hasParents = groomParents.length > 0 || brideParents.length > 0;
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const introVideoFrameRef = useRef<HTMLIFrameElement | null>(null);
    const enterInvitationRef = useRef<() => void>(() => {});

    useEffect(() => {
        const forceReveal = () => {
            setShowIntroVideo(false);
            setRevealed(true);
        };
        window.addEventListener("FORCE_REVEAL", forceReveal);
        return () => window.removeEventListener("FORCE_REVEAL", forceReveal);
    }, []);

    useEffect(() => {
        if (!showIntroVideo || !youtubeVideoId || !introVideoFrameRef.current) return;

        const youtubeWindow = window as YouTubeWindow;
        let cancelled = false;
        let player: YouTubePlayer | undefined;
        const previousReadyHandler = youtubeWindow.onYouTubeIframeAPIReady;

        const initializePlayer = () => {
            if (cancelled || !youtubeWindow.YT || !introVideoFrameRef.current) return;
            player = new youtubeWindow.YT.Player(introVideoFrameRef.current, {
                events: {
                    onStateChange: (event) => {
                        if (event.data === youtubeWindow.YT?.PlayerState.ENDED) enterInvitationRef.current();
                    },
                },
            });
        };
        const readyHandler = () => {
            previousReadyHandler?.();
            initializePlayer();
        };

        if (youtubeWindow.YT?.Player) {
            initializePlayer();
        } else {
            youtubeWindow.onYouTubeIframeAPIReady = readyHandler;
            const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
            if (!existingScript) {
                const script = document.createElement("script");
                script.src = "https://www.youtube.com/iframe_api";
                script.async = true;
                document.head.appendChild(script);
            }
        }

        return () => {
            cancelled = true;
            player?.destroy();
            if (youtubeWindow.onYouTubeIframeAPIReady === readyHandler) {
                youtubeWindow.onYouTubeIframeAPIReady = previousReadyHandler;
            }
        };
    }, [showIntroVideo, youtubeVideoId]);

    const toggleMusic = useCallback(async () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (error) {
            console.error("[GardenEditorial] Background music could not be played:", error);
            setIsPlaying(false);
        }
    }, [isPlaying]);

    const enterInvitation = useCallback(() => {
        setShowIntroVideo(false);
        setRevealed(true);
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
        if (audioRef.current) void toggleMusic();
    }, [toggleMusic]);

    useEffect(() => {
        enterInvitationRef.current = enterInvitation;
    }, [enterInvitation]);

    const openInvitation = () => {
        if (videoUrl) {
            setShowIntroVideo(true);
            return;
        }
        enterInvitation();
    };

    return (
        <div style={paletteStyles} className="monea-full-palette monea-paper-canvas m05-type-system khmer-readable-type-system min-h-screen bg-[#FBF4E8] font-kantumruy text-[#493b2c]">
            {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

            {showIntroVideo && videoUrl && (
                <section role="dialog" aria-modal="true" aria-labelledby="m08-intro-video-title" className="fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[#1c1a15] px-4 py-8 text-[#fffaf0]" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
                    <div className="w-full max-w-4xl text-center">
                        <h2 id="m08-intro-video-title" className="mb-5 font-khmer-moul text-base text-[#f5dfa0] sm:text-lg">
                            វីដេអូអនុស្សាវរីយ៍
                        </h2>
                        <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
                            {youtubeVideoId ? (
                                <iframe
                                    key={videoUrl}
                                    ref={introVideoFrameRef}
                                    title="វីដេអូអនុស្សាវរីយ៍"
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    key={videoUrl}
                                    src={videoUrl}
                                    className="h-full w-full object-contain"
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                    onEnded={enterInvitation}
                                />
                            )}
                        </div>
                        <button type="button" onClick={enterInvitation} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-[#e0c56e] bg-gradient-to-b from-[#f9e9a6] to-[#c49c32] px-7 py-3 font-khmer-moul text-sm text-[#5e4519] shadow-lg transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5dfa0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1a15]">
                            រំលងវីដេអូ និងបើកធៀប
                        </button>
                    </div>
                </section>
            )}

            {!revealed && (
                <section className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f4e8d7] px-5 py-8 text-center text-[#75551f]" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
                    {(!wedding.previewUploadedImagesOnly || heroPhoto) && (
                        <div
                            aria-hidden="true"
                            className={`absolute inset-0 bg-cover bg-[center_46%] ${!wedding.previewUploadedImagesOnly ? "bg-[url('/assets/blossom-romance/blossom-arch-bg.jpg')]" : ""}`}
                            style={wedding.previewUploadedImagesOnly ? { backgroundImage: `url("${heroPhoto}")` } : undefined}
                        />
                    )}
                    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,239,.22),rgba(246,234,216,.42))]" />
                    <div className="relative z-10 mx-auto flex min-h-[min(760px,calc(100dvh-4rem))] w-full max-w-[430px] flex-col items-center justify-center rounded-none border-0 bg-transparent px-4 py-6 shadow-none sm:px-7 sm:py-8 lg:max-w-[540px] lg:px-10 lg:py-10">
                        <p className="mb-2 font-khmer-moul text-xs tracking-wide text-[#8d671d] drop-shadow-[0_1px_2px_rgba(255,255,255,.9)] sm:text-sm lg:text-base">
                            {getInvitationTitle(wedding)}
                        </p>
                        <div className="relative my-1 flex h-40 w-40 items-center justify-center sm:h-52 sm:w-52 lg:h-60 lg:w-60">
                            <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" fill="none">
                                <defs>
                                    <g id="m08-blossom" fill="#fff9e8" stroke="#bd994d" strokeWidth=".8">
                                        <ellipse cy="-4.1" rx="2.2" ry="3.4" />
                                        <ellipse cy="-4.1" rx="2.2" ry="3.4" transform="rotate(72)" />
                                        <ellipse cy="-4.1" rx="2.2" ry="3.4" transform="rotate(144)" />
                                        <ellipse cy="-4.1" rx="2.2" ry="3.4" transform="rotate(216)" />
                                        <ellipse cy="-4.1" rx="2.2" ry="3.4" transform="rotate(288)" />
                                        <circle r="1.5" fill="#c49b43" stroke="none" />
                                    </g>
                                </defs>
                                <path d="M91 23C58 25 31 49 24 82c-7 31 4 61 28 79M109 23c33 2 60 26 67 59 7 31-4 61-28 79" stroke="#b28a3d" strokeWidth="1.25" strokeLinecap="round" />
                                <path d="M96 28C65 31 40 53 34 83c-6 27 4 52 23 68M104 28c31 3 56 25 62 55 6 27-4 52-23 68" stroke="#d3b66d" strokeWidth=".7" strokeLinecap="round" />
                                <g fill="#d8bd78" stroke="#a98136" strokeWidth=".65">
                                    <path d="M39 126c-10-8-11-16-7-21 10 3 13 10 7 21Zm-2 3c1-11 7-17 14-16 1 9-4 15-14 16ZM42 70c-9-10-8-17-3-21 9 5 10 12 3 21Zm3 2c4-10 11-14 17-11-2 9-8 13-17 11Z" />
                                    <path d="M161 126c10-8 11-16 7-21-10 3-13 10-7 21Zm2 3c-1-11-7-17-14-16-1 9 4 15 14 16Zm-5-59c9-10 8-17 3-21-9 5-10 12-3 21Zm-3 2c-4-10-11-14-17-11 2 9 8 13 17 11Z" />
                                </g>
                                <use href="#m08-blossom" transform="translate(100 23) scale(1.15)" />
                                <use href="#m08-blossom" transform="translate(53 42) scale(.92)" />
                                <use href="#m08-blossom" transform="translate(147 42) scale(.92)" />
                                <use href="#m08-blossom" transform="translate(27 91) scale(.82)" />
                                <use href="#m08-blossom" transform="translate(173 91) scale(.82)" />
                                <use href="#m08-blossom" transform="translate(48 151) scale(.95)" />
                                <use href="#m08-blossom" transform="translate(152 151) scale(.95)" />
                                <use href="#m08-blossom" transform="translate(100 178) scale(1.12)" />
                            </svg>
                            <span aria-hidden="true" className="m05-font-name relative -mt-1 text-4xl text-[#9a701d] drop-shadow-[0_2px_2px_rgba(255,248,224,.9)] sm:text-5xl lg:text-6xl">
                                {Array.from((wedding.groomName || "").trim())[0] || "♡"}&amp;{Array.from((wedding.brideName || "").trim())[0] || "♡"}
                            </span>
                        </div>
                        <h1 aria-label={`${wedding.groomName} និង ${wedding.brideName}`} className="m05-font-name max-w-full text-lg text-[#8b671e] drop-shadow-[0_1px_3px_rgba(255,255,255,.95)] sm:text-xl lg:text-2xl">
                            <OneLineName name={wedding.groomName || "កូនកំលោះ"} />
                            <span aria-hidden="true" className="font-serif text-xl italic text-[#9f782c] lg:text-2xl">&amp;</span>
                            <OneLineName name={wedding.brideName || "កូនក្រមុំ"} ariaHidden />
                        </h1>
                        {weddingDate && <p className="mt-2 font-kantumruy text-xs text-[#805f25] drop-shadow-[0_1px_3px_rgba(255,255,255,.95)] sm:text-sm">{weddingDate}</p>}
                        <span aria-hidden="true" className="my-3 h-px w-16 bg-gradient-to-r from-transparent via-[#b08b39] to-transparent lg:my-4 lg:w-24" />
                        {guestName && <p className="mb-2 rounded-full border border-[#bd9847]/40 bg-[#fffaf0]/55 px-4 py-1.5 font-kantumruy text-xs text-[#74531d]">{guestName}</p>}
                        <p className="mx-auto max-w-xs font-khmer-moul text-xs leading-7 text-[#72521c] drop-shadow-[0_1px_3px_rgba(255,255,255,.95)] sm:text-sm lg:max-w-sm lg:text-base lg:leading-8">
                            {invitationText || "សូមគោរពអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយសក្នុងថ្ងៃដ៏មានអត្ថន័យរបស់យើងខ្ញុំ"}
                        </p>
                        <button type="button" onClick={openInvitation} className="mt-4 inline-flex w-full max-w-[680px] min-h-14 items-center justify-center gap-2 rounded-xl border border-[#d0af58] bg-gradient-to-b from-[#f4d883] via-[#e6c86d] to-[#c79d3b] px-6 py-3 font-khmer-moul text-sm text-[#5a4317] shadow-[0_6px_18px_rgba(112,82,23,0.18)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b7a2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf0] lg:mt-6 lg:min-h-[3.5rem] lg:text-base">
                            <Music2 aria-hidden="true" className="h-4 w-4" />
                            <span className="leading-none">{wedding.themeSettings?.customLabels?.heroButton || "បើកសំបុត្រអញ្ជើញ"}</span>
                        </button>
                    </div>
                </section>
            )}

            {musicUrl && (
                <button type="button" onClick={() => void toggleMusic()} aria-label={isPlaying ? "Pause background music" : "Play background music"} className="invitation-floating-control fixed bottom-5 z-[110] rounded-full border border-[#d0af58]/70 bg-[#e4c55c]/90 p-3 text-[#72521c] shadow-lg backdrop-blur-sm">
                    <span className="sr-only">{isPlaying ? "Pause background music" : "Play background music"}</span>
                    {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
            )}

            {revealed && (
                <>
                    <main className="m08-invitation-page w-full max-w-none overflow-hidden bg-transparent">
                        <section id="hero" className="relative isolate overflow-hidden bg-gradient-to-b from-[#f8f2e5] to-[#f2eadb] px-5 py-8 text-center text-[#604b2c]">
                            {heroPhoto && <PhotoImage src={heroPhoto} alt={`${wedding.groomName} និង ${wedding.brideName}`} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25 mix-blend-multiply" sizes="100vw" loading="eager" />}
                            <div className="m08-hero-content relative mx-auto max-w-lg px-2 py-7 sm:px-5 sm:py-9">
                                {hasParents && (
                                    <div className="m08-hero-parents mb-5 grid grid-cols-2 gap-3 border-b border-[#b8944c]/30 pb-5 text-center">
                                        {[{ label: "មាតាបិតាខាងកូនប្រុស", names: groomParents }, { label: "មាតាបិតាខាងកូនស្រី", names: brideParents }].map(({ label, names }) => (
                                            <div key={label} className="min-w-0 px-1">
                                                <p className="mb-1 font-kantumruy text-[10px] text-[#92772f] sm:text-xs">{label}</p>
                                                <p className="break-words font-khmer-moul text-[11px] leading-6 text-[#554832] sm:text-sm">{names.length ? names.join(" និង ") : "—"}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <h1 className="m08-hero-invitation-title font-khmer-moul text-sm leading-7 text-[#80632e] sm:text-base">{getInvitationTitle(wedding)}</h1>
                                {wedding.themeSettings?.customLabels?.heroSubtitle && (
                                    <p className="mt-2 max-w-lg break-words font-kantumruy text-xs leading-7 text-[#756948] sm:text-sm">
                                        {wedding.themeSettings.customLabels.heroSubtitle}
                                    </p>
                                )}
                                <div className="my-5 flex items-center justify-center gap-3 text-[#ac873d]"><span className="h-px w-12 bg-gradient-to-r from-transparent to-current" /><Heart aria-hidden="true" className="h-3.5 w-3.5 fill-current" /><span className="h-px w-12 bg-gradient-to-l from-transparent to-current" /></div>
                                <div className="m08-hero-couple grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                                    <div className="min-w-0 text-center">
                                        <p className="m08-hero-role mb-1 font-kantumruy text-[10px] text-[#8e7446] sm:text-xs">កូនប្រុសនាម</p>
                                        <OneLineName name={wedding.groomName || "កូនកំលោះ"} className="m08-hero-name m05-font-name text-sm leading-tight text-[#755826] sm:text-xl" />
                                    </div>
                                    <div className="m08-hero-emblem relative flex h-14 w-14 items-center justify-center rounded-full border-[2px] border-[#b8944c] bg-[#f5ebd8]/75 text-lg font-bold text-[#8c6d2e] shadow-[0_0_0_4px_rgba(255,250,239,0.4)] sm:h-16 sm:w-16">
                                        <span aria-hidden="true">✦</span>
                                    </div>
                                    <div className="min-w-0 text-center">
                                        <p className="m08-hero-role mb-1 font-kantumruy text-[10px] text-[#8e7446] sm:text-xs">កូនស្រីនាម</p>
                                        <OneLineName name={wedding.brideName || "កូនក្រមុំ"} className="m08-hero-name m05-font-name text-sm leading-tight text-[#755826] sm:text-xl" />
                                    </div>
                                </div>
                                {weddingDate && <p className="mt-5 font-serif text-sm tracking-[0.08em] text-[#80663a] sm:tracking-[0.14em]">{weddingDate}</p>}
                                {wedding.time && <p className="mt-2 flex items-center justify-center gap-1.5 font-kantumruy text-xs text-[#746344]"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{wedding.time}</p>}
                                {wedding.themeSettings?.lunarDate && <p className="mt-2 break-words font-kantumruy text-xs leading-6 text-[#746344]">{wedding.themeSettings.lunarDate}</p>}
                            </div>
                        </section>

                        <section className="relative isolate overflow-hidden border-b border-[#b8944c]/25 bg-gradient-to-b from-[#f3eadb] to-[#f8f2e5] px-5 py-10 text-center text-[#745a20] sm:px-8 sm:py-14 lg:px-14 lg:py-16">
                            <div className="mx-auto max-w-lg px-2 py-7 sm:px-8 sm:py-9 lg:max-w-[600px] lg:px-12 lg:py-11">
                                <article>
                                    <h2 className="mb-2 font-khmer-moul text-base text-[#8d6d20] sm:text-lg lg:mb-3 lg:text-xl">សេចក្តីសូមគោរពអញ្ជើញ</h2>
                                    <p className="whitespace-pre-line break-words font-kantumruy text-sm leading-8 text-[#765d28] sm:text-base sm:leading-9 lg:text-lg lg:leading-10">
                                        {welcomeMessage || "យើងខ្ញុំមានកិត្តិយស និងសេចក្តីសោមនស្សរីករាយ សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា ចូលរួមជាភ្ញៀវកិត្តិយសក្នុងពិធីដ៏មានអត្ថន័យរបស់យើងខ្ញុំ។"}
                                    </p>
                                </article>
                                <article className="mt-7 border-t border-[#b8944c]/25 pt-6 lg:mt-9 lg:pt-8">
                                    <h2 className="mb-2 font-khmer-moul text-base text-[#8d6d20] sm:text-lg lg:mb-3 lg:text-xl">ពិធីសិរីមង្គល</h2>
                                    <p className="whitespace-pre-line break-words font-kantumruy text-sm leading-8 text-[#765d28] sm:text-base sm:leading-9 lg:text-lg lg:leading-10">
                                        {invitationText || "សូមអញ្ជើញចូលរួមប្រសិទ្ធពរជ័យ និងជាភ្ញៀវកិត្តិយសក្នុងពិធីសិរីមង្គលរបស់យើងខ្ញុំ។"}
                                    </p>
                                </article>
                                <a href="#event-calendar" className="mx-auto mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#b38b1d] bg-gradient-to-b from-[#f5df8d] to-[#d1aa35] px-7 py-3 font-khmer-moul text-sm text-[#624b16] shadow-[0_4px_14px_rgba(111,78,20,.2)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b7a2e] focus-visible:ring-offset-2 lg:mt-3 lg:min-h-14 lg:px-9 lg:text-base">
                                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                                    មើលប្រតិទិនកម្មវិធី
                                </a>
                            </div>
                        </section>

                        <GardenEventCalendar wedding={wedding} />

                        {isSectionVisible(config, "story") && <GardenStory wedding={wedding} />}
                        {isSectionVisible(config, "timeline") && <GardenSchedule wedding={wedding} />}
                        {isSectionVisible(config, "map") && <GardenLocation wedding={wedding} />}
                        {isSectionVisible(config, "gallery") && <GardenGallery wedding={wedding} />}
                        {isSectionVisible(config, "gift") && <GardenGift wedding={wedding} />}
                        {isSectionVisible(config, "guestbook") && <GuestbookSection wedding={wedding} khmerSpacing unboxed sectionClassName="border-t border-[#b8944c]/35" />}

                        <footer className="bg-transparent px-6 py-10 text-center text-[#566049] sm:py-12 lg:px-12 lg:py-16">
                            <div aria-hidden="true" className="mx-auto mb-5 flex items-center justify-center gap-3 text-[#a98438] lg:mb-7 lg:gap-5">
                                <span className="h-px w-12 bg-gradient-to-r from-transparent to-current lg:w-20" />
                                <Flower2 className="h-5 w-5 lg:h-7 lg:w-7" />
                                <span className="h-px w-12 bg-gradient-to-l from-transparent to-current lg:w-20" />
                            </div>
                            <h2 className="font-khmer-moul text-lg text-[#80632e] lg:text-2xl">សូមអរគុណ</h2>
                            <p className="mx-auto mt-3 max-w-md whitespace-pre-line break-words font-kantumruy text-sm leading-8 text-[#626957] lg:mt-5 lg:max-w-2xl lg:text-base lg:leading-9">{acknowledgment || "សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន និងពរជ័យរបស់លោកអ្នក។"}</p>
                            <CoupleNamesLine groom={wedding.groomName} bride={wedding.brideName} className="m05-font-name mt-5 text-lg text-[#755826] lg:mt-7 lg:text-2xl" />
                            <SocialLinksSection wedding={wedding} />
                            <MoneaFooterBrand className="mt-8" />
                        </footer>
                    </main>
                </>
            )}
        </div>
    );
}
