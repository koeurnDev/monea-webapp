import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Users, PartyPopper, CalendarCheck, TrendingUp, Activity,
    ArrowRight, Zap, Settings, Megaphone, Shield, ChevronRight, DollarSign
} from "lucide-react";
import { m } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { ErrorBoundary } from "@/components/error-boundary";
import { useTranslation } from "@/i18n/LanguageProvider";

interface AdminStats {
    totalUsers: number;
    totalProjects: number;
    activeProjects: number;
    newProjectsToday: number;
    financialOverview: {
        USD: number;
        KHR: number;
    };
}

interface AdminDashboardClientProps {
    initialStats: AdminStats;
    initialLogs: any[];
    userRole: string | null;
}

const STAT_CONFIGS = [
    {
        key: 'totalUsers',
        icon: Users,
        gradient: "from-primary to-olive",
        glow: "shadow-primary/10",
        bg: "bg-accent",
        iconColor: "text-primary",
        border: "border-primary/20",
    },
    {
        key: 'totalProjects',
        icon: PartyPopper,
        gradient: "from-sage to-primary",
        glow: "shadow-sage/10",
        bg: "bg-accent",
        iconColor: "text-sage",
        border: "border-sage/20",
    },
    {
        key: 'activeProjects',
        icon: CalendarCheck,
        gradient: "from-emerald-500 to-sage",
        glow: "shadow-emerald-500/25",
        bg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        border: "border-emerald-500/20",
    },
    {
        key: 'totalRevenue',
        icon: TrendingUp,
        gradient: "from-gold to-olive",
        glow: "shadow-gold/10",
        bg: "bg-gold/10",
        iconColor: "text-gold",
        border: "border-gold/20",
    },
];

