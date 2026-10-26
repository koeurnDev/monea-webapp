import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Send, 
    QrCode, 
    Tv, 
    FileSpreadsheet, 
    Check, 
    Sparkles, 
    Smartphone, 
    Share2, 
    Camera, 
    Coins 
} from "lucide-react";

interface StepItem {
    id: string;
    stepNumber: string;
    title: string;
    subtitle: string;
    highlight: string;
    description: string;
    points: string[];
    icon: React.ElementType;
    color: string;
    badge: string;
    previewType: "telegram" | "scanner" | "display" | "gifts";
}

const STEPS: StepItem[] = [
    {
        id: "step-1",
        stepNumber: "០១",
        title: "ផ្ញើធៀបការតាម Telegram & Messenger",
        subtitle: "ចែកធៀបជូនភ្ញៀវក្នុង ១ ចុច",
        highlight: "មានឈ្មោះភ្ញៀវចំៗលើធៀបការ",
        description: "លែងបាច់ដើរចែកធៀបក្រដាសអស់ពេលច្រើនសប្តាហ៍! គ្រាន់តែបញ្ចូលឈ្មោះភ្ញៀវ ប្រព័ន្ធនឹងបង្កើត Link ពិសេសដែលមានឈ្មោះភ្ញៀវ និងស្រោមសំបុត្រមានចលនាយ៉ាងស្រស់ស្អាត។",
        points: [
            "ឈ្មោះភ្ញៀវបង្ហាញលើធៀបផ្ទាល់ (Personalized Guest Link)",
            "ភ្ញៀវចុចមើលផែនទី Google Maps មិនខ្លាចវង្វេងរោងការ",
            "ភ្ញៀវចុច RSVP បញ្ជាក់ការចូលរួមបានភ្លាមៗ"
        ],
        icon: Share2,
        color: "from-blue-600 to-indigo-600",
        badge: "មុនថ្ងៃការ (Before Wedding)",
        previewType: "telegram"
    },
    {
        id: "step-2",
        stepNumber: "០២",
        title: "ស្កេន QR ឆែកឈ្មោះភ្ញៀវចូលតុ",
        subtitle: "រហ័ស មិនបាច់ឈររកឈ្មោះលើក្រដាស",
        highlight: "កាមេរ៉ាស្កេន ១ វិនាទី ដឹងលេខតុភ្លាម",
        description: "ពេលភ្ញៀវមកដល់មាត់រោងការ ក្រុមការងារគ្រាន់តែយកទូរស័ព្ទស្កេន QR លើធៀបរបស់ភ្ញៀវ ប្រព័ន្ធនឹងបង្ហាញឈ្មោះ និងលេខតុជូនភ្ញៀវភ្លាមៗ។",
        points: [
            "ស្កេនតាមទូរស័ព្ទដៃធម្មតា មិនបាច់ឧបករណ៍បន្ថែម",
            "ដឹងចំនួនភ្ញៀវមកដល់ជាក់ស្តែង (Real-time Attendance)",
            "កាត់បន្ថយការកកស្ទះនៅមាត់ច្រកចូលរោងការ"
        ],
        icon: QrCode,
        color: "from-emerald-600 to-teal-600",
        badge: "ពេលភ្ញៀវមកដល់ (Guest Check-in)",
        previewType: "scanner"
    },
    {
        id: "step-3",
        stepNumber: "០៣",
        title: "បញ្ចាំង Live Display លើកញ្ចក់ទូរទស្សន៍",
        subtitle: "បរិយាកាសក្នុងរោងការកាន់តែអធិកអធម",
        highlight: "ភ្ញៀវថតរូបបង្ហោះឡើងអេក្រង់ផ្ទាល់",
        description: "ភ្ជាប់ទូរទស្សន៍ក្នុងរោងការជាមួយ MONEO ដើម្បីចាក់ស្លាយរូបថត Pre-wedding, រាប់ថយក្រោយដល់ម៉ោងកាត់នំ, និងឱ្យភ្ញៀវផ្ញើសារជូនពរ ឬរូបថតផ្ទាល់ពីទូរស័ព្ទ។",
        points: [
            "ចាក់ Slide រូបភាព Pre-Wedding កម្រិត 4K ច្បាស់ត្រជាក់ភ្នែក",
            "ភ្ញៀវថតរូប Selfie បង្ហោះឡើងអេក្រង់ក្នុងរោងការ (Live Photo Wall)",
            "បង្ហាញ QR សម្រាប់ភ្ញៀវចូលរួមលេងហ្គេម និងជូនពរ"
        ],
        icon: Tv,
        color: "from-rose-600 to-pink-600",
        badge: "ក្នុងពិធីជប់លៀង (Live in Wedding Hall)",
        previewType: "display"
    },
    {
        id: "step-4",
        stepNumber: "០៤",
        title: "កត់ត្រាចំណងដៃ & KHQR ស្វ័យប្រវត្តិ",
        subtitle: "លែងបារម្ភរឿងរាប់លុយបាត់ ឬច្រឡំលេខ",
        highlight: "Export ជា Excel ក្នុង ១ វិនាទី",
        description: "ភ្ញៀវអាចស្កេន KHQR (ABA / Bakong) តាមទូរស័ព្ទដៃ ឬក្រុមការងារកត់ត្រាប្រាក់ចំណងដៃតាមទូរស័ព្ទ។ ទិន្នន័យត្រូវបានរក្សាទុកយ៉ាងមានសុវត្ថិភាព។",
        points: [
            "គាំទ្រទាំងប្រាក់រៀល (KHR) និងដុល្លារ (USD)",
            "បូកសរុបប្រាក់ចំណងដៃសរុបភ្លាមៗពេលចប់ពិធី",
            "ទាញយកជាឯកសារ Excel (Export to Excel) គ្រប់ពេលវេលា"
        ],
        icon: Coins,
        color: "from-amber-600 to-orange-600",
        badge: "គ្រប់គ្រងចំណងដៃ (Gift Registry)",
        previewType: "gifts"
    }
];

