import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    Sparkles, 
    ArrowRight, 
    MapPin, 
    Calendar, 
    Heart, 
    Send, 
    QrCode, 
    Eye, 
    CheckCircle2, 
    Smartphone,
    Tv
} from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";

export function CleanHomeHero() {
    const [groom, setGroom] = useState("សុវណ្ណ");
    const [bride, setBride] = useState("មុន្នី");

    return (
        <main className="min-h-[100dvh] w-full flex flex-col justify-between relative overflow-hidden bg-[#FAF8F5] dark:bg-[#08080A] text-foreground font-kantumruy transition-colors duration-300">
            {/* Soft Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-rose-500/10 dark:bg-rose-600/15 blur-[140px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 dark:bg-amber-600/15 blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-rose-400/5 dark:bg-rose-900/10 blur-[160px]" />
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
            </div>

            {/* Central Content */}
            <div className="container mx-auto max-w-5xl px-4 sm:px-6 pt-28 sm:pt-32 pb-12 relative z-10 my-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Left: Clean Heading & Actions */}
                    <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                        {/* Luxury Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black tracking-wide shadow-xs"
                        >
                            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                            <span>ធៀបការឌីជីថលបែបខ្មែរទំនើប</span>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-3"
                        >
                            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black text-foreground leading-[1.25] tracking-tight">
                                រចនាធៀបការ
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 dark:from-rose-400 dark:via-amber-300 dark:to-rose-400 animate-gradient">
                                    ក្នុងក្តីស្រមៃរបស់អ្នក
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm max-w-md leading-relaxed">
                                បង្កើតធៀបការឌីជីថលយ៉ាងស្រស់ស្អាត មានតន្ត្រីភ្លេងការ ទីតាំង Google Maps ច្បាស់លាស់ ផ្ញើជូនភ្ញៀវតាម Telegram ត្រឹម ១ ចុច និងកត់ត្រាចំណងដៃ KHQR ដោយស្វ័យប្រវត្តិ។
                            </p>
                        </motion.div>

                        {/* Interactive Groom/Bride Quick Test */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="w-full max-w-md bg-card/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-border/80 shadow-xs space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                    <span>ឈ្មោះគូស្វាមីភរិយា៖</span>
                                </span>
                                <span className="text-xs text-muted-foreground">សាកល្បងវាយឈ្មោះ</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={groom}
                                    onChange={(e) => setGroom(e.target.value)}
                                    placeholder="កូនកំលោះ"
                                    className="h-9 px-3 text-xs font-bold bg-background rounded-xl border border-border focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <input
                                    type="text"
                                    value={bride}
                                    onChange={(e) => setBride(e.target.value)}
                                    placeholder="កូនក្រមុំ"
                                    className="h-9 px-3 text-xs font-bold bg-background rounded-xl border border-border focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        </motion.div>

                        {/* Primary Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
                        >
                            <Link
                                to={AUTH_URLS.SIGN_UP}
                                className="w-full sm:w-auto flex-1 h-12 px-7 rounded-xl border border-primary bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/15 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                            >
                                <span>បង្កើតធៀបការឥឡូវនេះ</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                to={AUTH_URLS.SIGN_IN}
                                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                            >
                                <span>ចូលប្រើប្រាស់</span>
                            </Link>
                        </motion.div>

                        {/* 4 Feature Pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-muted-foreground font-medium"
                        >
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80">
                                <Send className="w-3 h-3 text-rose-500" />
                                <span>ចែករំលែកតាម Telegram</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80">
                                <MapPin className="w-3 h-3 text-amber-500" />
                                <span>Google Maps</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80">
                                <QrCode className="w-3 h-3 text-emerald-500" />
                                <span>KHQR ចំណងដៃ</span>
                            </span>
                        </motion.div>
                    </div>

                    {/* Right: Stunning Luxury Digital Wedding Envelope Card */}
                    <div className="lg:col-span-6 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[390px]"
                        >
                            {/* Card Body */}
                            <div className="relative rounded-3xl p-6 sm:p-7 border-2 border-amber-500/40 bg-gradient-to-br from-[#1C160C] via-[#2A1D0B] to-[#17120A] text-[#FDF8E7] shadow-2xl shadow-amber-950/30 overflow-hidden space-y-5">
                                
                                {/* Header Seal */}
                                <div className="text-center pb-3 border-b border-amber-500/20 space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-xs font-bold text-amber-300 border border-amber-500/30">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        <span>សិរីសួស្តី អាពាហ៍ពិពាហ៍</span>
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-white pt-1 font-moul">
                                        ធៀបអញ្ជើញ
                                    </h2>
                                </div>

                                {/* Couple Names */}
                                <div className="py-4 text-center space-y-1.5">
                                    <div className="text-2xl sm:text-3xl font-black text-amber-100 tracking-wide flex items-center justify-center gap-2.5">
                                        <span>{groom || "កូនកំលោះ"}</span>
                                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                        <span>{bride || "កូនក្រមុំ"}</span>
                                    </div>
                                    <p className="text-xs text-amber-200/70">
                                        សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី
                                    </p>
                                </div>

                                {/* Event Details */}
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-2.5 text-xs text-amber-100/90">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-xs">ថ្ងៃអាទិត្យ ទី១២ ខែធ្នូ ឆ្នាំ២០២៦</div>
                                            <div className="text-xs text-white/60">វេលាម៉ោង ៥:០០ ល្ងាច (ពិធីជប់លៀង)</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-xs">មជ្ឈមណ្ឌលសន្និបាត ឌឹ ព្រេមៀ សែនសុខ</div>
                                            <div className="text-xs text-white/60">អគារ A សាលមហោស្រព</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Preview */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 font-bold text-xs text-amber-200 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>ឆ្លើយតប RSVP</span>
                                    </div>
                                    <div className="h-9 rounded-xl bg-white/10 border border-white/15 font-bold text-xs text-white flex items-center justify-center gap-1">
                                        <MapPin className="w-3 h-3 text-rose-400" />
                                        <span>មើលផែនទី</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* Simple Clean Footer */}
            <footer className="w-full py-4 border-t border-border/60 text-center text-xs text-muted-foreground relative z-10">
                <p>© 2026 MONEO • រៀបចំមង្គលការ និងកម្មវិធីផ្សេងៗយ៉ាងងាយស្រួល</p>
            </footer>
        </main>
    );
}
