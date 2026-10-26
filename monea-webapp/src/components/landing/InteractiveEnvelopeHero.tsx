import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, 
    ArrowRight, 
    MapPin, 
    Calendar, 
    Heart, 
    Volume2, 
    VolumeX, 
    CheckCircle2, 
    RotateCcw,
    Send,
    QrCode,
    Users
} from "lucide-react";
import { AUTH_URLS } from "@/lib/constants";

interface ThemePreset {
    id: string;
    name: string;
    bgClass: string;
    cardBg: string;
    accentClass: string;
    goldBorder: string;
    tag: string;
}

const THEMES: ThemePreset[] = [
    {
        id: "khmer-gold",
        name: "មរតកខ្មែរ (Khmer Gold)",
        bgClass: "from-amber-900/90 via-amber-950 to-stone-950 text-amber-100",
        cardBg: "bg-gradient-to-br from-[#1C160C] to-[#2E200C] text-[#FDF8E7] border-amber-500/40",
        accentClass: "text-amber-400",
        goldBorder: "border-amber-400/50 shadow-amber-500/20",
        tag: "ពេញនិយមបំផុត"
    },
    {
        id: "blossom-rose",
        name: "មង្គលផ្កា (Blossom Rose)",
        bgClass: "from-rose-900/90 via-rose-950 to-stone-950 text-rose-100",
        cardBg: "bg-gradient-to-br from-[#240D14] to-[#3B121F] text-[#FFF0F4] border-rose-400/40",
        accentClass: "text-rose-400",
        goldBorder: "border-rose-400/50 shadow-rose-500/20",
        tag: "រ៉ូមែនទិក"
    },
    {
        id: "emerald-luxe",
        name: "ព្រៃមរកត (Emerald Luxe)",
        bgClass: "from-emerald-950 via-teal-950 to-stone-950 text-emerald-100",
        cardBg: "bg-gradient-to-br from-[#0B1D16] to-[#123326] text-[#EAF7F1] border-emerald-400/40",
        accentClass: "text-emerald-400",
        goldBorder: "border-emerald-400/50 shadow-emerald-500/20",
        tag: "ប្រណិតភាព"
    },
    {
        id: "modern-minimal",
        name: "រាត្រីរស្មី (Modern Minimal)",
        bgClass: "from-slate-900 via-zinc-950 to-black text-slate-100",
        cardBg: "bg-gradient-to-br from-[#12141A] to-[#1E232E] text-[#F0F4F8] border-slate-400/40",
        accentClass: "text-blue-400",
        goldBorder: "border-slate-400/50 shadow-slate-500/20",
        tag: "ទាន់សម័យ"
    }
];

