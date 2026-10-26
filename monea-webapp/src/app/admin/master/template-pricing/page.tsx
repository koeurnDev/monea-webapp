import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, DollarSign, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import { moneaClient } from "@/lib/api-client";
import { TEMPLATE_DEFINITIONS } from "@/components/templates/template-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TemplatePricing {
    [templateId: string]: {
        name: string;
        price: number;
        currency: string;
        description: string;
        eventTypes: ("wedding" | "anniversary")[];
        isFree: boolean;
        originalPrice?: number; // តម្លៃដើម (មុនបញ្ចុះ)
        onSale?: boolean; // មានការបញ្ចុះតម្លៃឬទេ
    };
}

interface TemplatePricingInput {
    price: string;
    originalPrice: string;
}

interface TemplatePricingEntryResponse {
    name?: string;
    price?: number | string;
    amount?: number | string;
    currency?: string;
    isFree?: boolean;
    description?: string;
    eventTypes?: unknown;
    originalPrice?: number | string;
    originalAmount?: number | string;
    onSale?: boolean;
}

function normalizePricingResponse(raw: unknown): TemplatePricing | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

    const wrapper = raw as { data?: unknown; pricing?: unknown };
    const payload = wrapper.data ?? wrapper.pricing ?? raw;
    const source = payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as { templatePricing?: unknown }).templatePricing ?? payload
        : payload;
    if (!source || typeof source !== "object" || Array.isArray(source)) return null;

    const normalized: TemplatePricing = {};
    for (const [templateId, rawEntry] of Object.entries(source)) {
        if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) continue;
        const entry = rawEntry as TemplatePricingEntryResponse;
        const price = Number(entry.price ?? entry.amount);
        if (!Number.isFinite(price) || price < 0 || price > 99.99) continue;

        const rawOriginalPrice = entry.originalPrice ?? entry.originalAmount;
        const parsedOriginalPrice = rawOriginalPrice === undefined ? undefined : Number(rawOriginalPrice);
        const originalPrice = parsedOriginalPrice !== undefined
            && Number.isFinite(parsedOriginalPrice)
            && parsedOriginalPrice >= 0
            && parsedOriginalPrice <= 99.99
            ? parsedOriginalPrice
            : undefined;

        normalized[templateId] = {
            name: typeof entry.name === "string" && entry.name.trim()
                ? entry.name
                : TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS]?.title || templateId,
            price,
            currency: "USD",
            description: typeof entry.description === "string"
                ? entry.description
                : TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS]?.description || "",
            eventTypes: Array.isArray(entry.eventTypes)
                ? entry.eventTypes.filter((eventType): eventType is "wedding" | "anniversary" =>
                    eventType === "wedding" || eventType === "anniversary")
                : (() => {
                    const eventType = TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS]?.eventType;
                    return eventType === "wedding" || eventType === "anniversary"
                        ? [eventType]
                        : ["wedding", "anniversary"];
                })(),
            isFree: typeof entry.isFree === "boolean" ? entry.isFree : price === 0,
            ...(typeof entry.description === "string" ? { description: entry.description } : {}),
            ...(originalPrice !== undefined ? { originalPrice } : {}),
            onSale: typeof entry.onSale === "boolean"
                ? entry.onSale
                : originalPrice !== undefined && originalPrice > price,
        };
    }

    const hasAllTemplates = Object.values(TEMPLATE_DEFINITIONS)
        .every((template) => normalized[template.id] !== undefined);
    return hasAllTemplates ? normalized : null;
}

