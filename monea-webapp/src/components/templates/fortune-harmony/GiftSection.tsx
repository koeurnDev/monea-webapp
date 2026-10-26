import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { WeddingData } from '../types';
import { getConfiguredPaymentAccounts } from "../shared/weddingPhotos";

interface GiftSectionProps {
    wedding: WeddingData;
    primaryColor: string;
}

export const GiftSection: React.FC<GiftSectionProps> = ({ wedding, primaryColor }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const bankAccounts = getConfiguredPaymentAccounts(wedding.themeSettings?.bankAccounts);
    const labels = wedding.themeSettings?.customLabels;

    const handleCopy = (num: string, idx: number) => {
        navigator.clipboard.writeText(num);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (bankAccounts.length === 0) return null;

    return (
        <section className="py-12 px-4 sm:px-6 bg-transparent text-[#2d352b] font-kantumruy relative overflow-hidden text-center">
            <div className="max-w-md mx-auto space-y-6 relative z-10">
                <div className="space-y-1">
                    <span className="fh-khmer-safe block px-2 font-khmer-moul text-lg text-[#4d5649] sm:text-2xl">
                        {labels?.giftTitle || "ចំណងដៃអាពាហ៍ពិពាហ៍"}
                    </span>
                    {labels?.giftSubtitle && (
                        <p className="fh-khmer-safe mx-auto max-w-md text-xs leading-relaxed text-[#4d5649]">
                            {labels.giftSubtitle}
                        </p>
                    )}
                    {labels?.giftBadge && <span className="fh-khmer-safe inline-flex rounded-full border border-[#8ea07a]/40 px-3 py-1 text-xs font-semibold text-[#4d5649]">{labels.giftBadge}</span>}
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#8ea07a] to-transparent mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {bankAccounts.map((acc, idx) => (
                        <div
                            key={idx}
                            className="space-y-4 border-b border-[#d9d1bf] py-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2 text-left">
                                <span className="fh-khmer-safe max-w-full break-words font-khmer-moul text-xs font-bold text-[#4d5649]">
                                    KHQR
                                </span>
                                <span className="fh-khmer-safe min-w-0 break-words font-kantumruy text-xs font-bold text-[#2d352b] [overflow-wrap:anywhere]">
                                    {acc.accountName || "ឈ្មោះគណនី"}
                                </span>
                            </div>

                            {/* QR Code */}
                            {(acc.qrUrl || (acc as any).qrCodeUrl) && (
                                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-amber-400/50 shadow-inner flex items-center justify-center">
                                    <img
                                        src={acc.qrUrl || (acc as any).qrCodeUrl}
                                        alt="KHQR Code"
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                </div>
                            )}

                            {/* Account Number with Copy */}
                            {acc.accountNumber && (
                                <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#d9d1bf] px-1 py-2.5 text-xs sm:px-2">
                                    <span className="min-w-0 break-all font-mono font-bold text-[#2d352b]">
                                        {acc.accountNumber}
                                    </span>
                                    <button
                                        onClick={() => acc.accountNumber && handleCopy(acc.accountNumber, idx)}
                                        className="flex shrink-0 items-center gap-1 font-bold text-[#4d5649] transition-all hover:text-[#2d352b] active:scale-95"
                                    >
                                        {copiedIndex === idx ? (
                                            <>
                                                <Check size={14} />
                                                <span className="fh-khmer-safe">បានចម្លង</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                <span className="fh-khmer-safe">ចម្លងលេខ</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