export function WeddingJourneySection() {
    const [activeTab, setActiveTab] = useState<string>("step-1");
    const currentStep = STEPS.find(s => s.id === activeTab) || STEPS[0];

    return (
        <section id="journey" className="py-20 sm:py-28 bg-[#FAF8F5] dark:bg-[#0B0B0E] font-kantumruy border-t border-border/60 relative overflow-hidden transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ដំណោះស្រាយពេញលេញសម្រាប់ពិធីមង្គលការខ្មែរ</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl lg:text-[2.6rem] font-black text-foreground tracking-tight leading-[1.3]">
                        ដំណើរការនៃថ្ងៃមង្គលការ
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 dark:from-rose-400 dark:to-amber-300">
                            ជាមួយ MONEO តាំងពីដើមរហូតដល់ចប់
                        </span>
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                        មិនមែនត្រឹមតែជាធៀបការធម្មតាទេ MONEO ជួយសម្រាលការងារមង្គលការរបស់អ្នកគ្រប់ជំហាន។
                    </p>
                </div>

                {/* Interactive Step Switcher Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-10">
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isSelected = activeTab === step.id;
                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setActiveTab(step.id)}
                                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                                    isSelected 
                                        ? "bg-card border-primary shadow-md ring-2 ring-primary/20" 
                                        : "bg-card/60 hover:bg-card border-border/80 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}>
                                        ជំហាន {step.stepNumber}
                                    </span>
                                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                </div>
                                <div className={`text-xs font-bold line-clamp-1 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                                    {step.title.split(" ")[0]} {step.title.split(" ")[1]}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Step Showcase Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                        className="bg-card rounded-3xl border border-border p-6 sm:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                    >
                        {/* Left Details */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                    {currentStep.badge}
                                </span>
                                <h3 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                                    {currentStep.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-bold">
                                    ★ {currentStep.highlight}
                                </p>
                            </div>

                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                                {currentStep.description}
                            </p>

                            <div className="space-y-2.5 pt-2">
                                {currentStep.points.map((pt, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                        <span className="font-medium">{pt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Interactive Mockup Preview */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="w-full max-w-[320px] bg-muted/40 rounded-3xl p-4 sm:p-6 border border-border flex flex-col items-center justify-center text-center space-y-4">
                                {currentStep.previewType === "telegram" && (
                                    <div className="w-full space-y-3">
                                        <div className="bg-[#229ED9]/10 text-[#229ED9] p-3 rounded-2xl flex items-center gap-3">
                                            <Smartphone className="w-6 h-6" />
                                            <div className="text-left text-xs font-bold text-foreground">
                                                <span>សារ Telegram ជូនភ្ញៀវ៖</span>
                                                <div className="text-xs text-muted-foreground">« ជម្រាបសួរលោកពូ សុខ... »</div>
                                            </div>
                                        </div>
                                        <div className="bg-card p-3 rounded-2xl border border-border text-left space-y-1.5 shadow-xs">
                                            <div className="text-xs font-bold text-foreground">💌 ធៀបមង្គលការ សុវណ្ណ & មុន្នី</div>
                                            <div className="text-xs text-muted-foreground">សូមគោរពអញ្ជើញ លោកពូ សុខ និងភរិយា...</div>
                                            <div className="text-xs text-rose-600 font-bold underline">moneoez.com/w/demo-invitation</div>
                                        </div>
                                    </div>
                                )}

                                {currentStep.previewType === "scanner" && (
                                    <div className="w-full space-y-3">
                                        <div className="w-24 h-24 mx-auto rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                                            <QrCode className="w-12 h-12 text-emerald-600" />
                                        </div>
                                        <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-xl text-xs font-bold">
                                            ✓ ភ្ញៀវ៖ លោក គង់ សម្បត្តិ (តុលេខ ០៨)
                                        </div>
                                    </div>
                                )}

                                {currentStep.previewType === "display" && (
                                    <div className="w-full space-y-3">
                                        <div className="aspect-video w-full rounded-2xl bg-black flex flex-col items-center justify-center text-white p-3 border border-white/20">
                                            <Tv className="w-8 h-8 text-rose-400 mb-1" />
                                            <span className="text-xs font-bold">LIVE SCREEN 4K</span>
                                            <span className="text-xs text-white/70">ស្វាគមន៍ភ្ញៀវកិត្តិយស</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-bold">
                                            ចាក់ Slide រូបថត & សារជូនពរលើកញ្ចក់ទូរទស្សន៍
                                        </div>
                                    </div>
                                )}

                                {currentStep.previewType === "gifts" && (
                                    <div className="w-full space-y-2.5">
                                        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 text-left space-y-1">
                                            <div className="text-xs font-bold text-foreground">💰 សរុបចំណងដៃថ្ងៃមង្គលការ</div>
                                            <div className="text-lg font-black text-amber-600">$12,450.00 / ៛8,200,000</div>
                                            <div className="text-xs text-muted-foreground">ភ្ញៀវចងដៃសរុប៖ ៤៨០ នាក់</div>
                                        </div>
                                        <div className="w-full h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                                            <FileSpreadsheet className="w-4 h-4" />
                                            <span>Export ជា Excel ភ្លាមៗ</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

            </div>
        </section>
    );
}