export default function TemplatePricingPage() {
    const [pricing, setPricing] = useState<TemplatePricing | null>(null);
    const [draft, setDraft] = useState<TemplatePricing | null>(null);
    const [priceInputs, setPriceInputs] = useState<Record<string, TemplatePricingInput>>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
    const { showToast } = useToast();

    const loadPricing = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        const response = await moneaClient.get<unknown>("/api/template-pricing", { cache: "no-store" });
        if (response.error || !response.data) {
            setLoadError(response.error || "Failed to load template pricing");
        } else {
            const pricingData = normalizePricingResponse(response.data);
            if (!pricingData) {
                setLoadError("Template pricing response is missing valid prices. No prices were changed.");
            } else {
                setPricing(pricingData);
                setDraft(JSON.parse(JSON.stringify(pricingData)));
                setPriceInputs(Object.fromEntries(
                    Object.entries(pricingData).map(([templateId, entry]) => [
                        templateId,
                        {
                            price: entry.price.toFixed(2),
                            originalPrice: entry.originalPrice?.toFixed(2) || "",
                        },
                    ]),
                ));
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadPricing();
    }, [loadPricing]);

    const handlePriceChange = (templateId: string, value: string) => {
        if (!draft) return;
        const price = parseFloat(value) || 0;
        setDraft({
            ...draft,
            [templateId]: {
                ...draft[templateId],
                price: Math.max(0, Math.min(99.99, price)),
                isFree: price === 0,
            },
        });
    };

    const handleOriginalPriceChange = (templateId: string, value: string) => {
        if (!draft) return;
        const originalPrice = parseFloat(value) || 0;
        setDraft({
            ...draft,
            [templateId]: {
                ...draft[templateId],
                originalPrice: Math.max(0, Math.min(99.99, originalPrice)),
                onSale: originalPrice > 0 && originalPrice > draft[templateId].price,
            },
        });
    };

    const handlePriceInputChange = (templateId: string, field: keyof TemplatePricingInput, value: string) => {
        if (!/^\d{0,2}(?:\.\d{0,2})?$/.test(value)) return;
        setPriceInputs((current) => ({
            ...current,
            [templateId]: {
                price: current[templateId]?.price ?? "",
                originalPrice: current[templateId]?.originalPrice ?? "",
                [field]: value,
            },
        }));

        if (value === "" || value.endsWith(".")) {
            return;
        }
        if (field === "price") {
            handlePriceChange(templateId, value);
        } else {
            handleOriginalPriceChange(templateId, value);
        }
    };

    const handlePriceInputBlur = (templateId: string, field: keyof TemplatePricingInput) => {
        const value = priceInputs[templateId]?.[field] ?? "";
        const amount = Number(value);
        if (value === "" || !Number.isFinite(amount) || amount < 0 || amount > 99.99) return;
        setPriceInputs((current) => ({
            ...current,
            [templateId]: { ...current[templateId], [field]: amount.toFixed(2) },
        }));
    };

    const handleToggleSale = (templateId: string) => {
        if (!draft) return;
        const current = draft[templateId];
        const newOnSale = !current.onSale;
        setDraft({
            ...draft,
            [templateId]: {
                ...current,
                onSale: newOnSale,
                originalPrice: newOnSale ? (current.originalPrice || current.price * 1.5) : undefined,
            },
        });
        setPriceInputs((inputs) => ({
            ...inputs,
            [templateId]: {
                price: inputs[templateId]?.price ?? current.price.toFixed(2),
                originalPrice: newOnSale
                    ? (current.originalPrice || current.price * 1.5).toFixed(2)
                    : "",
            },
        }));
    };

    const handleToggleFree = (templateId: string) => {
        if (!draft) return;
        const current = draft[templateId];
        setDraft({
            ...draft,
            [templateId]: {
                ...current,
                isFree: !current.isFree,
                price: !current.isFree ? 0 : current.price,
            },
        });
        setPriceInputs((inputs) => ({
            ...inputs,
            [templateId]: {
                price: (!current.isFree ? 0 : current.price).toFixed(2),
                originalPrice: inputs[templateId]?.originalPrice ?? "",
            },
        }));
    };

    const hasTemplateChanges = (templateId: string) => {
        const current = draft?.[templateId];
        const saved = pricing?.[templateId];
        if (!current || !saved) return false;
        const priceInput = priceInputs[templateId]?.price ?? current.price.toFixed(2);
        const originalPriceInput = priceInputs[templateId]?.originalPrice ?? current.originalPrice?.toFixed(2) ?? "";
        const price = Number(priceInput);
        const originalPrice = Number(originalPriceInput);
        return current.isFree !== saved.isFree
            || Boolean(current.onSale) !== Boolean(saved.onSale)
            || priceInput.trim() === ""
            || !Number.isFinite(price)
            || price !== saved.price
            || (Boolean(current.onSale)
                && (originalPriceInput.trim() === ""
                    || !Number.isFinite(originalPrice)
                    || originalPrice !== (saved.originalPrice ?? 0)));
    };

    const handleSaveTemplate = async (templateId: string) => {
        if (!draft || !pricing || savingTemplateId) return;
        const entry = draft[templateId];
        if (!entry) return;

        const priceInput = priceInputs[templateId]?.price ?? entry.price.toFixed(2);
        const price = Number(priceInput);
        const originalPriceInput = priceInputs[templateId]?.originalPrice ?? entry.originalPrice?.toFixed(2) ?? "";
        const originalPrice = Number(originalPriceInput);
        if (!entry.isFree && (
            priceInput.trim() === ""
            || !Number.isFinite(price)
            || price <= 0
            || price > 99.99
            || (entry.onSale && (
                originalPriceInput.trim() === ""
                || !Number.isFinite(originalPrice)
                || originalPrice < 0
                || originalPrice > 99.99
            ))
        )) {
            showToast({
                title: "តម្លៃមិនត្រឹមត្រូវ",
                description: "សូមបញ្ចូលតម្លៃធំជាង $0.00 និងមិនលើស $99.99 ហើយបំពេញតម្លៃដើម ប្រសិនបើមានការបញ្ចុះតម្លៃ។",
                type: "error",
            });
            return;
        }

        setSavingTemplateId(templateId);
        const pricingToSave = {
            ...pricing,
            [templateId]: {
                ...entry,
                price: entry.isFree ? 0 : price,
                onSale: Boolean(entry.onSale),
                originalPrice: entry.onSale ? originalPrice : undefined,
            },
        };
        const response = await moneaClient.post<unknown>("/api/template-pricing", {
            pricing: pricingToSave,
        });

        if (response.error || !response.data) {
            showToast({
                title: "បរាជ័យក្នុងការរក្សាទុក",
                description: response.error || "Failed to update template pricing",
                type: "error",
            });
        } else {
            const updatedPricing = normalizePricingResponse(response.data);
            if (!updatedPricing) {
                showToast({
                    title: "បរាជ័យក្នុងការរក្សាទុក",
                    description: "The server returned incomplete template pricing. Please reload and check the saved values.",
                    type: "error",
                });
            } else {
                setPricing(updatedPricing);
                setDraft((current) => current ? { ...current, [templateId]: updatedPricing[templateId] } : current);
                setPriceInputs((current) => ({
                    ...current,
                    [templateId]: {
                        price: updatedPricing[templateId].price.toFixed(2),
                        originalPrice: updatedPricing[templateId].originalPrice?.toFixed(2) || "",
                    },
                }));
                showToast({
                    title: "បានរក្សាទុក",
                    description: `បានរក្សាទុកតម្លៃ ${templateId} ដោយជោគជ័យ`,
                    type: "success",
                });
            }
        }
        setSavingTemplateId(null);
    };

    const templates = Object.values(TEMPLATE_DEFINITIONS);
    const totalRevenue = draft
        ? Object.entries(draft)
            .filter(([, price]) => !price.isFree)
            .reduce((sum, [, price]) => sum + (Number.isFinite(price.price) ? price.price : 0), 0)
        : 0;

    return (
        <div className="mx-auto max-w-4xl space-y-5 p-3 sm:space-y-6 sm:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div className="shrink-0 rounded-2xl bg-green-500/10 p-2.5 text-green-600 dark:text-green-300 sm:p-3">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-black text-foreground sm:text-2xl">គ្រប់គ្រងតម្លៃ Template</h1>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        កំណត់តម្លៃសម្រាប់ផ្នែក template នីមួយៗ។ រចនា "ឥតគិតថ្លៃ" template នឹងលេចឡើងដោយផ្ទាល់ទាំងអស់។
                    </p>
                </div>
                <Link to="/admin/master/templates">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft size={16} />
                        ត្រឡប់ទៅគ្រប់គ្រង Template
                    </Button>
                </Link>
            </header>

            {/* Summary Card */}
            {draft && (
                <Card className="border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10">
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">ចំនួន Template</p>
                                <p className="mt-1 text-xl font-bold text-foreground">{templates.length}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Template ឥតគិតថ្លៃ</p>
                                <p className="mt-1 text-xl font-bold text-foreground">
                                    {Object.values(draft).filter((p) => p.isFree).length}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">ចំនួនរបស់ទាំងអស់</p>
                                <p className="mt-1 text-xl font-bold text-green-600">
                                    ${totalRevenue.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div role="status" className="flex justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : loadError ? (
                <Card>
                    <CardContent className="space-y-3 p-6 text-center">
                        <p role="alert" className="text-sm font-semibold text-destructive">{loadError}</p>
                        <button
                            type="button"
                            className="text-sm font-bold underline"
                            onClick={() => void loadPricing()}
                        >
                            ព្យាយាមម្តងទៀត
                        </button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-3">
                        {templates.map((template) => {
                            const templateDraft: TemplatePricing[string] = draft?.[template.id] || {
                                name: template.title,
                                price: 0,
                                currency: "USD",
                                description: template.description,
                                eventTypes: template.eventType === "wedding" || template.eventType === "anniversary"
                                    ? [template.eventType]
                                    : ["wedding", "anniversary"],
                                isFree: true,
                            };
                            const rowIsDirty = hasTemplateChanges(template.id);
                            const rowIsSaving = savingTemplateId === template.id;
                            return (
                                <Card key={template.id}>
                                    <CardContent className="p-3 sm:p-5">
                                        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                            <div className="flex gap-3 sm:gap-4">
                                                <div className="relative">
                                                    {template.image ? (
                                                        <img
                                                            src={template.image}
                                                            alt={template.title}
                                                            className="h-16 w-12 shrink-0 rounded-lg border object-cover sm:h-20 sm:w-14"
                                                        />
                                                    ) : (
                                                        <div aria-label="មិនទាន់បញ្ចូលរូប Cover" className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted px-1 text-center text-[9px] text-muted-foreground sm:h-20 sm:w-14">
                                                            មិនទាន់មានរូប
                                                        </div>
                                                    )}
                                                    {templateDraft.onSale && (
                                                        <div className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                            SALE
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold leading-snug text-foreground">{template.title}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        <span className="font-medium">{template.id}</span>
                                                    </p>
                                                    {templateDraft.onSale && templateDraft.originalPrice && (
                                                        <p className="mt-1 text-xs font-semibold text-red-500">
                                                            បញ្ចុះតម្លៃ {Math.round((1 - templateDraft.price / templateDraft.originalPrice) * 100)}%
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 border-t pt-3 sm:border-0 sm:pt-0 sm:min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={templateDraft.isFree}
                                                            onChange={() => handleToggleFree(template.id)}
                                                            disabled={savingTemplateId === template.id}
                                                            className="h-4 w-4 rounded"
                                                        />
                                                        <span className="text-sm font-semibold">ឥតគិតថ្លៃ</span>
                                                    </label>
                                                </div>
                                                {!templateDraft.isFree && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={templateDraft.onSale || false}
                                                                    onChange={() => handleToggleSale(template.id)}
                                                                    disabled={savingTemplateId === template.id}
                                                                    className="h-4 w-4 rounded"
                                                                />
                                                                <span className="text-sm font-semibold text-red-500">បញ្ចុះតម្លៃ</span>
                                                            </label>
                                                        </div>
                                                        {templateDraft.onSale && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-muted-foreground">តម្លៃដើម</span>
                                                                <span className="text-sm font-medium">$</span>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    min="0"
                                                                    max="99.99"
                                                                    value={priceInputs[template.id]?.originalPrice ?? (templateDraft.originalPrice || 0).toFixed(2)}
                                                                    onChange={(e) => handlePriceInputChange(template.id, "originalPrice", e.target.value)}
                                                                    onBlur={() => handlePriceInputBlur(template.id, "originalPrice")}
                                                                    disabled={savingTemplateId === template.id}
                                                                    className="w-20 text-xs"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {templateDraft.onSale ? "តម្លៃបញ្ចុះ" : "តម្លៃ"}
                                                            </span>
                                                            <span className="text-sm font-medium">$</span>
                                                            <Input
                                                                type="text"
                                                                inputMode="decimal"
                                                                min="0"
                                                                max="99.99"
                                                                value={priceInputs[template.id]?.price ?? (Number.isFinite(templateDraft.price) ? templateDraft.price.toFixed(2) : "0.00")}
                                                                onChange={(e) => handlePriceInputChange(template.id, "price", e.target.value)}
                                                                onBlur={() => handlePriceInputBlur(template.id, "price")}
                                                                disabled={savingTemplateId === template.id}
                                                                className="w-20 text-xs"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={savingTemplateId !== null || !rowIsDirty}
                                                    onClick={() => void handleSaveTemplate(template.id)}
                                                    className="mt-1 w-full gap-2"
                                                >
                                                    {rowIsSaving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                    រក្សាទុកតម្លៃនេះ
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                </>
            )}
        </div>
    );
}
