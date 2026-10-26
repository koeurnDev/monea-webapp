import { useState } from "react";
import { m } from "framer-motion";
import { User, MapPin, Sparkles } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moneaClient } from "@/lib/api-client";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";

const GUEST_PREFIXES = [
    { value: "NONE", label: "ដាក់តែឈ្មោះ" },
    { value: "MR", label: "លោក" },
    { value: "MRS", label: "លោកស្រី" },
    { value: "MISS", label: "កញ្ញា" },
    { value: "FAMILY", label: "គ្រួសារ" },
    { value: "EXCELLENCY", label: "ឯកឧត្តម" },
    { value: "MADAME", label: "លោកជំទាវ" },
] as const;

function splitGuestName(fullName: string) {
    const prefix = GUEST_PREFIXES.find(
        (option) => option.value !== "NONE" && fullName.startsWith(`${option.label} `)
    );

    return prefix
        ? { prefix: prefix.value, name: fullName.slice(prefix.label.length).trimStart() }
        : { prefix: "NONE", name: fullName };
}

export function GuestForm({
    onSuccess,
    onDone,
    initialData,
    onOptimisticAdd,
    onOptimisticUpdate
}: {
    onSuccess: (options?: { silent?: boolean }) => void;
    onDone?: () => void;
    initialData?: any;
    onOptimisticAdd?: (guestData: any) => void;
    onOptimisticUpdate?: (guestId: string, updatedFields: any) => void;
}) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const formSchema = z.object({
        name: z.string().min(1, t("guests.form.validation.name")),
        prefix: z.string(),
        source: z.string().optional(),
    });

    const initialName = splitGuestName(initialData?.name || "");
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialName.name,
            prefix: initialName.prefix,
            source: initialData?.source || initialData?.group || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const isEditing = !!initialData;
        const guestId = initialData?.id;
        const selectedPrefix = GUEST_PREFIXES.find(option => option.value === values.prefix);
        const guestData = {
            source: values.source,
            name: [selectedPrefix?.value === "NONE" ? "" : selectedPrefix?.label, values.name.trim()]
                .filter(Boolean)
                .join(" "),
        };

        // 1. Instant Optimistic UI Update (0ms delay!)
        if (isEditing && guestId) {
            onOptimisticUpdate?.(guestId, guestData);
        } else {
            onOptimisticAdd?.(guestData);
        }

        // 2. Immediately close modal and reset form
        if (onDone) onDone();
        form.reset();

        showToast({
            title: t("common.success.title", { defaultValue: "ជោគជ័យ" }),
            description: isEditing ? (t("guests.form.editSuccess") || "បានកែប្រែព័ត៌មានភ្ញៀវ") : (t("guests.form.addSuccess") || "បានបញ្ចូលភ្ញៀវដោយជោគជ័យ"),
            type: "success",
        });

        // 3. Fire background network sync
        try {
            const url = "/api/guests";
            const body = isEditing ? { ...guestData, id: guestId } : guestData;

            const res = isEditing 
                ? await moneaClient.patch(url, body)
                : await moneaClient.post(url, body);

            if (!res.error) {
                // Silently refresh in background without full-screen loader
                onSuccess({ silent: true });
            } else {
                const isLimitError = (res as any).status === 429 || res.error?.toLowerCase().includes("limit") || res.error?.toLowerCase().includes("upgrade");
                if (isLimitError) {
                    showToast({
                        title: "Action Limit Reached",
                        description: "You've hit the action limit. Upgrade to Pro for unlimited access.",
                        type: "error",
                        action: { label: "Upgrade to Pro", onClick: () => window.location.href = "/dashboard" }
                    });
                } else {
                    showToast({
                        title: "Action Failed",
                        description: res.error,
                        type: "error"
                    });
                }
                onSuccess({ silent: true });
            }
        } catch (error) {
            console.error(error);
            onSuccess({ silent: true });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                <div className="space-y-4">
                    {/* Section Header */}
                    <m.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3.5 mb-1"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                                <User className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground font-kantumruy leading-tight">
                                {t("guests.form.sectionTitle")}
                            </h3>
                            <p className="text-xs text-muted-foreground font-kantumruy opacity-75 flex items-center gap-1">
                                <Sparkles size={11} className="text-amber-500" />
                                <span>{t("guests.form.sectionSubtitle")}</span>
                            </p>
                        </div>
                    </m.div>

                    <m.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-muted/50 border border-border/60 rounded-2xl p-4 space-y-4 shadow-sm backdrop-blur-xl"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-bold text-foreground font-kantumruy">
                                        {t("guests.form.nameLabel")} <span className="text-rose-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative group/input">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors z-20" />
                                            <Input
                                                placeholder={t("guests.form.namePlaceholder")}
                                                className="pl-10 h-11 text-sm rounded-xl font-kantumruy border-border/80 bg-background/80 focus:bg-background focus-visible:ring-ring focus-visible:border-primary/50 font-bold"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="font-kantumruy text-xs mt-0.5 text-rose-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="prefix"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-bold text-foreground font-kantumruy">
                                        {t("guests.form.prefixLabel")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background/80 font-kantumruy text-sm font-bold focus:ring-ring">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="font-kantumruy">
                                            {GUEST_PREFIXES.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="font-kantumruy text-xs mt-0.5 text-rose-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs font-bold text-foreground font-kantumruy">
                                        {t("guests.form.locationLabel")}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative group/input">
                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors z-20" />
                                            <Input
                                                placeholder={t("guests.form.locationPlaceholder")}
                                                className="pl-10 h-11 text-sm rounded-xl font-kantumruy border-border/80 bg-background/80 focus:bg-background focus-visible:ring-ring focus-visible:border-primary/50 font-medium"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="font-kantumruy text-xs mt-0.5 text-rose-500" />
                                </FormItem>
                            )}
                        />
                    </m.div>
                </div>

                <m.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl text-sm font-bold font-kantumruy transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg active:scale-98"
                    >
                        <div className="flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>{t("guests.form.saving")}</span>
                                </>
                            ) : (
                                <>
                                    <span>{initialData ? t("guests.form.editBtn") : t("guests.form.saveBtn")}</span>
                                    <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </div>
                    </Button>
                </m.div>
            </form>
        </Form>
    );
}
