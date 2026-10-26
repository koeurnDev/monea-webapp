import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
    Coins, 
    Clock, 
    Check, 
    X, 
    Sparkles, 
    ArrowRight, 
    ShieldCheck, 
    Zap 
} from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";

export function WeddingSavingsCalculator() {
    const [guestCount, setGuestCount] = useState<number>(400);

    // Calculate estimated savings
    // Physical card cost: ~ $0.80 per print card + $50 delivery / fuel = guestCount * 0.8 + 50
    const paperCost = Math.round(guestCount * 0.85 + 40);
    const paperTimeDays = Math.round(guestCount / 40) + 7; // delivery & writing by hand

    // Monea cost: $0 (Free) or $9 (Standard Pro)
    const moneaCost = 9;
    const savingsAmount = Math.max(0, paperCost - moneaCost);

    return (
        <section id="calculator" className="py-20 sm:py-28 bg-[#F4F1EA] dark:bg-[#070709] font-kantumruy border-t border-border/60 relative overflow-hidden transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
                        <Coins className="w-3.5 h-3.5" />
                        <span>សន្សំថវិកា & សន្សំពេលវេលា</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-snug">
                        ប្រៀបធៀប៖ ធៀបក្រដាសបុរាណ
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 dark:from-rose-400 dark:to-amber-300">
                            VS MONEO ឌីជីថលទំនើប
                        </span>
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        សាកល្បងរំកិលចំនួនភ្ញៀវ ដើម្បីមើលថាតើអ្នកអាចសន្សំបានប្រាក់ និងពេលវេលាប៉ុន្មានសម្រាប់ថ្ងៃមង្គលការរបស់អ្នក។
                    </p>
                </div>

                {/* Interactive Slider Card */}
                <div className="bg-card rounded-3xl border border-border p-6 sm:p-10 shadow-xl mb-10 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold text-foreground">
                                ចំនួនភ្ញៀវដែលអ្នកគ្រោងនឹងអញ្ជើញ៖
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                                {guestCount} នាក់
                            </span>
                        </div>

                        <input 
                            type="range" 
                            min="100" 
                            max="1200" 
                            step="50"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />

                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>១០០ នាក់ (កម្មវិធីតូច)</span>
                            <span>៥០០ នាក់ (មធ្យម)</span>
                            <span>១,២០០+ នាក់ (កម្មវិធីធំ)</span>
                        </div>
                    </div>

                    {/* Comparison Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
                        {/* Column 1: Paper Cards */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-border">
                                <span className="text-sm font-bold text-foreground">ធៀបក្រដាសបុរាណ</span>
                                <span className="text-xl font-black text-foreground">${paperCost}</span>
                            </div>

                            <div className="space-y-2.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>ចំណាយពេលប្រហែល {paperTimeDays} ថ្ងៃដើរចែកធៀប</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>គ្មានតន្ត្រី និងគ្មានផែនទី GPS ច្បាស់លាស់</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>ពិបាកដឹងថាភ្ញៀវណាខ្លះនឹងមក ឬមិនមក</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>រាប់ស្រោមសំបុត្រ និងលុយដោយដៃ យប់ជ្រៅ</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: MONEO Digital Invitation */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-rose-500/10 to-amber-500/10 border-2 border-rose-500/40 space-y-4 relative overflow-hidden">
                            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                                <div>
                                    <span className="text-sm font-black text-foreground">MONEO ឌីជីថល</span>
                                    <div className="text-xs text-emerald-600 font-bold">សន្សំបាន ~${savingsAmount}</div>
                                </div>
                                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                                    ត្រឹម ${moneaCost}
                                </span>
                            </div>

                            <div className="space-y-2.5 text-xs text-foreground font-medium">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>ផ្ញើតាម Telegram/Messenger ត្រឹម ៥ នាទី</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>មានភ្លេងការ រូបថត Pre-wedding & Google Maps</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>ភ្ញៀវចុច RSVP ដឹងចំនួនមនុស្សចូលរួមពិតប្រាកដ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>ស្កេន KHQR ចំណងដៃ & Export Excel ស្វ័យប្រវត្តិ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA within Calculator */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-2xl border border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                    ចាប់ផ្តើមរចនាធៀបការរបស់អ្នកឥឡូវនេះ
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    មិនចាំបាច់មានបទពិសោធន៍រចនា — ងាយស្រួល និងរហ័សបំផុត
                                </p>
                            </div>
                        </div>

                        <Link
                            to={AUTH_URLS.SIGN_UP}
                            className="w-full sm:w-auto px-6 h-11 rounded-xl border border-primary bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/15 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                        >
                            <span>សាកល្បងឥតគិតថ្លៃ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    );
}
