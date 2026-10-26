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
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-white to-emerald-50/50 text-center font-kantumruy relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-6 relative z-10">
                <div className="text-emerald-700 flex items-center justify-center mx-auto">
                    <Heart size={20} className="fill-emerald-600 text-emerald-600" />
                </div>

                <div className="space-y-2">
                    <span className="text-xl sm:text-2xl font-khmer-moul text-[#1B4332] block">
                        សូមអរគុណ
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                        វត្តមានដ៏ខ្ពង់ខ្ពស់របស់លោកអ្នក គឺជាកិត្តិយស និងជាសេចក្តីសោមនស្សរីករាយឥតឧបមា សម្រាប់ក្រុមគ្រួសារយើងខ្ញុំទាំងពីរ។
                    </p>
                </div>

                <div className="py-3">
                    <CoupleNamesLine groom={groomName} bride={brideName} className="text-lg font-serif italic text-emerald-900 font-bold" />
                </div>

                <SocialLinksSection wedding={wedding} />
                <MoneaFooterBrand className="border-t border-emerald-200/60 pt-6" />
            </div>
        </section>
    );
};
