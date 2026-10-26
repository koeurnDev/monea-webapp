import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Search, 
    ArrowLeft, 
    ArrowUpRight, 
    Users, 
    Loader2, 
    Archive,
    Crown, 
    RotateCcw,
    Sparkles, 
    DollarSign,
    CheckCircle2,
    LayoutGrid
} from "lucide-react";
import { Link } from 'react-router-dom';
import { cn, formatCambodiaDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TEMPLATE_DEFINITIONS } from "@/components/templates/template-config";

function getPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | "ellipsis"> = [1];
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) pages.push("ellipsis");
    for (let page = startPage; page <= endPage; page += 1) pages.push(page);
    if (endPage < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
}

function formatWeddingCreatedAt(value: unknown): string | null {
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const timestamp = value instanceof Date
        ? value.toISOString()
        : value.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T");
    const utcTimestamp = typeof value === "string"
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(timestamp)
        ? `${timestamp}Z`
        : timestamp;
    const date = new Date(utcTimestamp);
    if (!Number.isFinite(date.getTime())) return null;

    return formatCambodiaDate(date, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
}

export default function MasterWeddingsPage() {
    const { showToast } = useToast();
    const [weddings, setWeddings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<any>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, premium: 0 });
    const [canEditPackages, setCanEditPackages] = useState(false);
    const [canManageStatus, setCanManageStatus] = useState(false);
    const [pricing, setPricing] = useState<{ standard: number; pro: number }>({ standard: 9, pro: 19 });
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [changeReason, setChangeReason] = useState("");
    const [paymentDisposition, setPaymentDisposition] = useState<"PAID" | "WAIVED">("PAID");
    const [paymentReference, setPaymentReference] = useState("");
    const [statusReason, setStatusReason] = useState("");
    const [statusTarget, setStatusTarget] = useState<{
        weddingId: string;
        coupleName: string;
        status: string;
    } | null>(null);
    const requestId = useRef(0);

    // Manual Upgrade Modal State
    const [upgradeTarget, setUpgradeTarget] = useState<{
        weddingId: string;
        coupleName: string;
        currentPackage: string;
        userEmail: string;
    } | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string>("PRO");

    const loadData = useCallback((page = 1) => {
        const currentRequestId = ++requestId.current;
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
            search,
            page: String(page),
            packageType: "ALL"
        });
        fetch(`/api/admin/master/weddings?${params}`)
            .then(res => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then(data => {
                if (currentRequestId !== requestId.current) return;
                setWeddings(data.weddings || []);
                setPagination(data.pagination);
                setStats({
                    total: Number(data.stats?.total) || 0,
                    active: Number(data.stats?.active) || 0,
                    premium: Number(data.stats?.premium) || 0
                });
                setCanEditPackages(Boolean(data.permissions?.canEditPackages));
                setCanManageStatus(Boolean(data.permissions?.canManageStatus));
                if (data.pricing) {
                    setPricing({
                        standard: Number(data.pricing.standard) || 9,
                        pro: Number(data.pricing.pro) || 19
                    });
                }
            })
            .catch((error: unknown) => {
                if (currentRequestId === requestId.current) {
                    setWeddings([]);
                    setPagination(null);
                    setStats({ total: 0, active: 0, premium: 0 });
                    setCanEditPackages(false);
                    setCanManageStatus(false);
                    const forbidden = error instanceof Error && error.message.includes("(403)");
                    const message = forbidden
                        ? "អ្នកមិនមានសិទ្ធិចូលមើលបញ្ជីកម្មវិធីមង្គលការនេះទេ។"
                        : "បរាជ័យក្នុងការទាញយកទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។";
                    setLoadError(message);
                    showToast({ title: forbidden ? "គ្មានសិទ្ធិចូលប្រើ" : "បរាជ័យក្នុងការទាញយកទិន្នន័យ", type: "error" });
                }
            })
            .finally(() => {
                if (currentRequestId === requestId.current) setLoading(false);
            });
    }, [search, showToast]);

    useEffect(() => {
        requestId.current += 1;
        const delayDebounceFn = setTimeout(() => {
            loadData(1);
        }, 300);
        return () => {
            clearTimeout(delayDebounceFn);
            requestId.current += 1;
        };
    }, [search, loadData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const getPackageKhmerName = (pkg: string) => {
        if (pkg === 'FREE') return 'ឥតគិតថ្លៃ';
        if (pkg === 'PRO') return 'ស្តង់ដារ';
        if (pkg === 'PREMIUM') return 'ពិសេស VIP';
        return pkg;
    };

    const handleManualUpgrade = async () => {
        if (!upgradeTarget) return;
        setProcessingId(upgradeTarget.weddingId);

        try {
            const res = await fetch("/api/admin/master/weddings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weddingId: upgradeTarget.weddingId,
                    packageType: selectedPackage,
                    paymentDisposition: selectedPackage === "FREE" ? "NOT_APPLICABLE" : paymentDisposition,
                    paymentReference: selectedPackage !== "FREE" && paymentDisposition === "PAID" ? paymentReference.trim() : null,
                    reason: changeReason.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
            if (data.success) {
                showToast({
                    title: `បានដំឡើងកញ្ចប់ ${getPackageKhmerName(selectedPackage)} ជោគជ័យ!`,
                    description: `កម្មវិធីរបស់ ${upgradeTarget.coupleName} ត្រូវបានដំឡើងទៅជាកញ្ចប់ ${getPackageKhmerName(selectedPackage)} ដោយជោគជ័យ។`,
                    type: "success"
                });

                setUpgradeTarget(null);
                loadData(1);
            } else {
                throw new Error(data.error || "Failed");
            }
        } catch (error: any) {
            showToast({
                title: "បរាជ័យក្នុងការដំឡើងកញ្ចប់",
                description: error.message || "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។",
                type: "error"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusChange = async () => {
        if (!statusTarget || statusReason.trim().length < 10 || statusReason.trim().length > 500) return;
        const action = statusTarget.status === "ACTIVE" ? "ARCHIVE" : "RESTORE";
        setProcessingId(statusTarget.weddingId);

        try {
            const res = await fetch("/api/admin/master/weddings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weddingId: statusTarget.weddingId,
                    action,
                    reason: statusReason.trim()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || `Request failed (${res.status})`);
            }

            showToast({
                title: data.changed
                    ? (action === "ARCHIVE" ? "បានរក្សាទុកកម្មវិធីក្នុងប័ណ្ណសារ" : "បានស្ដារកម្មវិធីជាសកម្ម")
                    : "កម្មវិធីមានស្ថានភាពនេះរួចហើយ",
                description: statusTarget.coupleName,
                type: data.changed ? "success" : "info"
            });
            setStatusTarget(null);
            setStatusReason("");
            loadData(pagination?.currentPage || 1);
        } catch (error: any) {
            showToast({
                title: "បរាជ័យក្នុងការប្ដូរស្ថានភាព",
                description: error.message || "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។",
                type: "error"
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-full bg-background p-1.5 font-kantumruy text-foreground sm:p-5">
            <div className="mx-auto max-w-[1360px] rounded-[22px] border border-border bg-card p-1.5 shadow-sm sm:rounded-[28px] sm:p-4">
                <div className="flex flex-col gap-4 rounded-[18px] border border-border/70 bg-muted/30 p-2 sm:rounded-[22px] sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center justify-between gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted"
                                aria-label="Back"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <div className="flex-1 text-center sm:flex-none sm:text-left">
                                <h1 className="text-lg font-black tracking-[-0.03em] text-foreground sm:text-2xl">
                                    គ្រប់គ្រងកម្មវិធីមង្គលការ
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <form onSubmit={handleSearch} className="relative w-full sm:min-w-[220px] sm:max-w-[320px]">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="ស្វែងរកតាមឈ្មោះ, កូដ ឬអ៊ីមែល..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 text-base font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-teal-600/30 sm:h-11 sm:text-sm"
                                />
                            </form>

                            <Link to="/admin/master/templates" className="w-full sm:w-auto">
                                <Button variant="outline" className="h-11 w-full rounded-xl px-4 text-sm font-black sm:w-auto">
                                    <LayoutGrid size={15} className="mr-1.5" />
                                    គ្រប់គ្រង Template
                                </Button>
                            </Link>

                            <Link to="/admin/master/payments" className="w-full sm:w-auto">
                                <Button className="h-11 w-full rounded-xl bg-teal-700 px-4 text-sm font-black text-white shadow-sm hover:bg-teal-800 sm:w-auto">
                                    <DollarSign size={15} className="mr-1.5" />
                                    ការលក់ Template
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
                        <div className="rounded-[18px] border border-border bg-card p-3 shadow-sm sm:rounded-[22px] sm:p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">TOTAL</p>
                            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground sm:mt-3 sm:text-4xl">{stats.total}</p>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-base">កម្មវិធីសរុប</p>
                        </div>

                        <div className="rounded-[18px] border border-border bg-card p-3 shadow-sm sm:rounded-[22px] sm:p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">ACTIVE</p>
                            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground sm:mt-3 sm:text-4xl">{stats.active}</p>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-base">សកម្មភាព</p>
                        </div>

                        <div className="col-span-2 rounded-[18px] border border-border bg-card p-3 shadow-sm sm:rounded-[22px] sm:p-5 md:col-span-1">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">PREMIUM</p>
                            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-foreground sm:mt-3 sm:text-4xl">{stats.premium}</p>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-base">VIP</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[22px] border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">OVERVIEW</p>
                            <h2 className="mt-1 text-lg font-bold text-foreground">បញ្ជីកម្មវិធី</h2>
                        </div>
                        <span className="self-start rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground sm:self-auto">
                            {loading ? 'Loading...' : `${pagination?.total ?? weddings.length} results`}
                        </span>
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[1040px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-xs font-black tracking-wide text-muted-foreground">
                                    <th className="px-5 py-4">គូស្វាមីភរិយា / កាលបរិច្ឆេទ</th>
                                    <th className="px-5 py-4 text-center">Template ដែល User បានប្រើ</th>
                                    <th className="px-5 py-4 text-center">ភ្ញៀវ</th>
                                    <th className="px-5 py-4">ម្ចាស់គណនី</th>
                                    <th className="px-5 py-4 text-right">សកម្មភាព</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-700 dark:text-teal-300" />
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">កំពុងទាញយកទិន្នន័យ...</p>
                                        </td>
                                    </tr>
                                ) : loadError ? (
                                    <tr>
                                        <td colSpan={5} role="alert" className="py-16 text-center text-sm font-bold text-destructive">
                                            {loadError}
                                        </td>
                                    </tr>
                                ) : weddings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-xs font-bold text-muted-foreground">
                                            មិនមានទិន្នន័យមង្គលការដែលត្រូវស្វែងរកឡើយ
                                        </td>
                                    </tr>
                                ) : weddings.map((w) => {
                                    const templateIds = Array.from(new Set([
                                        w.templateId,
                                        ...(Array.isArray(w.activeTemplateIds) ? w.activeTemplateIds : [])
                                    ].filter((id): id is string => typeof id === "string" && id.length > 0)));
                                    const createdAt = formatWeddingCreatedAt(w.createdAt);

                                    return (
                                        <tr key={w.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-5 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black leading-relaxed text-foreground">
                                                        {w.groomName} & {w.brideName}
                                                    </span>
                                                    <span className="mt-1 text-sm font-mono text-muted-foreground">
                                                        {new Date(w.date).toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
                                                    </span>
                                                    {createdAt && (
                                                        <span className="mt-1 text-xs text-muted-foreground">
                                                            បង្កើត៖ {createdAt}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-5 text-center">
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    {templateIds.length > 0 ? templateIds.map((templateId) => {
                                                        const template = TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS];
                                                        return (
                                                            <span
                                                                key={templateId}
                                                                title={template?.title || templateId}
                                                                className="flex flex-col items-center gap-0.5 rounded-xl border border-teal-600/25 bg-teal-600/10 px-3 py-2 text-teal-800 dark:text-teal-300"
                                                            >
                                                                <span className="flex items-center gap-1 text-xs font-black">
                                                                    <LayoutGrid size={12} />
                                                                    {template?.code || templateId}
                                                                </span>
                                                                <span className="max-w-32 text-[10px] font-bold leading-tight">
                                                                    {template?.title || "Template មិនស្គាល់"}
                                                                </span>
                                                            </span>
                                                        );
                                                    }) : (
                                                        <span className="text-xs text-muted-foreground">មិនទាន់ជ្រើសរើស</span>
                                                    )}
                                                    <span className="text-xs font-mono font-bold text-muted-foreground">#{w.weddingCode || '---'}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="flex items-center justify-center">
                                                    <div className="flex flex-col items-center rounded-xl border border-border bg-muted/40 px-3 py-2">
                                                        <Users size={13} className="mb-1 text-muted-foreground" />
                                                        <span className="text-sm font-black text-foreground">{w._count?.guests || 0}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{w.user?.name || 'No User'}</span>
                                                    <span className="mt-1 break-all text-xs font-mono text-muted-foreground">{w.user?.email || 'No Email'}</span>
                                                    <span className="mt-1 text-xs font-mono text-muted-foreground">ID: {w.userId || w.user?.id || '---'}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-5 text-right">
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    {canEditPackages && (
                                                        <button
                                                            onClick={() => {
                                                                setUpgradeTarget({
                                                                    weddingId: w.id,
                                                                    coupleName: `${w.groomName} & ${w.brideName}`,
                                                                    currentPackage: w.packageType || 'FREE',
                                                                    userEmail: w.user?.email || ''
                                                                });
                                                                setSelectedPackage(w.packageType === 'PREMIUM' ? 'PREMIUM' : 'PRO');
                                                                setChangeReason("");
                                                                setPaymentDisposition("PAID");
                                                                setPaymentReference("");
                                                            }}
                                                            className="flex min-h-10 items-center gap-1.5 rounded-xl border border-teal-600/25 bg-teal-600/10 px-3 text-xs font-bold text-teal-800 transition-all hover:bg-teal-600/15 active:scale-95 dark:text-teal-300"
                                                        >
                                                            <Crown size={13} className="shrink-0 text-teal-700 dark:text-teal-300" />
                                                            <span>កែប្រែ</span>
                                                        </button>
                                                    )}
                                                    {canManageStatus && (
                                                        <button
                                                            onClick={() => {
                                                                setStatusTarget({
                                                                    weddingId: w.id,
                                                                    coupleName: `${w.groomName} & ${w.brideName}`,
                                                                    status: w.status
                                                                });
                                                                setStatusReason("");
                                                            }}
                                                            className={cn(
                                                                "flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all active:scale-95",
                                                                w.status === "ACTIVE"
                                                                    ? "border-border bg-muted/50 text-foreground hover:bg-muted"
                                                                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                                                            )}
                                                        >
                                                            {w.status === "ACTIVE" ? <Archive size={13} /> : <RotateCcw size={13} />}
                                                            <span>{w.status === "ACTIVE" ? "ទុកប័ណ្ណសារ" : "ស្ដារ"}</span>
                                                        </button>
                                                    )}

                                                    <Link
                                                        to={`/w/${encodeURIComponent(w.id)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex min-h-10 items-center gap-1 rounded-xl border border-border bg-muted/30 px-3 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
                                                    >
                                                        <span>មើល</span>
                                                        <ArrowUpRight size={13} className="shrink-0" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 p-3 md:hidden">
                        {loading ? (
                            <div className="rounded-2xl border border-border bg-card p-6 text-center">
                                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-700 dark:text-teal-300" />
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">កំពុងទាញយកទិន្នន័យ...</p>
                            </div>
                        ) : loadError ? (
                            <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 p-8 text-center text-sm font-bold text-destructive">
                                {loadError}
                            </div>
                        ) : weddings.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs font-bold text-muted-foreground">
                                មិនមានទិន្នន័យមង្គលការដែលត្រូវស្វែងរកឡើយ
                            </div>
                        ) : weddings.map((w) => {
                            const templateIds = Array.from(new Set([
                                w.templateId,
                                ...(Array.isArray(w.activeTemplateIds) ? w.activeTemplateIds : [])
                            ].filter((id): id is string => typeof id === "string" && id.length > 0)));
                            const createdAt = formatWeddingCreatedAt(w.createdAt);

                            return (
                                <div key={w.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-base font-black leading-relaxed text-foreground">
                                                {w.groomName} & {w.brideName}
                                            </p>
                                            <p className="mt-1 text-sm font-mono text-muted-foreground">
                                                {new Date(w.date).toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
                                            </p>
                                            {createdAt && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    បង្កើត៖ {createdAt}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex max-w-[48%] flex-wrap justify-end gap-1">
                                            {templateIds.length > 0 ? templateIds.map((templateId) => {
                                                const template = TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS];
                                                return (
                                                    <span
                                                        key={templateId}
                                                        title={template?.title || templateId}
                                                        className="flex flex-col items-center gap-0.5 rounded-xl border border-teal-600/25 bg-teal-600/10 px-2 py-1.5 text-center text-teal-800 dark:text-teal-300"
                                                    >
                                                        <span className="flex items-center gap-1 text-xs font-black">
                                                            <LayoutGrid size={11} />
                                                            {template?.code || templateId}
                                                        </span>
                                                        <span className="max-w-24 text-[9px] font-bold leading-tight">
                                                            {template?.title || "Template មិនស្គាល់"}
                                                        </span>
                                                    </span>
                                                );
                                            }) : (
                                                <span className="text-[10px] text-muted-foreground">មិនទាន់ជ្រើសរើស</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                            <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                                                <Users size={14} />
                                                <span>ភ្ញៀវ</span>
                                            </div>
                                            <span className="text-sm font-black text-foreground">{w._count?.guests || 0}</span>
                                        </div>
                                        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                            <div className="mb-1 text-muted-foreground">កូដ</div>
                                            <span className="font-mono text-xs font-bold text-foreground">#{w.weddingCode || '---'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-border pt-3">
                                        <p className="text-sm font-bold text-foreground">{w.user?.name || 'No User'}</p>
                                        <p className="mt-1 break-all text-xs font-mono text-muted-foreground">{w.user?.email || 'No Email'}</p>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
                                        {canEditPackages && (
                                            <button
                                                onClick={() => {
                                                    setUpgradeTarget({
                                                        weddingId: w.id,
                                                        coupleName: `${w.groomName} & ${w.brideName}`,
                                                        currentPackage: w.packageType || 'FREE',
                                                        userEmail: w.user?.email || ''
                                                    });
                                                    setSelectedPackage(w.packageType === 'PREMIUM' ? 'PREMIUM' : 'PRO');
                                                    setChangeReason("");
                                                    setPaymentDisposition("PAID");
                                                    setPaymentReference("");
                                                }}
                                                className="min-h-11 min-w-0 rounded-xl border border-teal-600/25 bg-teal-600/10 px-2 py-2.5 text-xs font-bold text-teal-800 dark:text-teal-300"
                                            >
                                                កែប្រែ
                                            </button>
                                        )}
                                        {canManageStatus && (
                                            <button
                                                onClick={() => {
                                                    setStatusTarget({
                                                        weddingId: w.id,
                                                        coupleName: `${w.groomName} & ${w.brideName}`,
                                                        status: w.status
                                                    });
                                                    setStatusReason("");
                                                }}
                                                className={cn(
                                                    "flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-bold",
                                                    w.status === "ACTIVE"
                                                        ? "border-border bg-muted/50 text-foreground"
                                                        : "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                )}
                                            >
                                                {w.status === "ACTIVE" ? <Archive size={14} /> : <RotateCcw size={14} />}
                                                {w.status === "ACTIVE" ? "ទុកប័ណ្ណសារ" : "ស្ដារ"}
                                            </button>
                                        )}

                                        <Link
                                            to={`/w/${encodeURIComponent(w.id)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="col-span-2 flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-xl border border-border bg-muted/30 px-2 py-2.5 text-xs font-bold text-foreground min-[400px]:col-span-1"
                                        >
                                            <span>មើល</span>
                                            <ArrowUpRight size={14} className="shrink-0" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {pagination && pagination.pages > 1 && (
                    <nav className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Pagination">
                        <Button
                            onClick={() => loadData(pagination.currentPage - 1)}
                            disabled={loading || pagination.currentPage <= 1}
                            variant="outline"
                            className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-xs font-bold text-foreground hover:bg-muted sm:h-9"
                            aria-label="ទំព័រមុន"
                        >
                            មុន
                        </Button>
                        {getPaginationItems(pagination.currentPage, pagination.pages).map((item, index) => item === "ellipsis" ? (
                            <span key={`ellipsis-${index}`} aria-hidden="true" className="flex h-9 items-center px-1 text-muted-foreground">…</span>
                        ) : (
                            <Button
                                key={item}
                                onClick={() => loadData(item)}
                                disabled={loading || pagination.currentPage === item}
                                variant={pagination.currentPage === item ? "default" : "outline"}
                                className={cn(
                                    "h-11 w-11 rounded-xl border border-border bg-muted/40 text-xs font-black text-foreground sm:h-9 sm:w-9",
                                    pagination.currentPage === item ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800" : "hover:bg-muted"
                                )}
                                aria-label={`ទំព័រ ${item}`}
                                aria-current={pagination.currentPage === item ? "page" : undefined}
                            >
                                {item}
                            </Button>
                        ))}
                        <Button
                            onClick={() => loadData(pagination.currentPage + 1)}
                            disabled={loading || pagination.currentPage >= pagination.pages}
                            variant="outline"
                            className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-xs font-bold text-foreground hover:bg-muted sm:h-9"
                            aria-label="ទំព័របន្ទាប់"
                        >
                            បន្ទាប់
                        </Button>
                    </nav>
                )}
            </div>

            {/* Manual Package Upgrade Modal */}
            <Dialog open={!!upgradeTarget} onOpenChange={(open) => !open && setUpgradeTarget(null)}>
                <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] rounded-3xl bg-card p-4 font-kantumruy sm:max-h-[90vh] sm:w-full sm:max-w-md sm:p-6">
                    <DialogHeader className="space-y-2 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs mb-1">
                            <Crown size={24} />
                        </div>
                        <DialogTitle className="text-lg font-black text-foreground">
                            ដំឡើងកញ្ចប់សេវាកម្មដោយដៃ
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium">
                            ជ្រើសរើសកញ្ចប់ដែលអ្នកចង់ដំឡើងជូនសាមីដើមការ៖ <strong className="text-foreground">{upgradeTarget?.coupleName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    {/* Plan Selection Cards */}
                    <div className="space-y-3 py-4" role="radiogroup" aria-label="ជ្រើសរើសកញ្ចប់សេវាកម្ម">
                        {[
                            {
                                id: 'FREE',
                                title: 'កញ្ចប់ឥតគិតថ្លៃ',
                                price: '$0.00',
                                desc: 'កញ្ចប់សាកល្បងធម្មតា មុខងារមូលដ្ឋាន',
                                icon: Sparkles,
                                color: 'border-border bg-muted/30 text-foreground'
                            },
                            {
                                id: 'PRO',
                                title: 'កញ្ចប់ស្តង់ដារ',
                                price: `$${Number(pricing.standard || 9).toFixed(2)}`,
                                desc: 'បើកគ្រប់មុខងារពិសេស គ្មានកំណត់ចំនួនភ្ញៀវ',
                                icon: Sparkles,
                                color: 'border-teal-600/25 bg-teal-600/10 text-teal-800 dark:text-teal-300'
                            },
                            {
                                id: 'PREMIUM',
                                title: 'កញ្ចប់ពិសេស VIP',
                                price: `$${Number(pricing.pro || 19).toFixed(2)}`,
                                desc: 'បើកគ្រប់មុខងារពិសេស គ្មានកំណត់ចំនួនភ្ញៀវ VIP',
                                icon: Crown,
                                color: 'border-amber-300 bg-amber-50/60 text-amber-900'
                            }
                        ].map(plan => {
                            const isSelected = selectedPackage === plan.id;
                            const Icon = plan.icon;

                            return (
                                <label
                                    key={plan.id}
                                    className={cn(
                                        "flex min-h-[68px] cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 p-3 shadow-xs transition-all focus-within:ring-2 focus-within:ring-teal-600/40 sm:p-3.5",
                                        isSelected
                                            ? 'border-teal-700 bg-teal-50 shadow-md ring-2 ring-teal-700/20 dark:bg-teal-950/30'
                                            : 'border-border hover:border-border bg-card'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="packageType"
                                        value={plan.id}
                                        checked={isSelected}
                                        onChange={() => setSelectedPackage(plan.id)}
                                        className="sr-only"
                                    />
                                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                            plan.color
                                        )}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-xs font-black text-foreground">
                                                {plan.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {plan.desc}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right pl-2">
                                        <span className="font-mono text-xs font-black text-foreground block">
                                            {plan.price}
                                        </span>
                                        {isSelected && (
                                            <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                                ជ្រើសរើស
                                            </span>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {selectedPackage !== "FREE" && (
                        <fieldset className="space-y-3 rounded-2xl border border-border p-3">
                            <legend className="px-1 text-xs font-bold text-foreground">
                                ស្ថានភាពការទូទាត់ <span className="text-destructive">*</span>
                            </legend>
                            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                                <label className="flex min-h-[72px] cursor-pointer items-start gap-2 rounded-xl border border-border p-3 text-xs text-foreground">
                                    <input
                                        type="radio"
                                        name="paymentDisposition"
                                        value="PAID"
                                        checked={paymentDisposition === "PAID"}
                                        onChange={() => setPaymentDisposition("PAID")}
                                        disabled={!!processingId}
                                    />
                                    <span>
                                        <span className="block font-bold">បានបង់ប្រាក់</span>
                                        <span className="mt-1 block text-xs text-muted-foreground">ត្រូវបញ្ចូលលេខប្រតិបត្តិការ</span>
                                    </span>
                                </label>
                                <label className="flex min-h-[72px] cursor-pointer items-start gap-2 rounded-xl border border-border p-3 text-xs text-foreground">
                                    <input
                                        type="radio"
                                        name="paymentDisposition"
                                        value="WAIVED"
                                        checked={paymentDisposition === "WAIVED"}
                                        onChange={() => setPaymentDisposition("WAIVED")}
                                        disabled={!!processingId}
                                    />
                                    <span>
                                        <span className="block font-bold">លើកលែង / ជូនឥតគិតថ្លៃ</span>
                                        <span className="mt-1 block text-xs text-muted-foreground">ត្រូវបញ្ជាក់មូលហេតុខាងក្រោម</span>
                                    </span>
                                </label>
                            </div>
                            {paymentDisposition === "PAID" && (
                                <div className="space-y-1.5">
                                    <label htmlFor="package-payment-reference" className="text-xs font-bold text-foreground">
                                        លេខប្រតិបត្តិការ / ឯកសារយោង <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        id="package-payment-reference"
                                        value={paymentReference}
                                        onChange={(event) => setPaymentReference(event.target.value)}
                                        placeholder="បញ្ចូលលេខប្រតិបត្តិការ"
                                        minLength={4}
                                        maxLength={120}
                                        required
                                        disabled={!!processingId}
                                        className="h-11 rounded-xl text-base sm:text-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">ត្រូវមានចន្លោះពី ៤ ដល់ ១២០ តួអក្សរ។</p>
                                </div>
                            )}
                        </fieldset>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="package-change-reason" className="text-xs font-bold text-foreground">
                            {paymentDisposition === "WAIVED" && selectedPackage !== "FREE"
                                ? "មូលហេតុនៃការលើកលែង / ជូនឥតគិតថ្លៃ"
                                : "មូលហេតុនៃការកែប្រែ"} <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            id="package-change-reason"
                            value={changeReason}
                            onChange={(event) => setChangeReason(event.target.value)}
                            placeholder={paymentDisposition === "WAIVED" && selectedPackage !== "FREE"
                                ? "សរសេរមូលហេតុច្បាស់លាស់សម្រាប់ការលើកលែង..."
                                : "សរសេរមូលហេតុយ៉ាងតិច ១០ តួអក្សរ..."}
                            minLength={10}
                            maxLength={500}
                            required
                            disabled={!!processingId}
                            className="min-h-[88px] resize-y rounded-xl text-xs"
                        />
                        <p className="text-right text-xs text-muted-foreground">
                            {changeReason.trim().length}/500 (យ៉ាងតិច ១០ តួអក្សរ)
                        </p>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setUpgradeTarget(null)}
                            disabled={!!processingId}
                            className="min-h-11 w-full rounded-xl font-bold text-xs sm:w-auto"
                        >
                            បោះបង់
                        </Button>
                        <Button
                            onClick={handleManualUpgrade}
                            disabled={
                                !!processingId
                                || changeReason.trim().length < 10
                                || changeReason.trim().length > 500
                                || (selectedPackage !== "FREE"
                                    && paymentDisposition === "PAID"
                                    && (paymentReference.trim().length < 4 || paymentReference.trim().length > 120))
                            }
                            className="min-h-11 w-full rounded-xl bg-teal-700 text-sm font-bold text-white shadow-sm hover:bg-teal-800 sm:w-auto"
                        >
                            {processingId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            <span>បញ្ជាក់ការដំឡើងទៅ {getPackageKhmerName(selectedPackage)}</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!statusTarget}
                onOpenChange={(open) => {
                    if (!open && !processingId) setStatusTarget(null);
                }}
            >
                <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] rounded-3xl bg-card p-4 font-kantumruy sm:max-h-[90vh] sm:w-full sm:max-w-md sm:p-6">
                    <DialogHeader className="space-y-2 text-left">
                        <DialogTitle className="text-lg font-black text-foreground">
                            {statusTarget?.status === "ACTIVE" ? "ដាក់កម្មវិធីក្នុងប័ណ្ណសារ?" : "ស្ដារកម្មវិធីនេះ?"}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground">
                            {statusTarget?.status === "ACTIVE"
                                ? "កម្មវិធីនឹងត្រូវបានសម្គាល់ថាបានបិទ។"
                                : "កម្មវិធីនឹងត្រូវបានដាក់ឲ្យសកម្មវិញ។"}{" "}
                            <strong className="text-foreground">{statusTarget?.coupleName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-3">
                        <label htmlFor="status-change-reason" className="text-xs font-bold text-foreground">
                            មូលហេតុ <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            id="status-change-reason"
                            value={statusReason}
                            onChange={(event) => setStatusReason(event.target.value)}
                            placeholder="សរសេរមូលហេតុយ៉ាងតិច ១០ តួអក្សរ..."
                            minLength={10}
                            maxLength={500}
                            required
                            disabled={!!processingId}
                            className="min-h-[88px] resize-y rounded-xl text-xs"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setStatusTarget(null)}
                            disabled={!!processingId}
                            className="min-h-11 w-full rounded-xl text-xs font-bold sm:w-auto"
                        >
                            បោះបង់
                        </Button>
                        <Button
                            onClick={handleStatusChange}
                            disabled={!!processingId || statusReason.trim().length < 10 || statusReason.trim().length > 500}
                            className={cn(
                                "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-foreground sm:w-auto",
                                statusTarget?.status === "ACTIVE" ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                        >
                            {processingId ? <Loader2 size={16} className="animate-spin" /> : null}
                            {statusTarget?.status === "ACTIVE" ? "បញ្ជាក់ការដាក់ប័ណ្ណសារ" : "បញ្ជាក់ការស្ដារ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
