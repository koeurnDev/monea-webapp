import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    DollarSign,
    FileCheck,
    History,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
    ShoppingBag,
    X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { moneaClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SalesFilter = "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED" | "PENDING_REVIEW" | "PENDING_PAYMENT";
type LicenseStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
type ReceiptStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

interface TemplateSale {
    id: string;
    weddingId: string;
    templateId: string;
    status: LicenseStatus;
    amount: number | string;
    currency: "USD" | "KHR";
    paymentOrderId: string | null;
    bakongTrxId: string | null;
    receiptUrl: string | null;
    receiptReference: string | null;
    receiptReviewStatus: ReceiptStatus;
    receiptSubmittedAt: string | null;
    purchaseDate: string;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    groomName: string;
    brideName: string;
    user?: { name?: string; email?: string } | null;
}

interface SalesResponse {
    licenses: TemplateSale[];
    summary: {
        totalSales: number;
        active: number;
        inactive: number;
        expired: number;
        pending: number;
        pendingPayment: number;
        revenueUSD: number;
        revenueKHR: number;
    };
    pagination: { page: number; pageSize: number; total: number; pages: number };
}

interface LicenseHistoryEntry {
    id: string;
    action: string;
    details: Record<string, unknown>;
    actorId: string;
    actorName: string;
    createdAt: string;
}

const FILTERS: { id: SalesFilter; labelKm: string; labelEn: string }[] = [
    { id: "ALL", labelKm: "ទាំងអស់", labelEn: "All sales" },
    { id: "ACTIVE", labelKm: "កំពុងប្រើ", labelEn: "Active" },
    { id: "PENDING_REVIEW", labelKm: "រង់ចាំពិនិត្យ", labelEn: "Pending review" },
    { id: "PENDING_PAYMENT", labelKm: "រង់ចាំបង់ប្រាក់", labelEn: "Awaiting payment" },
    { id: "INACTIVE", labelKm: "បានបិទ", labelEn: "Inactive" },
    { id: "EXPIRED", labelKm: "ផុតកំណត់", labelEn: "Expired" },
];

function formatDate(value: string | null, locale: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(locale === "km" ? "km-KH" : "en-US", {
        timeZone: "Asia/Phnom_Penh",
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatAmount(amount: number | string, currency: "USD" | "KHR") {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "—";
    return currency === "KHR"
        ? `${value.toLocaleString("en-US")} ៛`
        : `$${value.toFixed(2)}`;
}

export default function MasterPaymentsPage() {
    const { locale } = useTranslation();
    const { showToast } = useToast();
    const isKm = locale === "km";
    const [sales, setSales] = useState<TemplateSale[]>([]);
    const [summary, setSummary] = useState<SalesResponse["summary"]>({
        totalSales: 0,
        active: 0,
        inactive: 0,
        expired: 0,
        pending: 0,
        pendingPayment: 0,
        revenueUSD: 0,
        revenueKHR: 0,
    });
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState<SalesFilter>("PENDING_REVIEW");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<TemplateSale | null>(null);
    const [viewingHistory, setViewingHistory] = useState<TemplateSale | null>(null);
    const [history, setHistory] = useState<LicenseHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const loadSales = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const query = new URLSearchParams({
                page: String(page),
                status: filter,
                search,
            });
            const response = await moneaClient.get<SalesResponse>(
                `/api/admin/master/template-payments?${query.toString()}`,
                { cache: "no-store" },
            );
            if (response.error || !response.data) {
                throw new Error(response.error || "Could not load template sales");
            }
            setSales(response.data.licenses);
            setSummary(response.data.summary);
            setPages(Math.max(response.data.pagination.pages, 1));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not load template sales";
            setLoadError(message);
            showToast({
                title: isKm ? "មិនអាចទាញយកការលក់ Template" : "Could not load template sales",
                description: message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [filter, isKm, page, search, showToast]);

    useEffect(() => {
        void loadSales();
    }, [loadSales]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const loadHistory = async (sale: TemplateSale) => {
        setViewingHistory(sale);
        setHistory([]);
        setHistoryError(null);
        setHistoryLoading(true);
        try {
            const response = await moneaClient.get<{ history: LicenseHistoryEntry[] }>(
                `/api/admin/master/template-payments/${encodeURIComponent(sale.id)}/history`,
                { cache: "no-store" },
            );
            if (response.error || !response.data) {
                throw new Error(response.error || "Could not load license history");
            }
            setHistory(response.data.history || []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not load license history";
            setHistoryError(message);
            showToast({
                title: isKm ? "មិនអាចទាញយកប្រវត្តិ License" : "Could not load license history",
                description: message,
                type: "error",
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const updateSale = async (
        sale: TemplateSale,
        action: { decision: "APPROVED" | "REJECTED" } | { licenseAction: "ACTIVATE" | "DEACTIVATE" },
    ) => {
        setProcessing(sale.id);
        try {
            const response = await moneaClient.patch<{ success?: boolean }>(
                `/api/admin/master/template-payments/${encodeURIComponent(sale.id)}`,
                action,
            );
            if (response.error || !response.data?.success) {
                throw new Error(response.error || "Could not update template sale");
            }
            const isReceiptDecision = "decision" in action;
            const actionName = isReceiptDecision ? action.decision : action.licenseAction;
            showToast({
                title: isReceiptDecision
                    ? (actionName === "APPROVED" ? "បានអនុម័តការទិញ Template" : "បានបដិសេធបង្កាន់ដៃ Template")
                    : (actionName === "ACTIVATE" ? "បានបើក Template license" : "បានបិទ Template license"),
                description: sale.templateId,
                type: actionName === "REJECTED" || actionName === "DEACTIVATE" ? "info" : "success",
            });
            setViewingReceipt(null);
            await loadSales();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not update template sale";
            console.error("[Admin Template Sales] Update failed:", error);
            showToast({ title: "បរាជ័យ", description: message, type: "error" });
        } finally {
            setProcessing(null);
        }
    };

    const statusText = (sale: TemplateSale) => {
        if (sale.receiptReviewStatus === "PENDING") return isKm ? "រង់ចាំពិនិត្យបង្កាន់ដៃ" : "Receipt pending review";
        if (sale.status === "INACTIVE" && sale.paymentOrderId && !sale.bakongTrxId && !sale.receiptReviewStatus) {
            return isKm ? "រង់ចាំការបង់ប្រាក់" : "Awaiting payment";
        }
        if (sale.status === "ACTIVE") return isKm ? "សកម្ម" : "Active";
        if (sale.status === "EXPIRED") return isKm ? "ផុតកំណត់" : "Expired";
        if (sale.receiptReviewStatus === "REJECTED") return isKm ? "បង្កាន់ដៃត្រូវបានបដិសេធ" : "Receipt rejected";
        return isKm ? "បានបិទ" : "Inactive";
    };

    const statusClass = (sale: TemplateSale) => {
        if (sale.receiptReviewStatus === "PENDING"
            || (sale.status === "INACTIVE" && !!sale.paymentOrderId && !sale.bakongTrxId && !sale.receiptReviewStatus)) {
            return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
        }
        if (sale.status === "ACTIVE") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
        if (sale.status === "EXPIRED") return "bg-muted text-muted-foreground";
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
    };
    const filterCount = (id: SalesFilter) => {
        if (id === "ALL") return summary.totalSales;
        if (id === "ACTIVE") return summary.active;
        if (id === "INACTIVE") return summary.inactive;
        if (id === "EXPIRED") return summary.expired;
        if (id === "PENDING_REVIEW") return summary.pending;
        return summary.pendingPayment;
    };

    return (
        <div className="min-h-full w-full space-y-5 pb-16 font-kantumruy">
            <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 py-3 sm:h-20 sm:px-8 sm:py-0">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Link to="/admin/master">
                            <Button variant="ghost" size="icon" aria-label={isKm ? "ត្រឡប់ទៅទំព័រគ្រប់គ្រង" : "Back to admin"} className="h-10 w-10 shrink-0 rounded-xl border border-border bg-card shadow-xs">
                                <ArrowLeft size={17} />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                <ShieldCheck size={13} />
                                <span>Template Sales</span>
                            </div>
                            <h1 className="truncate text-base font-bold text-foreground sm:text-xl">
                                {isKm ? "គ្រប់គ្រងការលក់ Template" : "Manage template sales"}
                            </h1>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Link to="/admin/master/template-pricing">
                            <Button variant="outline" className="h-10 gap-2 rounded-xl px-3 text-xs font-bold sm:px-4">
                                <DollarSign size={15} />
                                <span>{isKm ? "កែតម្លៃ" : "Manage prices"}</span>
                            </Button>
                        </Link>
                        <Button onClick={() => void loadSales()} variant="outline" disabled={loading} aria-label={isKm ? "ផ្ទុកឡើងវិញ" : "Refresh"} className="h-10 w-10 rounded-xl p-0 sm:w-auto sm:px-4">
                            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline sm:ml-2">{isKm ? "ផ្ទុកឡើងវិញ" : "Refresh"}</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] space-y-5 px-3 sm:space-y-6 sm:px-8">
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: isKm ? "ការទិញសរុប" : "Total sales", value: summary.totalSales.toLocaleString(), icon: ShoppingBag, color: "text-teal-700 dark:text-teal-300" },
                        { label: isKm ? "License សកម្ម" : "Active licenses", value: summary.active.toLocaleString(), icon: FileCheck, color: "text-emerald-600" },
                        { label: isKm ? "រង់ចាំបង់/ពិនិត្យ" : "Awaiting payment/review", value: (summary.pending + summary.pendingPayment).toLocaleString(), icon: Clock, color: "text-amber-600" },
                        { label: isKm ? "ចំណូលសរុបពី Template" : "Template sales revenue", value: `$${Number(summary.revenueUSD).toFixed(2)} · ${Number(summary.revenueKHR).toLocaleString("en-US")} ៛`, icon: DollarSign, color: "text-violet-600" },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="border-border/80">
                                <CardContent className="flex items-center justify-between gap-2 p-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                                        <p className="mt-1 truncate text-lg font-black text-foreground">{item.value}</p>
                                    </div>
                                    <Icon size={20} className={cn("shrink-0", item.color)} />
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-black text-foreground">{isKm ? "បញ្ជីការលក់ និង License" : "Sales and licenses"}</h2>
                            <p className="text-xs text-muted-foreground">
                                {isKm
                                    ? "ពិនិត្យការទិញ Template, បង្កាន់ដៃ និងបើក/បិទសិទ្ធិប្រើប្រាស់។"
                                    : "Review template purchases, receipts, and license access."}
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                            {isKm ? "សរុប" : "Total"}: {summary.totalSales.toLocaleString()}
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder={isKm
                                ? "ស្វែងរកឈ្មោះ, Email, Template ឬ Order ID..."
                                : "Search customer, email, template, or order ID..."}
                            aria-label={isKm ? "ស្វែងរកការលក់ Template" : "Search template sales"}
                            className={cn("h-11 rounded-xl pl-10", searchInput && "pr-11")}
                        />
                        {searchInput && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={isKm ? "សម្អាតការស្វែងរក" : "Clear search"}
                                onClick={() => setSearchInput("")}
                                className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground"
                            >
                                <X size={16} />
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-muted/40 p-2 sm:grid-cols-3 lg:grid-cols-6">
                        {FILTERS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => { setPage(1); setFilter(item.id); }}
                                aria-pressed={filter === item.id}
                                className={cn(
                                    "flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-bold transition",
                                    filter === item.id ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                                )}
                            >
                                <span>{isKm ? item.labelKm : item.labelEn}</span>
                                <span className={cn(
                                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                                    item.id === "PENDING_REVIEW" && summary.pending > 0
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                        : "bg-muted text-muted-foreground",
                                )}>{filterCount(item.id)}</span>
                            </button>
                        ))}
                    </div>

                    {loadError ? (
                        <Card><CardContent className="space-y-3 p-6 text-center">
                            <p role="alert" className="text-sm font-semibold text-destructive">{loadError}</p>
                            <Button variant="outline" onClick={() => void loadSales()}>{isKm ? "ព្យាយាមម្តងទៀត" : "Try again"}</Button>
                        </CardContent></Card>
                    ) : loading ? (
                        <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-7 w-7 animate-spin" /></div>
                    ) : sales.length === 0 ? (
                        <Card><CardContent className="space-y-2 p-10 text-center">
                            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-bold text-foreground">
                                {search
                                    ? (isKm ? "រកមិនឃើញការលក់ដែលត្រូវនឹងពាក្យស្វែងរកទេ" : "No sales match your search")
                                    : (isKm ? "មិនទាន់មានការលក់ក្នុងប្រភេទនេះទេ" : "No sales in this category yet")}
                            </p>
                        </CardContent></Card>
                    ) : (
                        <div className="grid gap-3 xl:grid-cols-2">
                            {[...sales]
                                .sort((a, b) => Number(b.receiptReviewStatus === "PENDING") - Number(a.receiptReviewStatus === "PENDING"))
                                .map((sale) => (
                                <Card key={sale.id} className={cn(
                                    "overflow-hidden border-border/80",
                                    sale.receiptReviewStatus === "PENDING" && "border-amber-400/70 bg-amber-500/[0.025] shadow-sm",
                                )}>
                                    <CardContent className="space-y-4 p-4 sm:p-5">
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            {sale.receiptUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingReceipt(sale)}
                                                    className="group relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-28"
                                                    aria-label={isKm ? "មើលបង្កាន់ដៃ" : "View receipt"}
                                                >
                                                    <img src={sale.receiptUrl} alt={`Payment receipt for ${sale.templateId}`} className="h-full w-full object-cover" loading="lazy" />
                                                    <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                        {isKm ? "មើលបង្កាន់ដៃ" : "View receipt"}
                                                    </span>
                                                </button>
                                            )}
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={cn("rounded-md px-2 py-1 text-[10px] font-black", statusClass(sale))}>{statusText(sale)}</span>
                                                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">{sale.templateId}</span>
                                                </div>
                                                <p className="text-sm font-bold text-foreground">{sale.groomName} & {sale.brideName}</p>
                                                <p className="break-all text-xs text-muted-foreground">{sale.user?.name || "User"} · {sale.user?.email || "—"}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="font-black text-foreground">{formatAmount(sale.amount, sale.currency)}</span>
                                                    <span>{isKm ? "ទិញ" : "Purchased"}: {formatDate(sale.purchaseDate || sale.createdAt, locale)}</span>
                                                </div>
                                                {sale.receiptReference && <p className="break-words text-[11px] text-muted-foreground">{isKm ? "ចំណាំ:" : "Note:"} {sale.receiptReference}</p>}
                                                {sale.paymentOrderId && <p className="break-all font-mono text-[10px] text-muted-foreground">Order: {sale.paymentOrderId}</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap gap-2">
                                            {sale.receiptReviewStatus === "PENDING" ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setViewingReceipt(sale)}
                                                    className="border-amber-500/40 font-bold text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
                                                >
                                                    <FileCheck size={14} /> {isKm ? "ពិនិត្យបង្កាន់ដៃ" : "Review receipt"}
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => void loadHistory(sale)}>
                                                    <History size={14} /> {isKm ? "ប្រវត្តិ" : "History"}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {sale.receiptReviewStatus === "PENDING" && !sale.receiptUrl && (
                                                <span className="self-center text-right text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                    {isKm ? "មិនមានរូបបង្កាន់ដៃសម្រាប់ពិនិត្យទេ" : "No receipt image is available"}
                                                </span>
                                            )}
                                            {sale.receiptReviewStatus !== "PENDING" && sale.status === "ACTIVE" && (
                                                <Button size="sm" variant="outline" disabled={processing === sale.id} onClick={() => void updateSale(sale, { licenseAction: "DEACTIVATE" })}>
                                                    {processing === sale.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X size={14} />}
                                                    {isKm ? "បិទ License" : "Deactivate"}
                                                </Button>
                                            )}
                                            {sale.receiptReviewStatus !== "PENDING" && sale.status === "INACTIVE" && (
                                                sale.receiptReviewStatus === "APPROVED" || !!sale.bakongTrxId ? (
                                                    <Button size="sm" disabled={processing === sale.id} onClick={() => void updateSale(sale, { licenseAction: "ACTIVATE" })} className="bg-emerald-600 text-white hover:bg-emerald-700">
                                                        {processing === sale.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={14} />}
                                                        {isKm ? "បើក License" : "Activate"}
                                                    </Button>
                                                ) : null
                                            )}
                                        </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {!loadError && pages > 1 && (
                        <nav aria-label={isKm ? "ទំព័រការលក់ Template" : "Template sales pages"} className="flex items-center justify-center gap-3 pt-2">
                            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
                                <ChevronLeft size={15} /> {isKm ? "មុន" : "Previous"}
                            </Button>
                            <span className="text-xs font-bold text-muted-foreground">{page} / {pages}</span>
                            <Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>
                                {isKm ? "បន្ទាប់" : "Next"} <ChevronRight size={15} />
                            </Button>
                        </nav>
                    )}
                </section>
            </main>

            <Dialog
                open={!!viewingHistory}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingHistory(null);
                        setHistoryError(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{isKm ? "ប្រវត្តិការផ្លាស់ប្តូរ License" : "License change history"}</DialogTitle>
                        <DialogDescription>
                            {viewingHistory?.templateId} · {viewingHistory?.groomName} & {viewingHistory?.brideName}
                        </DialogDescription>
                    </DialogHeader>
                    {historyLoading ? (
                        <div className="flex justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : historyError ? (
                        <p role="alert" className="py-6 text-center text-sm text-destructive">{historyError}</p>
                    ) : history.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {isKm ? "មិនទាន់មានប្រវត្តិសកម្មភាពទេ។" : "No recorded license changes yet."}
                        </p>
                    ) : (
                        <ol className="space-y-3">
                            {history.map((entry) => {
                                const details = entry.details || {};
                                const event = String(details.action || details.decision || "UPDATE");
                                const eventLabel: Record<string, { km: string; en: string }> = {
                                    APPROVED: { km: "អនុម័តបង្កាន់ដៃ", en: "Receipt approved" },
                                    REJECTED: { km: "បដិសេធបង្កាន់ដៃ", en: "Receipt rejected" },
                                    ACTIVATE: { km: "បើក License", en: "License activated" },
                                    DEACTIVATE: { km: "បិទ License", en: "License deactivated" },
                                };
                                return (
                                    <li key={entry.id} className="rounded-xl border border-border/80 bg-muted/20 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <p className="text-sm font-bold text-foreground">
                                                {eventLabel[event]?.[isKm ? "km" : "en"] || event}
                                            </p>
                                            <time className="text-xs text-muted-foreground">
                                                {formatDate(entry.createdAt, locale)}
                                            </time>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {isKm ? "ដោយ" : "By"}: {entry.actorName || entry.actorId}
                                        </p>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
                <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isKm ? "ពិនិត្យបង្កាន់ដៃទិញ Template" : "Review template purchase receipt"}</DialogTitle>
                        <DialogDescription>
                            {viewingReceipt?.templateId} · {viewingReceipt?.user?.name || viewingReceipt?.user?.email || "—"}
                        </DialogDescription>
                    </DialogHeader>
                    {viewingReceipt?.receiptUrl && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">{isKm ? "គូស្វាមីភរិយា" : "Couple"}</p>
                                    <p className="mt-1 truncate font-bold text-foreground">{viewingReceipt.groomName} & {viewingReceipt.brideName}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">{isKm ? "ចំនួនទឹកប្រាក់" : "Amount"}</p>
                                    <p className="mt-1 font-bold text-foreground">{formatAmount(viewingReceipt.amount, viewingReceipt.currency)}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">{isKm ? "ថ្ងៃផ្ញើ" : "Submitted"}</p>
                                    <p className="mt-1 font-bold text-foreground">{formatDate(viewingReceipt.receiptSubmittedAt, locale)}</p>
                                </div>
                                {viewingReceipt.receiptReference && (
                                    <div className="min-w-0">
                                        <p className="text-muted-foreground">{isKm ? "កំណត់ចំណាំពីអ្នកប្រើ" : "User note"}</p>
                                        <p className="mt-1 whitespace-pre-wrap break-words font-bold text-foreground">{viewingReceipt.receiptReference}</p>
                                    </div>
                                )}
                                <div className="col-span-2 min-w-0 sm:col-span-2">
                                    <p className="text-muted-foreground">{isKm ? "អ៊ីមែល" : "Email"}</p>
                                    <p className="mt-1 break-all font-bold text-foreground">{viewingReceipt.user?.email || "—"}</p>
                                </div>
                            </div>
                            <div className="flex max-h-[58dvh] min-h-48 items-center justify-center overflow-auto rounded-xl bg-slate-950 p-2">
                                <img src={viewingReceipt.receiptUrl} alt={`Payment receipt for ${viewingReceipt.templateId}`} className="max-h-[58dvh] w-full object-contain" />
                            </div>
                            {viewingReceipt.receiptReviewStatus === "PENDING" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="destructive" disabled={processing === viewingReceipt.id} onClick={() => void updateSale(viewingReceipt, { decision: "REJECTED" })} className="h-11">
                                        <X size={15} /> {isKm ? "បដិសេធ" : "Reject"}
                                    </Button>
                                    <Button disabled={processing === viewingReceipt.id} onClick={() => void updateSale(viewingReceipt, { decision: "APPROVED" })} className="h-11 bg-emerald-600 text-white hover:bg-emerald-700">
                                        <Check size={15} /> {isKm ? "អនុម័ត" : "Approve"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
