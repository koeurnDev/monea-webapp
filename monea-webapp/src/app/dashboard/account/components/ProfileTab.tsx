import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, KeyRound, Phone, User as UserIcon, Loader2, Check, AlertCircle, Camera, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useCloudinary } from "@/hooks/use-cloudinary";
import { moneaClient } from "@/lib/api-client";

interface ProfileTabProps {
    user: {
        id?: string;
        name?: string | null;
        phone?: string | null;
        email?: string | null;
        avatar?: string | null;
        image?: string | null;
        hasPassword?: boolean;
    } | null;
    onShowChangePassword: () => void;
    onUpdateSuccess?: () => void;
}

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 1600;
const AVATAR_COMPRESSION_THRESHOLD = 512 * 1024;

async function prepareAvatarFile(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && file.size <= AVATAR_COMPRESSION_THRESHOLD) return file;

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare profile image");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const compressed = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error("Could not compress profile image")),
                "image/jpeg",
                0.82
            );
        });
        if (compressed.size >= file.size && scale === 1) return file;
        return new File([compressed], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
    } finally {
        bitmap.close();
    }
}

function getMediaPublicId(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === "media.moneoez.com") {
            const key = parsed.pathname.split("/").filter(Boolean).map(decodeURIComponent).join("/");
            return key ? `r2:${key}` : null;
        }
        if (parsed.hostname !== "res.cloudinary.com") return null;

        const uploadPath = "/upload/";
        const uploadIndex = parsed.pathname.indexOf(uploadPath);
        if (uploadIndex < 0) return null;

        const pathParts = parsed.pathname.slice(uploadIndex + uploadPath.length).split("/").filter(Boolean);
        const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
        if (versionIndex < 0) return null;

        return pathParts.slice(versionIndex + 1).join("/").replace(/\.[^/.]+$/, "") || null;
    } catch {
        return null;
    }
}

async function deleteProfileAsset(publicId: string) {
    try {
        const response = publicId.startsWith("r2:")
            ? await moneaClient.post<{ success?: boolean }>("/api/r2/delete", { publicId })
            : await moneaClient.post<{ success?: boolean }>("/api/cloudinary/delete", {
                public_id: publicId,
                resource_type: "image",
            });
        if (response.error || response.data?.success !== true) {
            console.warn("Profile asset cleanup failed:", response.error || "Delete was not confirmed");
        }
    } catch (error) {
        console.warn("Profile asset cleanup failed", error);
    }
}

