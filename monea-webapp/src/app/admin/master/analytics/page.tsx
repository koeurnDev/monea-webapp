import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    ArrowLeft,
    BarChart3,
    DollarSign,
    Calendar,
    Loader2,
    RefreshCcw,
    Sparkles
} from "lucide-react";
import { Link } from 'react-router-dom';
import { useTranslation } from "@/i18n/LanguageProvider";

export default function MasterAnalyticsPage() {
    const { locale } = useTranslation();
    const isKm = locale === 'km';
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/master/analytics");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const summary = data?.summary || {
        templateRevenueUSD: 0,
        templateRevenueKHR: 0,
        templateSalesCount: 0,
        usdGifts: 0,
        khrGifts: 0,
        totalWeddings: 0
    };

    const maxMonthlyCount = Math.max(...(data?.weddingsByMonth?.map((m: any) => m.count) || [1]), 1);

    return (
        <div className="w-full min-h-full font-kantumruy pb-16">
            {/* Top Bar Header */}
            <div className="bg-card/80 backdrop-blur-md border-b border-border/80 sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/admin/master">
                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border border-border bg-card shadow-xs hover:bg-muted">
                                <ArrowLeft size={17} className="text-muted-foreground" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                <TrendingUp size={13} />
                                <span>Platform Analytics</span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-bold text-foreground">
                                {isKm ? "ស្ថិតិកំណើន និងចំណូលសរុប (Revenue & Growth)" : "Revenue & Growth Analytics"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={loadData}
                            variant="outline"
                            disabled={loading}
                            className="h-10 px-4 rounded-xl font-bold text-xs border border-border bg-card shadow-xs flex items-center gap-2"
                        >
                            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                            <span>{isKm ? "ផ្ទុកឡើងវិញ" : "Refresh"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground">{isKm ? "ចំណូលពីការលក់ Template" : "Template Revenue"}</p>
                                <h3 className="text-2xl font-black text-teal-800 dark:text-teal-300 mt-1">${Number(summary.templateRevenueUSD).toFixed(2)}</h3>
                                <p className="text-xs text-emerald-600 font-bold mt-0.5">
                                    {isKm ? "ប្រាក់រៀល" : "KHR"} {Number(summary.templateRevenueKHR).toLocaleString("en-US")} ៛
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-600/10 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                                <DollarSign size={22} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground">{isKm ? "ការទិញ Template" : "Template Sales"}</p>
                                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{Number(summary.templateSalesCount).toLocaleString()}</h3>
                                <p className="text-xs text-muted-foreground font-bold mt-0.5">
                                    {isKm ? "ចំនួនកម្មវិធីមង្គលការសរុប" : "Total weddings"}: {Number(summary.totalWeddings).toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                <Sparkles size={22} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Monthly wedding registrations */}
                    <Card className="lg:col-span-12 bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="p-6 pb-4 border-b border-border/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                <BarChart3 size={18} className="text-teal-700 dark:text-teal-300" />
                                <span>{isKm ? "ស្ថិតិកំណើនបង្កើតមង្គលការប្រចាំខែ" : "Monthly Wedding Registrations"}</span>
                            </CardTitle>
                            <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-teal-600/10 text-teal-800 dark:text-teal-300">
                                {summary.totalWeddings} {isKm ? "កម្មវិធីសរុប" : "Total Weddings"}
                            </span>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-teal-700 dark:text-teal-300" />
                                    <span className="text-xs text-muted-foreground">កំពុងទាញយកទិន្នន័យ...</span>
                                </div>
                            ) : data?.weddingsByMonth?.length > 0 ? (
                                <div className="space-y-4">
                                    {data.weddingsByMonth.map((m: any, i: number) => {
                                        const percent = Math.min(100, Math.round((m.count / maxMonthlyCount) * 100));
                                        return (
                                            <div key={i} className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 transition-colors">
                                                <div className="flex justify-between items-center text-xs font-bold text-foreground">
                                                    <span className="font-mono">{m.month}</span>
                                                    <span className="text-teal-800 dark:text-teal-300 font-black">{m.count} កម្មវិធី</span>
                                                </div>
                                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-teal-600 to-amber-400 rounded-full transition-all duration-700"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                        <Calendar size={22} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">មិនទាន់មានទិន្នន័យកំណើននៅឡើយទេ</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}