export default function AdminDashboardClient({ initialStats, initialLogs, userRole }: AdminDashboardClientProps) {
    const { t } = useTranslation();

    const stats = [
        {
            label: t('admin.overview.stats.activeHirers'),
            value: initialStats?.totalUsers ?? 0,
            ...STAT_CONFIGS[0],
        },
        {
            label: t('admin.overview.stats.totalProjects'),
            value: initialStats?.totalProjects ?? (initialStats as any)?.totalWeddings ?? 0,
            ...STAT_CONFIGS[1],
        },
        {
            label: t('admin.overview.stats.activeProjects'),
            value: initialStats?.activeProjects ?? (initialStats as any)?.activeWeddings ?? 0,
            ...STAT_CONFIGS[2],
        },
        {
            label: t('admin.overview.stats.totalRevenue'),
            value: `$${(initialStats?.financialOverview?.USD ?? 0).toLocaleString()}`,
            ...STAT_CONFIGS[3],
        }
    ];

    const quickLinks = [
        { to: "/admin/users", icon: Users, label: "អ្នកប្រើ", color: "text-primary", bg: "bg-accent hover:bg-accent/80 border-primary/20 hover:border-primary/40" },
        { to: "/admin/weddings", icon: PartyPopper, label: "មង្គលការ", color: "text-sage", bg: "bg-accent hover:bg-accent/80 border-sage/20 hover:border-sage/40" },
        { to: "/admin/master/payments", icon: TrendingUp, label: "ការលក់ Template", color: "text-gold", bg: "bg-gold/10 hover:bg-gold/20 border-gold/20 hover:border-gold/40" },
        { to: "/admin/master/broadcast", icon: Megaphone, label: "ប្រកាស", color: "text-primary", bg: "bg-accent hover:bg-accent/80 border-primary/20 hover:border-primary/40" },
        { to: "/admin/master/audit", icon: Activity, label: "សវនកម្ម", color: "text-sage", bg: "bg-accent hover:bg-accent/80 border-sage/20 hover:border-sage/40" },
        ...(userRole === "PLATFORM_OWNER" ? [
            { to: "/admin/master/settings", icon: Settings, label: "កំណត់", color: "text-muted-foreground", bg: "bg-muted hover:bg-muted/80 border-border hover:border-primary/30" },
        ] : []),
    ];

    return (
        <ErrorBoundary name="Admin Dashboard">
            <div className="mx-auto max-w-screen-2xl space-y-7">

                {/* Hero Banner */}
                <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/10"
                >
                    {/* Decorative blobs */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-gold/20 blur-xl" />
                    <div className="pointer-events-none absolute left-1/3 top-0 h-24 w-24 rounded-full bg-sage/20 blur-xl" />

                    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/80">
                                Admin Overview
                            </p>
                            <h1 className="mt-1.5 text-2xl font-black tracking-tight md:text-3xl font-kantumruy">
                                ទិដ្ឋភាពទូទៅ
                            </h1>
                            <p className="mt-1 text-sm text-primary-foreground/70 font-kantumruy">
                                ស្វាគមន៍ការត្រឡប់មកវិញ! ប្រព័ន្ធដំណើរការបានល្អ ✨
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm border border-primary-foreground/20">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            </span>
                            <span className="text-sm font-semibold text-primary-foreground/90 font-kantumruy">ប្រព័ន្ធដំណើរការល្អ</span>
                        </div>
                    </div>
                </m.div>

                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, idx) => (
                        <m.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08, duration: 0.4 }}
                            className="group"
                        >
                            <div className={cn(
                                "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                                "bg-card/80 backdrop-blur-sm",
                                "hover:shadow-lg hover:-translate-y-0.5",
                                stat.border,
                                stat.glow,
                                "hover:shadow-md"
                            )}>
                                {/* Gradient top bar */}
                                <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-60", stat.gradient)} />
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground font-kantumruy">{stat.label}</p>
                                        <p className="mt-2.5 text-3xl font-black tracking-tight text-foreground">
                                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:scale-110",
                                        stat.bg,
                                        stat.border
                                    )}>
                                        <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    ))}
                </div>

                {/* Bottom Grid */}
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">

                    {/* Activity Feed */}
                    <m.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground font-kantumruy">
                                    សកម្មភាពថ្មីៗ
                                </h2>
                            </div>
                            <Link to="/admin/logs">
                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
                                    ទាំងអស់ <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                        <div className="divide-y divide-border/70">
                            {(initialLogs || []).slice(0, 6).map((log, i) => (
                                <m.div
                                    key={log.id || i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 + i * 0.05 }}
                                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <Zap className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {log.actorName || log.actorEmail || "System"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground font-kantumruy">
                                            {log.action || "Updated account"}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('km-KH', {
                                            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh'
                                        }) : ''}
                                    </span>
                                </m.div>
                            ))}
                            {(!initialLogs || initialLogs.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-14 gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                        <Activity className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-kantumruy">មិនមានសកម្មភាពថ្មី</p>
                                </div>
                            )}
                        </div>
                    </m.div>

                    {/* Right Column */}
                    <div className="space-y-5">

                        {/* Quick Access */}
                        <m.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground font-kantumruy">
                                    ការចូលប្រើរហ័ស
                                </h2>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-4">
                                {quickLinks.map((link) => (
                                    <Link key={link.to} to={link.to} className="group">
                                        <div className={cn(
                                            "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                                            link.bg
                                        )}>
                                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-card/80 transition-transform group-hover:scale-110", link.color)}>
                                                <link.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-bold text-foreground font-kantumruy text-center leading-tight">{link.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </m.div>

                        {/* System Status */}
                        <m.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.48, duration: 0.4 }}
                            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground font-kantumruy">
                                    ស្ថានភាពប្រព័ន្ធ
                                </h2>
                            </div>
                            <div className="space-y-2.5 p-4">
                                {[
                                    { label: "API", sublabel: "ដំណើរការ", status: "OK", color: "emerald" },
                                    { label: "Database", sublabel: "ល្អ", status: "Stable", color: "sky" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className={cn(
                                            "flex items-center justify-between rounded-xl px-4 py-3",
                                            item.color === "emerald"
                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30"
                                                : "bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "relative flex h-2 w-2",
                                            )}>
                                                <span className={cn(
                                                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                                                    item.color === "emerald" ? "bg-emerald-400" : "bg-sky-400"
                                                )} />
                                                <span className={cn(
                                                    "relative inline-flex h-2 w-2 rounded-full",
                                                    item.color === "emerald" ? "bg-emerald-500" : "bg-sky-500"
                                                )} />
                                            </span>
                                            <div>
                                                <p className={cn(
                                                    "text-xs font-medium",
                                                    item.color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
                                                )}>{item.label}</p>
                                                <p className={cn(
                                                    "text-sm font-bold font-kantumruy",
                                                    item.color === "emerald" ? "text-emerald-800 dark:text-emerald-200" : "text-sky-800 dark:text-sky-200"
                                                )}>{item.sublabel}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider",
                                            item.color === "emerald"
                                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </m.div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
