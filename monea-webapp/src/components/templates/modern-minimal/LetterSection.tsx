import React from 'react';
import { m } from 'framer-motion';
import { WeddingData } from "../types";
import { OneLineName } from "../shared/OneLineName";
import { useImagePan } from "../shared/CinematicComponents";
import { getWeddingPhotoAtSlot, getWeddingSectionPhoto, getWeddingPhotos } from "../shared/weddingPhotos";

export const LetterSection = ({ wedding, guestName }: { wedding: WeddingData; guestName?: string }) => {
    const validGallery = getWeddingPhotos(wedding);
    const parents = wedding.themeSettings?.parents;
    const groomFather = (parents?.groomFather || wedding.groomFather)?.trim();
    const groomMother = (parents?.groomMother || wedding.groomMother)?.trim();
    const brideFather = (parents?.brideFather || wedding.brideFather)?.trim();
    const brideMother = (parents?.brideMother || wedding.brideMother)?.trim();
    const hasParents = Boolean(groomFather || groomMother || brideFather || brideMother);

    const groomPhoto =
        getWeddingSectionPhoto(wedding, "groom")?.url ||
        validGallery.find(img => img.type === 'groom')?.url ||
        wedding.groomPhoto;
        
    const bridePhoto =
        getWeddingSectionPhoto(wedding, "bride")?.url ||
        validGallery.find(img => img.type === 'bride')?.url ||
        wedding.bridePhoto;

    const groomPan = useImagePan(
        wedding.themeSettings?.groomImageX || '50%',
        wedding.themeSettings?.groomImageY || '50%',
        'groomImageX',
        'groomImageY'
    );

    const bridePan = useImagePan(
        wedding.themeSettings?.brideImageX || '50%',
        wedding.themeSettings?.brideImageY || '50%',
        'brideImageX',
        'brideImageY'
    );

    return (
        <section
            className="relative px-4 py-14 text-[#37352f] sm:py-20 md:py-24"
            style={{
                backgroundColor: "var(--monea-paper-color, #f4efdf)",
                backgroundImage: "var(--monea-paper-texture, url('/khmer-invite-starter-kit/textures/paper-cream.webp'))",
                backgroundBlendMode: "multiply",
                backgroundRepeat: "repeat",
                backgroundSize: "320px 320px",
            }}
        >
            <div className="mx-auto max-w-5xl text-center">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="relative mx-auto max-w-4xl space-y-7 px-2 py-10 sm:space-y-8 sm:px-8 sm:py-14 md:px-12 md:py-16"
                >
                    <div className="space-y-3 sm:space-y-4">
                        <div className="text-[10px] font-kantumruy uppercase tracking-[0.28em] text-[#827a68] sm:text-xs">
                            Invitation
                        </div>
                        <h3 className="mx-auto max-w-full break-words text-balance font-khmer-moul text-[clamp(14px,3.5vw,36px)] leading-relaxed text-[#37352f]">
                            សិរីសួស្តី អាពាហ៍ពិពាហ៍
                        </h3>
                    </div>

                    {hasParents && (
                        <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3 text-center sm:gap-5">
                            {(groomFather || groomMother) && (
                                <div className="space-y-1 border-y border-[#cfc5af] px-2 py-4">
                                    <h5 className="mb-2 break-words font-khmer-moul text-[clamp(9px,3vw,14px)] leading-relaxed text-[#77613a]">មាតាបិតាខាងកូនកំលោះ</h5>
                                    {groomFather && (
                                        <p className="w-full min-w-0 text-xs leading-relaxed text-[#4a473f] sm:text-sm">
                                            <OneLineName name={`ឪពុក៖ ${groomFather}`} className="font-kantumruy" />
                                        </p>
                                    )}
                                    {groomMother && (
                                        <p className="w-full min-w-0 text-xs leading-relaxed text-[#4a473f] sm:text-sm">
                                            <OneLineName name={`ម្តាយ៖ ${groomMother}`} className="font-kantumruy" />
                                        </p>
                                    )}
                                </div>
                            )}
                            {(brideFather || brideMother) && (
                                <div className={`space-y-1 border-y border-[#cfc5af] px-2 py-4 ${!groomFather && !groomMother ? "col-start-2" : ""}`}>
                                    <h5 className="mb-2 break-words font-khmer-moul text-[clamp(9px,3vw,14px)] leading-relaxed text-[#77613a]">មាតាបិតាខាងកូនក្រមុំ</h5>
                                    {brideFather && (
                                        <p className="w-full min-w-0 text-xs leading-relaxed text-[#4a473f] sm:text-sm">
                                            <OneLineName name={`ឪពុក៖ ${brideFather}`} className="font-kantumruy" />
                                        </p>
                                    )}
                                    {brideMother && (
                                        <p className="w-full min-w-0 text-xs leading-relaxed text-[#4a473f] sm:text-sm">
                                            <OneLineName name={`ម្តាយ៖ ${brideMother}`} className="font-kantumruy" />
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mx-auto h-px w-16 bg-[#b9ad93]" />

                    {/* Letter Body */}
                    <div className="mx-auto flex max-w-3xl flex-col gap-5 font-kantumruy text-sm leading-8 text-[#4a473f] sm:gap-7 sm:text-base sm:leading-9">
                        <div className="mx-auto w-full max-w-none border-y border-[#cfc5af] px-4 py-5 text-center sm:px-8 sm:py-7">
                            <h4 className="m02-invitation-copy font-suwannaphum text-[clamp(13px,3.5vw,20px)] leading-relaxed text-[#77613a]">
                                មានកិត្តិយសសូមគោរពអញ្ជើញ
                            </h4>
                            <p className="m02-invitation-copy mx-auto mt-2 max-w-3xl font-suwannaphum text-[clamp(11px,2.8vw,16px)] leading-[2.1] text-[#77613a] sm:mt-3">
                                <strong className="m02-invitation-copy font-suwannaphum font-normal text-[#37352f]">
                                    {guestName || wedding.guestName || "ឯកឧត្តម លោកជំទាវ លោក លោកស្រី អ្នកនាងកញ្ញា"}
                                </strong>{" "}
                                និងប្រិយមិត្តជិតឆ្ងាយទាំងអស់ ចូលរួមជាអធិបតី និងជាសាក្សីក្នុងពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍
                            </p>
                        </div>

                        {/* Perfectly Aligned Couple Portraits Grid */}
                        <div className="mx-auto grid w-full max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start justify-center gap-2 py-3 sm:gap-4 sm:py-5 md:gap-8">
                            {/* Groom Column */}
                            <div className="flex flex-col items-center text-center space-y-1.5 min-w-0">
                                {groomPhoto && <div
                                    className="relative h-32 w-24 cursor-move overflow-hidden transition-transform duration-300 hover:scale-[1.02] sm:h-40 sm:w-32 md:h-48 md:w-36"
                                    onMouseDown={groomPan.onStart}
                                    onTouchStart={groomPan.onStart}
                                    title="អូសដើម្បីតម្រឹមរូប (Drag to adjust)"
                                >
                                    <img 
                                        src={groomPhoto} 
                                        alt="Groom" 
                                        className="pointer-events-none h-full w-full object-cover"
                                        style={{ objectPosition: `${groomPan.localX} ${groomPan.localY}` }} 
                                    />
                                </div>}
                                <span className="block pt-1 font-kantumruy text-[10px] font-bold text-[#827a68] sm:text-xs">
                                    កូនប្រុសនាម
                                </span>
                                <h4 className="m05-font-name w-full min-w-0 max-w-full overflow-hidden whitespace-nowrap px-1 font-khmer-muol text-base font-normal leading-normal text-[#37352f] sm:text-lg md:text-xl">
                                    <OneLineName name={wedding.groomName} />
                                </h4>
                            </div>

                            {/* Center Ampersand */}
                            <div className="flex select-none flex-col items-center justify-center px-1 pt-12 font-serif text-xl font-light text-[#a99d85] sm:pt-16 sm:text-3xl">
                                &amp;
                            </div>

                            {/* Bride Column */}
                            <div className="flex flex-col items-center text-center space-y-1.5 min-w-0">
                                {bridePhoto && <div
                                    className="relative h-32 w-24 cursor-move overflow-hidden transition-transform duration-300 hover:scale-[1.02] sm:h-40 sm:w-32 md:h-48 md:w-36"
                                    onMouseDown={bridePan.onStart}
                                    onTouchStart={bridePan.onStart}
                                    title="អូសដើម្បីតម្រឹមរូប (Drag to adjust)"
                                >
                                    <img 
                                        src={bridePhoto} 
                                        alt="Bride" 
                                        className="pointer-events-none h-full w-full object-cover"
                                        style={{ objectPosition: `${bridePan.localX} ${bridePan.localY}` }} 
                                    />
                                </div>}
                                <span className="block pt-1 font-kantumruy text-[10px] font-bold text-[#827a68] sm:text-xs">
                                    កូនស្រីនាម
                                </span>
                                <h4 className="m05-font-name w-full min-w-0 max-w-full overflow-hidden whitespace-nowrap px-1 font-khmer-muol text-base font-normal leading-normal text-[#37352f] sm:text-lg md:text-xl">
                                    <OneLineName name={wedding.brideName} />
                                </h4>
                            </div>
                        </div>

                        <div className="mx-auto h-px w-16 bg-[#b9ad93]" />

                        <p className="mx-auto w-full max-w-none px-0 text-center font-suwannaphum text-[13px] leading-[1.8] text-[#4a473f] sm:px-2 sm:text-base sm:leading-[1.9]">
                            {wedding.themeSettings?.invitationText || "យើងខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅបំផុត ចំពោះវត្តមានដ៏ឧត្តុង្គឧត្តមរបស់លោកអ្នក ដែលបានចំណាយពេលវេលាដ៏មានតម្លៃចូលរួមក្នុងថ្ងៃមង្គលរបស់យើងខ្ញុំ។"}
                        </p>

                        <p className="pt-2 font-khmer-moul text-base text-[#77613a] md:text-lg">
                            សូមអរគុណ!
                        </p>
                    </div>
                </m.div>
            </div>
        </section>
    );
};
