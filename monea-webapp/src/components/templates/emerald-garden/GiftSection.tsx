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
        <section className="py-12 px-4 sm:px-6 bg-emerald-50/20 font-kantumruy relative overflow-hidden text-center">
            <div className="max-w-md mx-auto space-y-6 relative z-10">
                <div className="space-y-1">
                    <span className="text-xl sm:text-2xl font-khmer-moul text-[#1B4332] block">
                        {labels?.giftTitle || "ចំណងដៃអាពាហ៍ពិពាហ៍"}
                    </span>
                    {labels?.giftSubtitle && (
                        <p className="mx-auto max-w-md text-xs leading-relaxed text-emerald-900/75">
                            {labels.giftSubtitle}
                        </p>
                    )}
                    {labels?.giftBadge && <span className="inline-flex rounded-full border border-emerald-800/20 px-3 py-1 text-xs font-semibold text-emerald-800">{labels.giftBadge}</span>}
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-600 to-transparent mx-auto" />
                </div>

                <div className="space-y-6">
                    {bankAccounts.map((acc, idx) => {
                        const qrUrl = acc.qrUrl || acc.qrCodeUrl;

                        return (
                            <div
                                key={idx}
                                className="border-b border-emerald-900/10 pb-6 last:border-0 last:pb-0"
                            >
                                    <div className={`grid items-center gap-x-4 gap-y-3 text-left ${qrUrl ? "grid-cols-[minmax(0,1fr)_9rem]" : "grid-cols-1"}`}>
                                        <div className="min-w-0 space-y-2">
                                            <span className="block break-words text-xs font-bold text-emerald-800">
                                                {acc.bankName || "ធនាគារ"}
                                            </span>
                                            <span className="block break-words text-xs font-bold text-slate-800">
                                                {acc.accountName || "ឈ្មោះគណនី"}
                                            </span>
                                            {acc.accountNumber && (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-emerald-900/15 py-2.5 text-xs">
                                                    <span className="min-w-0 break-all font-mono font-bold tracking-wider text-slate-800">
                                                        {acc.accountNumber}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => acc.accountNumber && handleCopy(acc.accountNumber, idx)}
                                                        className="flex shrink-0 items-center gap-1 font-bold text-emerald-700 transition-all hover:text-emerald-800 active:scale-95"
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
                                        {qrUrl && (
                                            <div className="flex h-36 w-36 items-center justify-center bg-white">
                                                <img
                                                    src={qrUrl}
                                                    alt="KHQR Code"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
