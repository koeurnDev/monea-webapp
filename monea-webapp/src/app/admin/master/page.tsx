import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    CreditCard,
    Database,
    FileText,
    Globe,
    LifeBuoy,
    LockKeyhole,
    Megaphone,
    PartyPopper,
    RefreshCw,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Share2,
    TrendingUp,
    UserRound,
    Users,
    Wrench
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";

interface RecentWedding {
    id: string;
    groomName: string;
    brideName: string;
    createdAt: string;
    status: string;
    packageType: string | null;
}

interface MasterStats {
    stats: {
        totalWeddings: number;
        activeWeddings: number;
        totalGuests: number;
        totalUsers: number;
        blacklistedIPs: number;
        dbHealth?: string;
    };
    recentWeddings: RecentWedding[];
}

const adminModules = [
    {
        title: "គ្រប់គ្រងមង្គលការ",
        subtitle: "Weddings",
        desc: "មើលកម្មវិធីទាំងអស់ កែស្ថានភាព និងគ្រប់គ្រងកញ្ចប់សេវា។",
        href: "/admin/master/weddings",
        icon: PartyPopper,
        group: "អាជីវកម្ម"
    },
    {
        title: "គ្រប់គ្រងអ្នកប្រើប្រាស់",
        subtitle: "Users",
        desc: "ស្វែងរកគណនី និងពិនិត្យសិទ្ធិអ្នកប្រើប្រាស់។",
        href: "/admin/master/users",
        icon: Users,
        group: "អាជីវកម្ម"
    },
    {
        title: "ការលក់ Template",
        subtitle: "Template Sales",
        desc: "គ្រប់គ្រងការលក់ Template, បង្កាន់ដៃទូទាត់ និងសិទ្ធិប្រើប្រាស់។",
        href: "/admin/master/payments",
        icon: CreditCard,
        group: "អាជីវកម្ម"
    },
    {
        title: "សារប្រកាស",
        subtitle: "Broadcast",
        desc: "បង្ហោះសារសំខាន់ទៅកាន់អ្នកប្រើប្រាស់។",
        href: "/admin/master/broadcast",
        icon: Megaphone,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "សន្តិសុខ និង IP",
        subtitle: "Security",
        desc: "គ្រប់គ្រង IP ដែលត្រូវបានទប់ស្កាត់ និងការពារប្រព័ន្ធ។",
        href: "/admin/master/security",
        icon: ShieldAlert,
        group: "សុវត្ថិភាព"
    },
    {
        title: "កំណត់ត្រាសវនកម្ម",
        subtitle: "Audit logs",
        desc: "តាមដានសកម្មភាព និងការកែប្រែរបស់ Admin។",
        href: "/admin/master/audit",
        icon: FileText,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "ការថែទាំប្រព័ន្ធ",
        subtitle: "Maintenance",
        desc: "គ្រប់គ្រងស្ថានភាពថែទាំ និងការបម្រុងទុក។",
        href: "/admin/master/maintenance",
        icon: Wrench,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "ស្ថិតិប្រព័ន្ធ",
        subtitle: "Analytics",
        desc: "មើលស្ថិតិការប្រើប្រាស់ និងការចូលរួមរបស់ភ្ញៀវ។",
        href: "/admin/master/analytics",
        icon: TrendingUp,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "គោលការណ៍ឯកជនភាព និងលក្ខខណ្ឌ",
        subtitle: "Legal content",
        desc: "កែប្រែ Privacy Policy និង Terms of Use ជាភាសាខ្មែរ និងអង់គ្លេស។",
        href: "/admin/master/legal-content",
        icon: FileText,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "បណ្តាញសង្គម",
        subtitle: "Social Media",
        desc: "បន្ថែម ឬកែតំណភ្ជាប់បណ្តាញសង្គមដែលបង្ហាញនៅ Footer។",
        href: "/admin/master/social-links",
        icon: Share2,
        group: "ប្រព័ន្ធ"
    },
    {
        title: "ការកំណត់ទូទៅ",
        subtitle: "Settings",
        desc: "កំណត់រចនាសម្ព័ន្ធ និងសេវាភ្ជាប់របស់ MONEO។",
        href: "/admin/master/settings",
        icon: Settings,
        group: "ប្រព័ន្ធ"
    }
];

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("km-KH", { timeZone: "Asia/Phnom_Penh" });
};