export function InteractiveEnvelopeHero() {
    const [groom, setGroom] = useState("សុវណ្ណ");
    const [bride, setBride] = useState("មុន្នី");
    const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEMES[0]);
    const [isOpen, setIsOpen] = useState(true);
    const [hasRsvp, setHasRsvp] = useState(false);

    return (
        <section className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#FAF8F5] dark:bg-[#08080A] text-foreground font-kantumruy pt-24 sm:pt-28 pb-16 px-4 sm:px-6 transition-colors duration-300">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-rose-500/10 dark:bg-rose-600/15 blur-[140px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 dark:bg-amber-600/15 blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-rose-400/5 dark:bg-rose-900/10 blur-[160px]" />
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Left Column: Authentic Khmer Wedding Proposition */}
                    <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                        {/* Unique Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black tracking-wide shadow-xs"
                        >
                            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                            <span>វេទិកាធៀបការឌីជីថលខ្មែរជំនាន់ថ្មី • MONEO</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-2"
                        >
                            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-foreground leading-[1.25] tracking-tight">
                                ធៀបការឌីជីថលបែបខ្មែរ
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 dark:from-rose-400 dark:via-amber-300 dark:to-rose-400 animate-gradient">
                                    រៀបចំត្រឹម ៥ នាទី
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                                ផ្ញើធៀបការតាម Telegram ភ្លាមៗ ភ្ញៀវចុចមើលផែនទីរោងការ បើកស្រោមសំបុត្រមានភ្លេងការ ឆ្លើយតប RSVP និងស្កេន KHQR ចំណងដៃបានយ៉ាងងាយស្រួល។
                            </p>
                        </motion.div>

                        {/* Interactive Realtime Customizer Inputs */}
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-md bg-card/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-border/80 shadow-md space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                    សាកល្បងដាក់ឈ្មោះកូនកំលោះ & កូនក្រមុំ៖
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">Live Preview</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold block mb-1">ឈ្មោះកូនកំលោះ</label>
                                    <input 
                                        type="text" 
                                        value={groom} 
                                        onChange={(e) => setGroom(e.target.value)}
                                        placeholder="ឈ្មោះកូនកំលោះ" 
                                        className="w-full h-9 px-3 text-xs font-bold bg-background rounded-xl border border-border focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold block mb-1">ឈ្មោះកូនក្រមុំ</label>
                                    <input 
                                        type="text" 
                                        value={bride} 
                                        onChange={(e) => setBride(e.target.value)}
                                        placeholder="ឈ្មោះកូនក្រមុំ" 
                                        className="w-full h-9 px-3 text-xs font-bold bg-background rounded-xl border border-border focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                            </div>

                            {/* Theme Preset Selector */}
                            <div className="pt-1">
                                <label className="text-xs text-muted-foreground font-bold block mb-1.5">ជ្រើសរើសម៉ូដធៀបការ៖</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {THEMES.map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setSelectedTheme(theme)}
                                            className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-center truncate ${
                                                selectedTheme.id === theme.id 
                                                    ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                                                    : "bg-muted/50 hover:bg-muted text-foreground border-border"
                                            }`}
                                        >
                                            {theme.name.split(" ")[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
                        >
                            <Link
                                to={AUTH_URLS.SIGN_UP}
                                className="w-full sm:w-auto flex-1 h-12 px-6 rounded-xl border border-primary bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/15 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                            >
                                <span>បង្កើតធៀបការរបស់អ្នកផ្ទាល់</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full sm:w-auto h-12 px-5 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isOpen ? "បិទស្រោមសំបុត្រ" : "បើកមើលធៀបការ"}</span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Live Interactive Digital Wedding Envelope */}
                    <div className="lg:col-span-6 flex items-center justify-center">
                        <div className="relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[400px] perspective-[1200px]">
                            
                            {/* Envelope & Card Wrapper */}
                            <motion.div
                                layout
                                className={`relative rounded-3xl p-5 sm:p-6 border-2 shadow-2xl transition-all duration-500 overflow-hidden ${selectedTheme.cardBg} ${selectedTheme.goldBorder}`}
                            >
                                {/* Top Header Ribbon */}
                                <div className="text-center pb-4 border-b border-white/10 space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white/90">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        <span>សិរីសួស្តី អាពាហ៍ពិពាហ៍</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white pt-1 font-moul">
                                        ធៀបអញ្ជើញ
                                    </h2>
                                </div>

                                {/* Couple Names Banner */}
                                <div className="py-6 text-center space-y-2">
                                    <div className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center justify-center gap-3">
                                        <span>{groom || "កូនកំលោះ"}</span>
                                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-bounce" />
                                        <span>{bride || "កូនក្រមុំ"}</span>
                                    </div>
                                    <p className="text-xs text-white/70 font-medium">
                                        សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី
                                    </p>
                                </div>

                                {/* Wedding Details Card */}
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3 text-xs text-white/90">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">ថ្ងៃអាទិត្យ ទី១២ ខែធ្នូ ឆ្នាំ២០២៦</div>
                                            <div className="text-xs text-white/70">វេលាម៉ោង ៥:០០ ល្ងាច (ពិធីជប់លៀង)</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">មជ្ឈមណ្ឌលសន្និបាត & ពិព័រណ៍ ឌឹ ព្រេមៀ សែនសុខ</div>
                                            <div className="text-xs text-white/70">អគារ A សាលមហោស្រព</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Interactive Feature Triggers on Card */}
                                <div className="pt-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setHasRsvp(!hasRsvp)}
                                            className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                                hasRsvp 
                                                    ? "bg-emerald-600 text-white shadow-xs" 
                                                    : "bg-white/20 hover:bg-white/30 text-white border border-white/20"
                                            }`}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{hasRsvp ? "បានឆ្លើយតប ✓" : "ឆ្លើយតប (RSVP)"}</span>
                                        </button>

                                        <a
                                            href="https://maps.google.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                            <span>មើលផែនទី Maps</span>
                                        </a>
                                    </div>

                                    <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between text-xs text-white/80">
                                        <span className="flex items-center gap-1.5">
                                            <QrCode className="w-4 h-4 text-amber-400" />
                                            <span>ស្កេន KHQR ចងដៃតាមទូរស័ព្ទ</span>
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                                            ABA / Bakong
                                        </span>
                                    </div>
                                </div>

                                {/* Floating Live Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                </div>
                            </motion.div>

                            {/* Floating decorative elements */}
                            <div className="absolute -bottom-4 -left-4 bg-card/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border shadow-lg flex items-center gap-2 text-xs font-bold text-foreground">
                                <Send className="w-3.5 h-3.5 text-rose-600" />
                                <span>ចែករំលែកតាម Telegram ក្នុង 1-Tap</span>
                            </div>

                            <div className="absolute -top-3 -right-3 bg-card/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border shadow-lg flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Users className="w-3.5 h-3.5 text-amber-500" />
                                <span>ភ្ញៀវចូលរួម 520+ នាក់</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
