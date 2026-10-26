import React from 'react';
import { Heart } from 'lucide-react';
import { WeddingData } from '../types';
import { CoupleNamesLine } from "../shared/OneLineName";
import { MoneaFooterBrand } from "../shared/MoneaFooterBrand";
import { SocialLinksSection } from "../shared/SocialLinksSection";

interface ThankYouSectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const ThankYouSection: React.FC<ThankYouSectionProps> = ({ wedding, primaryColor }) => {
    const groomName = wedding.groomName || "កូនកំលោះ";
    const brideName = wedding.brideName || "កូនក្រមុំ";

    return (
        <section className="relative overflow-hidden bg-transparent px-4 py-10 text-center font-kantumruy text-[#2d352b] sm:px-6 sm:py-12">
            <div className="relative z-10 mx-auto max-w-md space-y-5">
                <div className="mx-auto flex items-center justify-center">
                    <Heart aria-hidden="true" className="h-5 w-5 fill-[#8ea07a]/20" style={{ color: primaryColor }} />
                </div>

                <div className="space-y-2.5">
                    <h2 className="fh-khmer-safe block px-2 font-khmer-moul text-lg text-[#4d5649] sm:text-xl">
                        សូមអរគុណ
                    </h2>
                    <p className="fh-khmer-safe mx-auto max-w-sm font-kantumruy text-sm leading-7 text-[#475448]">
                        វត្តមានដ៏ខ្ពង់ខ្ពស់របស់លោកអ្នក គឺជាកិត្តិយស និងជាសេចក្តីសោមនស្សរីករាយឥតឧបមា សម្រាប់ក្រុមគ្រួសារយើងខ្ញុំទាំងពីរ។
                    </p>
                </div>

                <div className="border-y border-[#d9d1bf] py-4">
                    <CoupleNamesLine groom={groomName} bride={brideName} className="fh-khmer-safe m05-font-name text-base font-bold text-[#2d352b] sm:text-lg" />
                </div>

                <SocialLinksSection wedding={wedding} />
                <MoneaFooterBrand className="pt-1" />
            </div>
        </section>
    );
};
