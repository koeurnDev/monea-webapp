import { useCallback, useEffect, useState } from "react";
import { DollarSign, Eye, LayoutGrid, Loader2, Pencil, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/Toast";
import { moneaClient } from "@/lib/api-client";
import {
    normalizeTemplatePresentationMetadata,
    TEMPLATE_DEFINITIONS,
} from "@/components/templates/template-config";
import type { TemplatePresentationMetadata } from "@/components/templates/template-config";
import ImageUploadWidget from "@/components/ui/image-upload-widget";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Availability = Record<string, boolean>;
type TemplateMetadata = Record<string, TemplatePresentationMetadata>;

export default function TemplateAvailabilityPage() {
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [metadata, setMetadata] = useState<TemplateMetadata | null>(null);
    const [draft, setDraft] = useState<TemplatePresentationMetadata | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savingMetadata, setSavingMetadata] = useState(false);
    const { showToast } = useToast();

    const loadConfiguration = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        const [availabilityResponse, metadataResponse] = await Promise.all([
            moneaClient.get<Availability>("/api/admin/master/templates", { cache: "no-store" }),
            moneaClient.get<TemplateMetadata>("/api/admin/master/templates/metadata", { cache: "no-store" }),
        ]);
        if (availabilityResponse.error || !availabilityResponse.data) {
            setLoadError(availabilityResponse.error || "Failed to load template availability");
        } else if (metadataResponse.error || !metadataResponse.data) {
            setLoadError(metadataResponse.error || "Failed to load template metadata");
        } else {
            setAvailability(availabilityResponse.data);
            setMetadata(normalizeTemplatePresentationMetadata(metadataResponse.data));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadConfiguration();
    }, [loadConfiguration]);

    const updateAvailability = async (templateId: string, enabled: boolean) => {
        if (savingId) return;
        setSavingId(templateId);
        const response = await moneaClient.patch<Availability>("/api/admin/master/templates", {
            templateId,
            enabled,
        });
        if (response.error || !response.data) {
            showToast({
                title: "បរាជ័យក្នុងការរក្សាទុក",
                description: response.error || "Failed to update template availability",
                type: "error",
            });
        } else {
            setAvailability(response.data);
            showToast({
                title: enabled ? "បានបើក template" : "បានបិទ template",
                type: "success",
            });
        }
        setSavingId(null);
    };

    const startEditing = (templateId: string) => {
        if (!metadata) return;
        setEditingId(templateId);
        setDraft({ ...metadata[templateId] });
    };

    const saveMetadata = async () => {
        if (!editingId || !draft || savingMetadata) return;
        setSavingMetadata(true);
        const response = await moneaClient.patch<TemplateMetadata>("/api/admin/master/templates/metadata", {
            templateId: editingId,
            ...draft,
        });
        if (response.error || !response.data) {
            showToast({
                title: "បរាជ័យក្នុងការរក្សាទុក",
                description: response.error || "Failed to update template details",
                type: "error",
            });
        } else {
            setMetadata(normalizeTemplatePresentationMetadata(response.data));
            setEditingId(null);
            setDraft(null);
            showToast({ title: "បានរក្សាទុកព័ត៌មាន Template", type: "success" });
        }
        setSavingMetadata(false);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setDraft(null);
    };

    return (
        <div className="mx-auto max-w-5xl space-y-5 p-3 sm:space-y-6 sm:p-6">
            <header className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 rounded-2xl bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-300 sm:p-3">
                    <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl font-black text-foreground sm:text-2xl">គ្រប់គ្រង Template</h1>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        គ្រប់គ្រងព័ត៌មាន រូបភាព សិទ្ធិប្រើប្រាស់ និងតម្លៃរបស់ Template នៅទីនេះ។
                    </p>
                </div>
                <Button asChild variant="outline" className="ml-auto shrink-0 gap-2">
                    <Link to="/admin/master/template-pricing">
                        <DollarSign className="h-4 w-4" />
                        តម្លៃ និងបញ្ចុះតម្លៃ
                    </Link>
                </Button>
            </header>

            {loading ? (
                <div role="status" className="flex justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : loadError ? (
                <Card>
                    <CardContent className="space-y-3 p-6 text-center">
                        <p role="alert" className="text-sm font-semibold text-destructive">{loadError}</p>
                        <button type="button" className="text-sm font-bold underline" onClick={() => void loadConfiguration()}>
                            ព្យាយាមម្តងទៀត
                        </button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {Object.values(TEMPLATE_DEFINITIONS).map((template) => {
                        const enabled = availability?.[template.id] === true;
                        const busy = savingId === template.id;
                        const details = metadata?.[template.id];
                        const isEditing = editingId === template.id && draft;
                        return (
                            <Card key={template.id}>
                                <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                        <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:gap-4">
                                            {details?.image ? (
                                                <img
                                                    src={details.image}
                                                    alt={details.title || template.title}
                                                    className="h-16 w-12 shrink-0 rounded-lg border object-cover sm:h-20 sm:w-14"
                                                />
                                            ) : (
                                                <div aria-label="មិនទាន់បញ្ចូលរូប Cover" className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground sm:h-20 sm:w-14">
                                                    <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words font-bold leading-snug text-foreground">{details?.title || template.title}</p>
                                                <p className="mt-1 break-words text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                                                    <span className="font-medium">{template.id}</span>
                                                    <span className="px-1">·</span>
                                                    {details?.eventType === "both" ? "អាពាហ៍ពិពាហ៍ និងភ្ជាប់ពាក្យ" : details?.eventType === "anniversary" ? "ភ្ជាប់ពាក្យ" : "អាពាហ៍ពិពាហ៍"}
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                                                    {enabled ? "បើកសម្រាប់អ្នកប្រើថ្មី" : "បិទសម្រាប់អ្នកប្រើថ្មី"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex w-full shrink-0 items-center justify-between gap-2 border-t pt-3 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
                                            <div className="flex items-center gap-2">
                                                {busy && <Loader2 aria-label="កំពុងរក្សាទុក" className="h-4 w-4 animate-spin text-muted-foreground" />}
                                                <Switch
                                                    checked={enabled}
                                                    disabled={savingId !== null || savingMetadata}
                                                    onCheckedChange={(checked) => void updateAvailability(template.id, checked)}
                                                    aria-label={`${enabled ? "បិទ" : "បើក"} ${details?.title || template.title}`}
                                                />
                                            </div>
                                            <Button asChild type="button" variant="outline" size="sm" className="h-9 px-3">
                                                <Link to={`/dashboard/design?templatePreview=${encodeURIComponent(template.id)}`}>
                                                    <Eye className="h-3.5 w-3.5 sm:mr-2" />
                                                    <span className="hidden sm:inline">កែ Demo</span>
                                                </Link>
                                            </Button>
                                            {!isEditing && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    aria-label={`កែប្រែ ${details?.title || template.title}`}
                                                    disabled={editingId !== null || savingId !== null}
                                                    onClick={() => startEditing(template.id)}
                                                    className="h-9 px-3"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 sm:mr-2" />
                                                    <span className="hidden sm:inline">កែប្រែ</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                                            <div className="space-y-3">
                                                <label className="block text-sm font-semibold">
                                                    ឈ្មោះ Template
                                                    <input
                                                        maxLength={80}
                                                        value={draft.title}
                                                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                                                        className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 font-normal"
                                                    />
                                                </label>
                                                <label className="block text-sm font-semibold">
                                                    ពិពណ៌នា
                                                    <textarea
                                                        maxLength={300}
                                                        rows={3}
                                                        value={draft.description}
                                                        onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                                                        className="mt-1.5 w-full resize-y rounded-lg border bg-background px-3 py-2 font-normal"
                                                    />
                                                </label>
                                                <label className="block text-sm font-semibold">
                                                    ប្រភេទកម្មវិធីដែលអាចប្រើបាន
                                                    <select
                                                        value={draft.eventType}
                                                        onChange={(event) => setDraft({ ...draft, eventType: event.target.value as TemplatePresentationMetadata["eventType"] })}
                                                        className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 font-normal"
                                                    >
                                                        <option value="both">អាពាហ៍ពិពាហ៍ និងភ្ជាប់ពាក្យ</option>
                                                        <option value="wedding">អាពាហ៍ពិពាហ៍</option>
                                                        <option value="anniversary">ភ្ជាប់ពាក្យ</option>
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-sm font-semibold">រូប Cover</p>
                                                <ImageUploadWidget
                                                    value={draft.image}
                                                    onChange={(image) => setDraft({ ...draft, image })}
                                                    onRemove={() => setDraft({ ...draft, image: "" })}
                                                    folder="template-covers"
                                                    compact
                                                    label="បញ្ចូលរូប Cover"
                                                    maxFileSizeBytes={10 * 1024 * 1024}
                                                    allowedMimeTypes={["image/jpeg", "image/png", "image/webp"]}
                                                />
                                                <div className="rounded-xl border bg-muted/30 p-3">
                                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Preview</p>
                                                    <div className="flex gap-3">
                                                        {draft.image ? (
                                                            <img src={draft.image} alt="" className="h-20 w-14 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="flex h-20 w-14 items-center justify-center rounded-lg border bg-muted text-[10px] text-muted-foreground">
                                                                មិនទាន់មានរូប
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-bold">{draft.title || "ឈ្មោះ Template"}</p>
                                                            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{draft.description || "ពិពណ៌នា Template"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 md:col-span-2">
                                                <Button type="button" variant="outline" disabled={savingMetadata} onClick={cancelEditing}>
                                                    <X className="mr-2 h-4 w-4" /> បោះបង់
                                                </Button>
                                                <Button type="button" disabled={savingMetadata || !draft.title.trim()} onClick={() => void saveMetadata()}>
                                                    {savingMetadata ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                    រក្សាទុក
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
