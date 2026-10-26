import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, QrCode } from 'lucide-react';
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
        <section className="py-12 px-4 sm:px-6 bg-rose-50/20 font-kantumruy relative overflow-hidden text-center">
            <div className="max-w-md mx-auto space-y-6 relative z-10">
                <div className="space-y-1">
                    <span className="text-xl sm:text-2xl font-khmer-moul text-[#B45309] block">
                        {labels?.giftTitle || "ចំណងដៃអាពាហ៍ពិពាហ៍"}
                    </span>
                    {labels?.giftSubtitle && (
                        <p className="mx-auto max-w-md text-xs leading-relaxed text-rose-800/80">
                            {labels.giftSubtitle}
                        </p>
                    )}
                    {labels?.giftBadge && <span className="inline-flex rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700">{labels.giftBadge}</span>}
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {bankAccounts.map((acc, idx) => (
                        <div
                            key={idx}
                            className="space-y-4 border-b border-rose-200/80 py-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <span className="max-w-full break-words text-xs font-bold text-rose-700">
                                    {acc.bankName || "ធនាគារ"}
                                </span>
                                <span className="min-w-0 break-words text-right text-xs font-bold text-slate-800 [overflow-wrap:anywhere]">
                                    {acc.accountName || "ឈ្មោះគណនី"}
                                </span>
                            </div>

                            {/* QR Code */}
                            {(acc.qrUrl || (acc as any).qrCodeUrl) && (
                                <div className="mx-auto flex h-44 w-44 items-center justify-center bg-white p-2">
                                    <img
                                        src={acc.qrUrl || (acc as any).qrCodeUrl}
                                        alt="KHQR Code"
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                </div>
                            )}

                            {/* Account Number with Copy */}
                            {acc.accountNumber && (
                                <div className="flex min-w-0 items-center justify-between gap-2 border-b border-rose-200/80 px-1 py-2.5 text-xs">
                                    <span className="min-w-0 break-all font-mono font-bold tracking-wider text-slate-800">
                                        {acc.accountNumber}
                                    </span>
                                    <button
                                        onClick={() => acc.accountNumber && handleCopy(acc.accountNumber, idx)}
                                        className="flex shrink-0 items-center gap-1 border-b border-rose-300 py-1 font-bold text-rose-700 transition-colors hover:text-rose-800 active:scale-95"
                                    >
                                        {copiedIndex === idx ? (
                                            <>
                                                <Check size={14} />
                                                <span>បានចម្លង</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                <span>ចម្លងលេខ</span>
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
