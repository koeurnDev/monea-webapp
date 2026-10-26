import { m } from "framer-motion";
// next/image replaced with <img>;
import { RevealSection, CinematicPlaceholder } from "../shared/CinematicComponents";
import { WeddingData } from "../types";
import { getWeddingSectionPhoto } from "../shared/weddingPhotos";
import { OneLineName } from "../shared/OneLineName";

interface SignatureMomentsProps {
    wedding: WeddingData;
    signaturePan1: any;
    signaturePan2: any;
    signaturePan3: any;
    signaturePan4: any;
    signaturePan5: any;
    signaturePan6: any;
}

export function SignatureMoments({ 
    wedding,
    signaturePan1,
    signaturePan2,
    signaturePan3,
    signaturePan4,
    signaturePan5,
    signaturePan6
}: SignatureMomentsProps) {
    const signaturePhotos = {
        signature1: getWeddingSectionPhoto(wedding, "signature1")?.url,
        signature2: getWeddingSectionPhoto(wedding, "signature2")?.url,
        signature3: getWeddingSectionPhoto(wedding, "signature3")?.url,
        signature4: getWeddingSectionPhoto(wedding, "signature4")?.url,
        signature5: getWeddingSectionPhoto(wedding, "signature5")?.url,
        signature6: getWeddingSectionPhoto(wedding, "signature6")?.url,
    };
    if (Object.values(signaturePhotos).every((photo) => !photo)) return null;

    return (
        <section id="signature-moments" className="w-full py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <RevealSection className="space-y-6 mb-12 md:mb-16">
                    <div className="text-center space-y-4">
                        <h2 className="font-khmer-moul text-base sm:text-xl md:text-5xl text-gold-gradient text-gold-embossed py-2">
                            {wedding.themeSettings?.customLabels?.galleryTitle || wedding.themeSettings?.customLabels?.gallery_title || "កម្រងរូបភាពអនុស្សាវរីយ៍"}
                        </h2>
                        <p className="font-kantumruy text-xs md:text-sm text-gold/60 tracking-wide font-bold">
                            {wedding.themeSettings?.customLabels?.gallerySubtitle || "PRE-WEDDING PHOTOS"}
                        </p>
                    </div>
                </RevealSection>

                {/* STRUCTURED TRIPTYCH LAYOUT - ROW 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12 relative">
                    {/* Image 1 */}
                    <RevealSection delay={0.1}>
                        <div className="flex flex-col gap-6">
                            <div 
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl border border-gold/10 bg-gold/5"
                            >
                                {signaturePhotos.signature1 ? (
                                    <img 
                                        src={signaturePhotos.signature1}
                                        className={`object-cover transition-all duration-2000 ${signaturePan1.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                        style={{ 
                                            objectPosition: `${signaturePan1.localX} ${signaturePan1.localY}`,
                                            userSelect: 'none',
                                            touchAction: 'none'
                                        }}
                                        onMouseDown={signaturePan1.onStart}
                                        onTouchStart={signaturePan1.onStart}
                                        draggable={false}
                                        alt="Signature Moment 1" 
                                         
                                        loading="lazy" 
                                    />
                                ) : (
                                    <CinematicPlaceholder label="រូបភាព" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </RevealSection>

                    {/* Image 2 (Center Focus) */}
                    <RevealSection delay={0.2}>
                        <div className="flex flex-col gap-6 -mt-4 md:mt-0">
                            <div 
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] md:shadow-[0_40px_100px_-20px_rgba(212,175,55,0.2)] border-2 border-gold/20 md:scale-105 z-10 bg-gold/5"
                            >
                                {signaturePhotos.signature2 ? (
                                    <img 
                                        src={signaturePhotos.signature2}
                                        className={`object-cover transition-all duration-2000 ${signaturePan2.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                        style={{ 
                                            objectPosition: `${signaturePan2.localX} ${signaturePan2.localY}`,
                                            userSelect: 'none',
                                            touchAction: 'none'
                                        }}
                                        onMouseDown={signaturePan2.onStart}
                                        onTouchStart={signaturePan2.onStart}
                                        draggable={false}
                                        alt="Signature Moment 2" 
                                         
                                        loading="lazy" 
                                    />
                                ) : (
                                    <CinematicPlaceholder label="រូបភាព" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </RevealSection>

                    {/* Image 3 */}
                    <RevealSection delay={0.3}>
                        <div className="flex flex-col gap-6 -mt-4 md:mt-0">
                            <div 
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl border border-gold/10 bg-gold/5"
                            >
                                {signaturePhotos.signature3 ? (
                                    <img 
                                        src={signaturePhotos.signature3}
                                        className={`object-cover transition-all duration-2000 ${signaturePan3.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                        style={{ 
                                            objectPosition: `${signaturePan3.localX} ${signaturePan3.localY}`,
                                            userSelect: 'none',
                                            touchAction: 'none'
                                        }}
                                        onMouseDown={signaturePan3.onStart}
                                        onTouchStart={signaturePan3.onStart}
                                        draggable={false}
                                        alt="Signature Moment 3" 
                                         
                                        loading="lazy" 
                                    />
                                ) : (
                                    <CinematicPlaceholder label="រូបភាព" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </RevealSection>
                </div>

                {/* STRUCTURED TRIPTYCH LAYOUT - ROW 2 */}
                {(signaturePhotos.signature4 || signaturePhotos.signature5 || signaturePhotos.signature6) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12 relative mt-12 md:mt-32">
                        {/* Image 4 */}
                        <RevealSection delay={0.1}>
                            <div className="flex flex-col gap-6">
                                <div 
                                    className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl border border-gold/10 bg-gold/5"
                                >
                                    {signaturePhotos.signature4 ? (
                                        <img 
                                            src={signaturePhotos.signature4}
                                            className={`object-cover transition-all duration-2000 ${signaturePan4.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                            style={{ 
                                                objectPosition: `${signaturePan4.localX} ${signaturePan4.localY}`,
                                                userSelect: 'none',
                                                touchAction: 'none'
                                            }}
                                            onMouseDown={signaturePan4.onStart}
                                            onTouchStart={signaturePan4.onStart}
                                            draggable={false}
                                            alt="Signature Moment 4" 
                                             
                                            loading="lazy" 
                                        />
                                    ) : (
                                        <CinematicPlaceholder label="រូបភាព" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </RevealSection>

                        {/* Image 5 (Center Focus) */}
                        <RevealSection delay={0.2}>
                            <div className="flex flex-col gap-6 -mt-4 md:mt-0">
                                <div 
                                    className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] md:shadow-[0_40px_100px_-20px_rgba(212,175,55,0.2)] border-2 border-gold/20 md:scale-105 z-10 bg-gold/5"
                                >
                                    {signaturePhotos.signature5 ? (
                                        <img 
                                            src={signaturePhotos.signature5}
                                            className={`object-cover transition-all duration-2000 ${signaturePan5.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                            style={{ 
                                                objectPosition: `${signaturePan5.localX} ${signaturePan5.localY}`,
                                                userSelect: 'none',
                                                touchAction: 'none'
                                            }}
                                            onMouseDown={signaturePan5.onStart}
                                            onTouchStart={signaturePan5.onStart}
                                            draggable={false}
                                            alt="Signature Moment 5" 
                                             
                                            loading="lazy" 
                                        />
                                    ) : (
                                        <CinematicPlaceholder label="រូបភាព" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </RevealSection>

                        {/* Image 6 */}
                        <RevealSection delay={0.3}>
                            <div className="flex flex-col gap-6 -mt-4 md:mt-0">
                                <div 
                                    className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl md:shadow-2xl border border-gold/10 bg-gold/5"
                                >
                                    {signaturePhotos.signature6 ? (
                                        <img 
                                            src={signaturePhotos.signature6}
                                            className={`object-cover transition-all duration-2000 ${signaturePan6.isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`} 
                                            style={{ 
                                                objectPosition: `${signaturePan6.localX} ${signaturePan6.localY}`,
                                                userSelect: 'none',
                                                touchAction: 'none'
                                            }}
                                            onMouseDown={signaturePan6.onStart}
                                            onTouchStart={signaturePan6.onStart}
                                            draggable={false}
                                            alt="Signature Moment 6" 
                                             
                                            loading="lazy" 
                                        />
                                    ) : (
                                        <CinematicPlaceholder label="រូបភាព" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </RevealSection>
                    </div>
                )}

                <div className="text-center mt-32 space-y-16">
                    <div className="max-w-3xl mx-auto space-y-8">
                        
                        <p className="font-khmer-content text-gray-600 leading-[2] md:leading-[2.5] text-sm md:text-xl italic px-8 relative z-10">
                            {wedding.themeSettings?.customLabels?.thankYouMessage || "យើងខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅបំផុតចំពោះការផ្តល់កិត្តិយសចូលរួម ក្នុងពិធីរបស់យើងខ្ញុំ និងសូមជូនពរឱ្យទទួលបាននូវព្រះពុទ្ធពរ ៤ ប្រការគឺ អាយុ វណ្ណៈ សុខៈ ពលៈ កុំបីឃ្លៀងឃ្លាតឡើយ។"}
                        </p>
                    </div>

                    <div className="flex flex-col items-center space-y-6">
                        <div className="h-[1px] w-12 bg-gold/20" />
                        <div className="space-y-4 font-serif-kh-bold text-xl md:text-4xl text-gold-gradient relative">
                            <OneLineName name={wedding.groomName} />
                            <p className="font-playfair italic text-white/20 text-sm md:text-xl tracking-widest lowercase">and</p>
                            <OneLineName name={wedding.brideName} />
                        </div>
                        <div className="h-[1px] w-12 bg-gold/20" />
                    </div>
                </div>
            </div>
        </section>
    );
}