export default function MasterAdminPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<MasterStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(false);

        try {
            const response = await fetch("/api/admin/master/stats");
            if (!response.ok) {
                throw new Error(`Master dashboard request failed (${response.status})`);
            }

            const result = await response.json() as MasterStats;
            if (!result.stats || !Array.isArray(result.recentWeddings)) {
                throw new Error("Master dashboard response was incomplete");
            }
            setData(result);
        } catch (error) {
            console.error("[Admin Master] Failed to load overview:", error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const stats = [
        {
            label: t("admin.overview.stats.totalWeddings", { defaultValue: "មង្គលការសរុប" }),
            value: data?.stats.totalWeddings,
            detail: `${data?.stats.activeWeddings ?? 0} សកម្ម`,
            icon: PartyPopper
        },
        {
            label: t("admin.overview.stats.activeHirers", { defaultValue: "អ្នកប្រើប្រាស់សរុប" }),
            value: data?.stats.totalUsers,
            detail: "គណនីលើប្រព័ន្ធ",
            icon: Users
        },
        {
            label: t("admin.overview.stats.globalGuests", { defaultValue: "ភ្ញៀវសរុប" }),
            value: data?.stats.totalGuests,
            detail: "បានបន្ថែមក្នុងកម្មវិធី",
            icon: UserRound
        },
        {
            label: t("admin.overview.stats.ipBlacklist", { defaultValue: "IP ត្រូវបានទប់ស្កាត់" }),
            value: data?.stats.blacklistedIPs,
            detail: "កំណត់ត្រាសន្តិសុខ",
            icon: LockKeyhole
        }
    ];

    const databaseHealthy = data?.stats.dbHealth === "HEALTHY";

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-8 pb-12 font-kantumruy">
            <section className="relative overflow-hidden rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-500/[0.07] blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-600/[0.07] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300">
                            <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400" />
                            Platform administration
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                            {t("admin.overview.title", { defaultValue: "មជ្ឈមណ្ឌលបញ្ជាមេ" })}
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                            ទិដ្ឋភាពរួមនៃ MONEO និងផ្លូវកាត់ទៅកាន់ការគ្រប់គ្រងសំខាន់ៗ។
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild variant="outline" className="h-11 rounded-xl border-border bg-background px-4 text-xs font-bold">
                            <Link to="/admin/master/audit">
                                <FileText size={15} className="mr-2" />
                                {t("admin.overview.systemLogs", { defaultValue: "កំណត់ត្រាប្រព័ន្ធ" })}
                            </Link>
                        </Button>
                        <Button asChild className="h-11 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white hover:bg-teal-800">
                            <Link to="/admin/master/settings">
                                <Settings size={15} className="mr-2" />
                                {t("admin.overview.globalSettings", { defaultValue: "ការកំណត់ទូទៅ" })}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {loadError && (
                <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <CircleAlert size={18} className="mt-0.5 shrink-0 text-destructive" />
                        <div>
                            <p className="text-sm font-bold text-foreground">មិនអាចទាញយកទិន្នន័យផ្ទាំងគ្រប់គ្រងបានទេ</p>
                            <p className="mt-1 text-xs text-muted-foreground">សូមពិនិត្យការភ្ជាប់ ហើយព្យាយាមម្ដងទៀត។</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => void loadData()} disabled={loading} className="h-10 rounded-xl border-border bg-card text-xs font-bold">
                        <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
                        ព្យាយាមម្ដងទៀត
                    </Button>
                </div>
            )}

            <section aria-label="Platform statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="rounded-2xl border-border bg-card shadow-sm">
                        <CardContent className="flex min-h-[126px] items-center justify-between gap-4 p-5">
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-muted-foreground">{stat.label}</p>
                                {loading ? (
                                    <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-muted" />
                                ) : (
                                    <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-foreground">
                                        {(stat.value ?? 0).toLocaleString()}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-600/20 bg-teal-600/[0.07] text-teal-800 dark:text-teal-300">
                                <stat.icon size={20} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300">Workspace</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">ការគ្រប់គ្រងប្រព័ន្ធ</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">ជ្រើសរើសផ្នែកដែលអ្នកចង់គ្រប់គ្រង</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {adminModules.map((module, index) => (
                        <Link
                            key={module.href}
                            to={module.href}
                            className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                        >
                            <Card className="h-full rounded-2xl border-border bg-card shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-teal-600/30 group-hover:shadow-md">
                                <CardContent className="flex h-full min-h-[156px] flex-col p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-600/20 bg-teal-600/[0.07] text-teal-800 dark:text-teal-300">
                                            <module.icon size={19} />
                                        </div>
                                        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                            {module.group}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-1 items-end justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{module.subtitle}</p>
                                            <h3 className="mt-1 text-sm font-black text-foreground">{module.title}</h3>
                                            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{module.desc}</p>
                                        </div>
                                        <ChevronRight size={17} className="mb-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-teal-700" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
                <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="text-base font-black text-foreground">
                                {t("admin.overview.recentWeddings.title", { defaultValue: "កម្មវិធីមង្គលការថ្មីៗ" })}
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.overview.recentWeddings.subtitle", { defaultValue: "ការចុះឈ្មោះប្រើប្រាស់ចុងក្រោយ" })}
                            </p>
                        </div>
                        <Button asChild variant="outline" className="h-9 shrink-0 rounded-xl border-border bg-background px-3 text-xs font-bold">
                            <Link to="/admin/master/weddings">
                                មើលទាំងអស់ <ArrowRight size={14} className="ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="space-y-3 p-5">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className="h-[58px] animate-pulse rounded-xl bg-muted/70" />
                                ))}
                            </div>
                        ) : data?.recentWeddings.length ? (
                            <div className="divide-y divide-border">
                                {data.recentWeddings.map((wedding) => (
                                    <div key={wedding.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                                <PartyPopper size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-foreground">{wedding.groomName} & {wedding.brideName}</p>
                                                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{wedding.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pl-12 sm:pl-0">
                                            <span className={cn(
                                                "rounded-full border px-2.5 py-1 text-xs font-bold",
                                                wedding.packageType === "PREMIUM"
                                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                                    : wedding.packageType === "PRO"
                                                        ? "border-teal-600/20 bg-teal-600/[0.07] text-teal-800 dark:text-teal-300"
                                                        : "border-border bg-muted/50 text-muted-foreground"
                                            )}>
                                                {wedding.packageType || "FREE"}
                                            </span>
                                            <span className={cn(
                                                "flex items-center gap-1.5 text-xs font-bold",
                                                wedding.status === "ACTIVE" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                                            )}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full", wedding.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                                                {wedding.status}
                                            </span>
                                            <span className="min-w-[78px] text-right text-xs tabular-nums text-muted-foreground">
                                                {formatDate(wedding.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center px-5 py-10 text-center">
                                <PartyPopper size={22} className="text-muted-foreground" />
                                <p className="mt-3 text-sm font-bold text-foreground">
                                    {t("admin.overview.recentWeddings.empty", { defaultValue: "មិនទាន់មានកម្មវិធីមង្គលការនៅឡើយទេ" })}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="rounded-2xl border-border bg-card shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2">
                                <Activity size={17} className="text-teal-800 dark:text-teal-300" />
                                <h2 className="text-sm font-black text-foreground">សុខភាពប្រព័ន្ធ</h2>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                                <div className="flex items-center gap-2.5">
                                    <Database size={16} className="text-muted-foreground" />
                                    <span className="text-xs font-bold text-foreground">មូលដ្ឋានទិន្នន័យ</span>
                                </div>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                                    databaseHealthy
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                        : data
                                            ? "bg-teal-600/10 text-teal-800 dark:text-teal-300"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {databaseHealthy ? <CheckCircle2 size={12} /> : data ? <CircleAlert size={12} /> : <Globe size={12} />}
                                    {loading ? "កំពុងពិនិត្យ" : databaseHealthy ? "បានភ្ជាប់" : data ? "មិនស្គាល់" : "មិនទាន់មានទិន្នន័យ"}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                ស្ថានភាពនេះត្រូវបានរាយការណ៍ពីការត្រួតពិនិត្យ Database ចុងក្រោយ។
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-teal-600/20 bg-teal-600/[0.04] shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-600/20 bg-teal-600/[0.07] text-teal-800 dark:text-teal-300">
                                    <LifeBuoy size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-black text-foreground">ត្រូវការជំនួយ?</h2>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">ពិនិត្យសំណើ និងឆ្លើយតបអតិថិជនពី Support Desk។</p>
                                    <Link to="/admin/master/support" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200">
                                        បើក Support Desk <ArrowRight size={13} />
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