export function ProfileTab({ user, onShowChangePassword, onUpdateSuccess }: ProfileTabProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(user?.name || "");
    const [savedName, setSavedName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [savedPhone, setSavedPhone] = useState(user?.phone || "");
    const [avatar, setAvatar] = useState(user?.avatar || user?.image || "");
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attemptedSave, setAttemptedSave] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { uploadFiles } = useCloudinary({ folder: `${user?.id || "user"}/profile` });
    const hasUnsavedChanges = name !== savedName || phone !== savedPhone;

    useEffect(() => {
        const nextName = user?.name || "";
        const nextPhone = user?.phone || "";
        setName(nextName);
        setSavedName(nextName);
        setPhone(nextPhone);
        setSavedPhone(nextPhone);
    }, [user?.id, user?.name, user?.phone]);

    useEffect(() => {
        setAvatar(user?.avatar || user?.image || "");
    }, [user?.id, user?.avatar, user?.image]);

    useEffect(() => {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get("telegramLinked") !== "1") return;

        setStatusMessage({
            type: "success",
            text: t("account.profile.telegram.linkedSuccess", { defaultValue: "បានភ្ជាប់ Telegram ដោយជោគជ័យ។" }),
        });
        onUpdateSuccess?.();
        currentUrl.searchParams.delete("telegramLinked");
        window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }, [onUpdateSuccess, t]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warnBeforeLeaving);
        return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [hasUnsavedChanges]);

    const isPhoneValid = (value: string) => {
        const trimmedPhone = value.trim();
        if (!trimmedPhone) return true;
        if (!/^\+?[0-9\s().-]+$/.test(trimmedPhone)) return false;
        const digitCount = trimmedPhone.replace(/\D/g, "").length;
        return digitCount >= 7 && digitCount <= 15;
    };

    const updateAvatar = async (nextAvatar: string | null, newPublicId?: string) => {
        setAvatarLoading(true);
        setStatusMessage(null);
        try {
            const response = await moneaClient.put<{ success: boolean }>("/api/auth/me", { avatar: nextAvatar });
            if (response.error || !response.data?.success) throw new Error(response.error || "Avatar update failed");
            setAvatar(nextAvatar || "");
            onUpdateSuccess?.();
            const oldPublicId = avatar ? getMediaPublicId(avatar) : null;
            if (oldPublicId && oldPublicId !== newPublicId) void deleteProfileAsset(oldPublicId);
        } catch (error) {
            console.error("Error updating avatar", error);
            setStatusMessage({ type: "error", text: t("account.profile.errors.avatarSave", { defaultValue: "មិនអាចរក្សាទុករូប Profile បានទេ" }) });
            if (newPublicId) void deleteProfileAsset(newPublicId);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleAvatarChange = async (file: File | undefined) => {
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setStatusMessage({ type: "error", text: t("account.profile.errors.avatarType", { defaultValue: "សូមជ្រើសរូប JPG, PNG ឬ WEBP ប៉ុណ្ណោះ។" }) });
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setStatusMessage({ type: "error", text: t("account.profile.errors.avatarSize", { defaultValue: "រូប Profile មិនអាចលើសពី 10 MB បានទេ។" }) });
            return;
        }

        setAvatarLoading(true);
        setStatusMessage(null);
        try {
            const preparedFile = await prepareAvatarFile(file);
            const uploaded = await uploadFiles([preparedFile]);
            if (!uploaded[0]?.url) {
                setStatusMessage({ type: "error", text: t("account.profile.errors.avatarUpload", { defaultValue: "ការបញ្ចូលរូប Profile បរាជ័យ។ សូមសាកល្បងម្តងទៀត។" }) });
                return;
            }
            await updateAvatar(uploaded[0].url, uploaded[0].publicId);
        } catch (error) {
            console.error("Error uploading profile avatar", error);
            setStatusMessage({ type: "error", text: t("account.profile.errors.avatarUpload", { defaultValue: "ការបញ្ចូលរូប Profile បរាជ័យ។ សូមសាកល្បងម្តងទៀត។" }) });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleSave = async () => {
        setAttemptedSave(true);
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        if (!trimmedName || trimmedName.length > 100) {
            setStatusMessage({
                type: "error",
                text: t("account.profile.validation.name", { defaultValue: "សូមបញ្ចូលឈ្មោះពី 1 ដល់ 100 តួអក្សរ។" }),
            });
            return;
        }
        if (!isPhoneValid(trimmedPhone)) {
            setStatusMessage({
                type: "error",
                text: t("account.profile.validation.phone", { defaultValue: "លេខទូរស័ព្ទត្រូវមាន 7–15 ខ្ទង់ និងអាចប្រើ +, ដកឃ្លា ឬសញ្ញា - បាន។" }),
            });
            return;
        }

        setLoading(true);
        setStatusMessage(null);
        try {
            const response = await moneaClient.put<{ success: boolean }>("/api/auth/me", {
                name: trimmedName,
                phone: trimmedPhone,
            });
            if (!response.error && response.data?.success) {
                setName(trimmedName);
                setSavedName(trimmedName);
                setPhone(trimmedPhone);
                setSavedPhone(trimmedPhone);
                setAttemptedSave(false);
                setStatusMessage({ type: 'success', text: t("account.profile.saved", { defaultValue: "បានរក្សាទុកព័ត៌មានដោយជោគជ័យ!" }) });
                onUpdateSuccess?.();
                setTimeout(() => setStatusMessage(null), 3000);
            } else {
                setStatusMessage({ type: 'error', text: response.error || t("common.errors.general", { defaultValue: "មានបញ្ហាក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត" }) });
            }
        } catch (error) {
            console.error("Error updating profile", error);
            setStatusMessage({ type: 'error', text: t("common.errors.network") });
        } finally {
            setLoading(false);
        }
    };

    const nameError = attemptedSave && (!name.trim() || name.trim().length > 100)
        ? t("account.profile.validation.name", { defaultValue: "សូមបញ្ចូលឈ្មោះពី 1 ដល់ 100 តួអក្សរ។" })
        : "";
    const phoneError = attemptedSave && !isPhoneValid(phone)
        ? t("account.profile.validation.phone", { defaultValue: "លេខទូរស័ព្ទត្រូវមាន 7–15 ខ្ទង់ និងអាចប្រើ +, ដកឃ្លា ឬសញ្ញា - បាន។" })
        : "";

    return (
        <Card className="border border-border bg-card shadow-sm rounded-3xl overflow-hidden font-kantumruy">
            <CardHeader className="p-5 pb-4 sm:p-8 sm:pb-4">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-primary text-2xl font-black text-primary-foreground">
                        {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{(name || user?.email || "U").slice(0, 1).toUpperCase()}</span>}
                        {avatarLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-5 w-5 animate-spin" /></div>}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground transition hover:bg-muted">
                            <Camera className="h-3.5 w-3.5" />
                            <span>{avatar ? t("account.profile.avatar.change", { defaultValue: "ប្តូររូប" }) : t("account.profile.avatar.add", { defaultValue: "បន្ថែមរូប" })}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void handleAvatarChange(file); }} disabled={avatarLoading} />
                        </label>
                        {avatar && <Button type="button" variant="ghost" onClick={() => {
                            if (window.confirm(t("account.profile.avatar.deleteConfirm", { defaultValue: "តើអ្នកប្រាកដថាចង់លុបរូប Profile មែនទេ?" }))) {
                                void updateAvatar(null);
                            }
                        }} disabled={avatarLoading} className="h-11 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:text-destructive"><Trash2 className="mr-1.5 h-4 w-4" />{t("common.actions.delete", { defaultValue: "លុប" })}</Button>}
                    </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {t("account.profile.avatarHelp", { defaultValue: "ដាក់រូបមុខរបស់អ្នក ដើម្បីងាយសម្គាល់គណនី។ អាចរំលងបាន។" })}
                </p>
                <CardTitle className="text-2xl font-bold text-foreground font-kantumruy tracking-tight">
                    {t("account.profile.title", { defaultValue: "ព័ត៌មានផ្ទាល់ខ្លួន" })}
                </CardTitle>
                <CardDescription className="font-kantumruy text-sm leading-relaxed text-muted-foreground">
                    {t("account.profile.description", { defaultValue: "ធ្វើបច្ចុប្បន្នភាពឈ្មោះ និងលេខទូរស័ព្ទសម្រាប់គណនីរបស់អ្នក។" })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-5 pt-2 sm:p-8 sm:pt-2">
                {statusMessage && (
                    <div role={statusMessage.type === "error" ? "alert" : "status"} aria-live="polite" className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold font-kantumruy ${
                        statusMessage.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                        {statusMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="min-w-0 space-y-2">
                        <Label htmlFor="account-profile-name" className="ml-1 text-sm font-bold text-muted-foreground">
                            {t("account.profile.labels.username", { defaultValue: "ឈ្មោះពេញ" })}
                        </Label>
                        <div className="relative">
                            <Input
                                id="account-profile-name"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setStatusMessage(null);
                                }}
                                maxLength={100}
                                autoComplete="name"
                                aria-invalid={Boolean(nameError)}
                                aria-describedby={nameError ? "account-profile-name-error" : undefined}
                                className="h-12 rounded-2xl border-border bg-muted/50 px-4 pl-11 text-base font-medium text-foreground font-kantumruy focus-visible:ring-ring"
                            />
                            <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 text-muted-foreground" />
                        </div>
                        {nameError && <p id="account-profile-name-error" className="ml-1 text-xs font-medium text-destructive">{nameError}</p>}
                    </div>
                    
                    <div className="min-w-0 space-y-2">
                        <Label htmlFor="account-profile-phone" className="ml-1 text-sm font-bold text-muted-foreground">
                            {t("account.profile.labels.phone", { defaultValue: "លេខទូរស័ព្ទ" })}
                        </Label>
                        <div className="relative">
                            <Input 
                                id="account-profile-phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                maxLength={24}
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setStatusMessage(null);
                                }}
                                placeholder="012 345 678"
                                aria-invalid={Boolean(phoneError)}
                                aria-describedby={phoneError ? "account-profile-phone-error" : undefined}
                                className="h-12 rounded-2xl border-border bg-muted/50 px-4 pl-11 text-base font-medium text-foreground font-kantumruy focus-visible:ring-ring"
                            />
                            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
                        </div>
                        {phoneError && <p id="account-profile-phone-error" className="ml-1 text-xs font-medium text-destructive">{phoneError}</p>}
                    </div>

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                        <Label id="account-profile-email-label" className="ml-1 text-sm font-bold text-muted-foreground">
                            {t("account.profile.labels.email", { defaultValue: "អ៊ីមែល" })}
                        </Label>
                        <div id="account-profile-email" aria-labelledby="account-profile-email-label" className="flex h-12 min-w-0 cursor-not-allowed items-center gap-3 rounded-2xl border border-border bg-muted/70 px-4 font-medium text-muted-foreground select-all">
                            <Mail size={18} className="text-muted-foreground shrink-0" />
                            <span className="min-w-0 truncate text-base">{user?.email || "..."}</span>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                        <Label className="ml-1 text-xs font-bold text-muted-foreground">{t("account.profile.accountId", { defaultValue: "លេខសម្គាល់គណនី" })}</Label>
                        <div className="flex h-11 items-center rounded-xl border border-border bg-muted px-3 font-mono text-xs text-muted-foreground">
                            <span className="truncate">{user?.id || "-"}</span>
                        </div>
                    </div>

                </div>

                {hasUnsavedChanges && (
                    <div className="flex justify-start pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={loading || avatarLoading}
                            className="h-11 w-full rounded-2xl bg-primary px-8 font-kantumruy text-xs font-bold text-primary-foreground shadow-sm transition-all active:scale-95 hover:bg-primary/90 sm:w-auto"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            <span>{loading ? t("common.loading.saving", { defaultValue: "កំពុងរក្សាទុក..." }) : t("common.actions.save", { defaultValue: "រក្សាទុក" })}</span>
                        </Button>
                    </div>
                )}

                {user?.hasPassword && <div className="pt-6 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-muted/50 rounded-2xl border border-border text-center sm:text-left">
                        <div className="flex items-center gap-4 mx-auto sm:mx-0">
                            <div className="p-3 bg-accent rounded-2xl text-primary">
                                <KeyRound size={22} />
                            </div>
                            <div className="space-y-0.5 text-left">
                                <p className="text-sm font-bold text-foreground font-kantumruy">{t("account.profile.changePassword.title", { defaultValue: "ផ្លាស់ប្តូរពាក្យសម្ងាត់" })}</p>
                                <p className="hidden text-xs leading-relaxed text-muted-foreground font-kantumruy sm:block">{t("account.profile.changePassword.description", { defaultValue: "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់ដើម្បីបង្កើនសុវត្ថិភាពគណនី។" })}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold font-kantumruy text-xs px-5 h-10 border-border hover:bg-accent text-foreground transition-all active:scale-95 w-full sm:w-auto shrink-0"
                            onClick={onShowChangePassword}
                        >
                            {t("account.profile.changePassword.button", { defaultValue: "ផ្លាស់ប្តូរ" })}
                        </Button>
                    </div>
                </div>}
            </CardContent>
        </Card>
    );
}
