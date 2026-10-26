import React, { useState, useEffect } from 'react';
import { moneaClient } from "@/lib/api-client";
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Loader2,
    ShieldAlert,
    Cpu,
    Settings,
    ShieldCheck,
    History,
    Lock,
    CreditCard,
    Wrench,
    FileText,
    CheckCircle2,
    Eye,
    EyeOff,
    Terminal,
    ExternalLink,
    Save,
    Calendar,
    LayoutGrid,
    AlertTriangle,
    Activity,
    Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/Toast";
import { SecurityAuditFeed } from "@/components/admin/SecurityAuditFeed";
import { useTranslation } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { isPhoneFrameColor, PHONE_FRAME_COLORS, type PhoneFrameColor } from "@/lib/phone-frame-colors";

export default function MasterSettingsPage() {
    const { t, locale } = useTranslation();
    const isKm = locale === 'km';
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'appearance' | 'security' | 'bakong' | 'maintenance' | 'audit'>('appearance');
    const [phoneFrameColor, setPhoneFrameColor] = useState<PhoneFrameColor>("black");
    const [isSavingPhoneFrameColor, setIsSavingPhoneFrameColor] = useState(false);
    const { showToast } = useToast();

    // 2FA States
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [twoFactorToken, setTwoFactorToken] = useState("");
    const [is2FASetupLoading, setIs2FASetupLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showPasswordPromptFor2FA, setShowPasswordPromptFor2FA] = useState(false);
    const [passwordFor2FA, setPasswordFor2FA] = useState("");
    const [showPasswordFor2FA, setShowPasswordFor2FA] = useState(false);

    // Bakong States
    const [bakongEmail, setBakongEmail] = useState("");
    const [bakongOrg, setBakongOrg] = useState("MONEA Platform");
    const [bakongProject, setBakongProject] = useState("Wedding Integration");
    const [bakongManualToken, setBakongManualToken] = useState("");
    const [isBakongLoading, setIsBakongLoading] = useState(false);
    // Receiving account used to generate KHQR codes for current payment flows.
    const [bakongAccountID, setBakongAccountID] = useState("");
    const [bakongMerchantName, setBakongMerchantName] = useState("MONEO");
    const [isSavingBakongAccount, setIsSavingBakongAccount] = useState(false);
    const [bakongInfo, setBakongInfo] = useState<{
        email?: string;
        organization?: string;
        project?: string;
        accountID?: string;
        merchantName?: string;
        isConnected?: boolean;
        isPaymentReady?: boolean;
        updatedAt?: string;
    } | null>(null);

    // Master Admin Profile & Password States
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [currPassword, setCurrPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwFields, setShowPwFields] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        moneaClient.get("/api/admin/master/settings")
            .then(res => {
                const data = res.data as any;
                setConfig(data);
                if (isPhoneFrameColor(data?.phoneFrameColor)) {
                    setPhoneFrameColor(data.phoneFrameColor);
                }
            })
            .finally(() => setLoading(false));

        // Fetch Current Admin Info
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data?.email) setAdminEmail(data.email);
                if (data?.name) setAdminName(data.name);
                if (data?.twoFactorEnabled) setIs2FAEnabled(true);
            })
            .catch(() => {});

        // Fetch Bakong Status
        moneaClient.get("/api/admin/bakong/status")
            .then(res => {
                const data = res.data as any;
                setBakongInfo(data);
                if (data?.email) setBakongEmail(data.email);
                if (data?.organization) setBakongOrg(data.organization);
                if (data?.project) setBakongProject(data.project);
                if (data?.accountID) setBakongAccountID(data.accountID);
                if (data?.merchantName) setBakongMerchantName(data.merchantName);
            })
            .catch(() => {});
    }, []);

    const handleAutoSave = async (updatedFields: Partial<any>) => {
        if (!config) return;
        const newConfig = { ...config, ...updatedFields };
        setConfig(newConfig); // optimistic update
        try {
            const res = await moneaClient.post("/api/admin/master/settings", newConfig);
            if (!res.error) {
                showToast({ title: t("admin.settings.saveSuccess", { defaultValue: "បានរក្សាទុកជោគជ័យ" }), type: "success" });
                
                if ('maintenanceMode' in updatedFields || 'globalCheckIn' in updatedFields) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            } else {
                showToast({ title: t("admin.settings.saveFailed", { defaultValue: "បរាជ័យក្នុងការរក្សាទុក" }), description: res.error, type: "error" });
                setConfig(config); // revert
            }
        } catch (e) {
            console.error(e);
            showToast({ title: t("admin.settings.saveFailed", { defaultValue: "បរាជ័យក្នុងការរក្សាទុក" }), type: "error" });
            setConfig(config); // revert
        }
    };

    const handleSavePhoneFrameColor = async () => {
        setIsSavingPhoneFrameColor(true);
        try {
            const res = await moneaClient.post("/api/admin/master/settings", {
                ...config,
                phoneFrameColor,
            });
            if (res.error) {
                showToast({ title: isKm ? "បរាជ័យក្នុងការរក្សាទុក" : "Failed to save", description: res.error, type: "error" });
                return;
            }
            setConfig({ ...config, phoneFrameColor });
            showToast({ title: isKm ? "បានរក្សាទុកពណ៌ស៊ុមទូរស័ព្ទជាសកល" : "Global phone frame color saved", type: "success" });
        } catch (error) {
            console.error("[AdminSettings] Could not save global phone frame color:", error);
            showToast({ title: isKm ? "បរាជ័យក្នុងការរក្សាទុក" : "Failed to save", type: "error" });
        } finally {
            setIsSavingPhoneFrameColor(false);
        }
    };

    const handleSetup2FA = async () => {
        if (!passwordFor2FA) {
            showToast({ title: "Password Required", type: "error" });
            return;
        }
        setIs2FASetupLoading(true);
        try {
            const res = await moneaClient.post<any>("/api/auth/2fa/setup", { password: passwordFor2FA });
            if (res.data?.qrCodeDataUrl) {
                setQrCode(res.data.qrCodeDataUrl);
                setShowPasswordPromptFor2FA(false);
            } else if (res.error) {
                showToast({ title: "Verification Failed", description: res.error, type: "error" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIs2FASetupLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setIs2FASetupLoading(true);
        try {
            const res = await moneaClient.post<any>("/api/auth/2fa/verify", { token: twoFactorToken });
            if (res.data?.success) {
                setIs2FAEnabled(true);
                setQrCode(null);
                showToast({ title: "2FA Verified Successfully", type: "success" });
            } else {
                showToast({
                    title: t("admin.settings.2faInvalid", { defaultValue: "កូដមិនត្រឹមត្រូវ" }),
                    description: res.data?.error || t("admin.settings.2faCheckCode", { defaultValue: "សូមពិនិត្យកូដ 2FA ម្តងទៀត" }),
                    type: "info"
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIs2FASetupLoading(false);
        }
    };

    const handleBakongManualSave = async () => {
        if (!bakongManualToken) return;
        setIsBakongLoading(true);
        try {
            const res = await moneaClient.post<any>("/api/admin/bakong/manual-token", { token: bakongManualToken });
            if (!res.error) {
                showToast({ title: "Saved", description: "Bakong Token updated manually.", type: "success" });
                setBakongInfo({ ...bakongInfo, isConnected: true });
                setBakongManualToken("");
            } else {
                showToast({ title: "Save Failed", description: res.error, type: "error" });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsBakongLoading(false);
        }
    };

    const handleBakongAccountSave = async () => {
        const accountID = bakongAccountID.trim();
        if (!accountID) return;
        setIsSavingBakongAccount(true);
        try {
            const res = await moneaClient.post<any>("/api/admin/bakong/account", {
                accountID,
                merchantName: bakongMerchantName.trim() || "MONEO",
            });
            if (!res.error && res.data) {
                showToast({ title: "Saved", description: "Bakong receiving account updated.", type: "success" });
                setBakongInfo({
                    ...bakongInfo,
                    accountID: res.data.accountID,
                    merchantName: res.data.merchantName,
                    isPaymentReady: res.data.isPaymentReady,
                });
            } else {
                showToast({ title: "Save Failed", description: res.error || "Could not save Bakong account.", type: "error" });
            }
        } catch (e: any) {
            console.error(e);
            showToast({ title: "Save Failed", description: e?.message || "Could not save Bakong account.", type: "error" });
        } finally {
            setIsSavingBakongAccount(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsSavingProfile(true);
        try {
            const res = await fetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: adminName, email: adminEmail })
            });
            const data = await res.json();
            if (res.ok) {
                showToast({ title: "បានធ្វើបច្ចុប្បន្នភាពព័ត៌មាន Admin ជោគជ័យ!", type: "success" });
            } else {
                showToast({ title: "បរាជ័យ", description: data.error || "Failed to update profile", type: "error" });
            }
        } catch (e: any) {
            showToast({ title: "បរាជ័យ", description: e.message, type: "error" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currPassword || !newPassword) {
            showToast({ title: "សូមបញ្ចូល Password ចាស់ និងថ្មី", type: "error" });
            return;
        }
        if (newPassword.length < 8) {
            showToast({ title: "Password ថ្មីត្រូវមានយ៉ាងតិច ៨ ខ្ទង់", type: "error" });
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast({ title: "Password ថ្មីទាំងពីរមិនដូចគ្នាទេ", type: "error" });
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: currPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                showToast({ title: "បានផ្លាស់ប្តូរ Password ជោគជ័យ!", type: "success" });
                setCurrPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                showToast({ title: "បរាជ័យ", description: data.error || "Failed to change password", type: "error" });
            }
        } catch (e: any) {
            showToast({ title: "បរាជ័យ", description: e.message, type: "error" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const tabs = [
        { id: 'appearance', label: "រូបរាង Preview", enLabel: "Preview Appearance", icon: Smartphone },
        { id: 'security', label: "សុវត្ថិភាព & គណនី", enLabel: "Security & Account", icon: Lock },
        { id: 'bakong', label: "Bakong KHQR", enLabel: "Gateway", icon: CreditCard },
        { id: 'maintenance', label: "ការថែទាំប្រព័ន្ធ", enLabel: "Maintenance", icon: Wrench },
        { id: 'audit', label: "កំណត់ត្រាសវនកម្ម", enLabel: "Audit Logs", icon: FileText },
    ] as const;

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center font-kantumruy">
                <Loader2 className="w-10 h-10 animate-spin text-teal-700 dark:text-teal-300" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-full font-kantumruy pb-16">
            {/* Top Bar Header */}
            <div className="bg-card/80 backdrop-blur-md border-b border-border/80 sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-3 py-3 sm:px-8 sm:py-0 sm:h-20 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Link to="/admin/master">
                            <Button variant="ghost" size="icon" aria-label="ត្រឡប់ទៅទំព័រគ្រប់គ្រង" className="shrink-0 rounded-xl h-10 w-10 border border-border bg-card shadow-xs hover:bg-muted">
                                <ArrowLeft size={17} className="text-muted-foreground" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs sm:text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                <ShieldCheck size={13} />
                                <span className="truncate">Master Config</span>
                            </div>
                            <h1 className="truncate text-base sm:text-xl font-bold text-foreground">
                                {t("admin.overview.globalSettings", { defaultValue: "ការកំណត់ប្រព័ន្ធរួម" })}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-medium text-muted-foreground">
                            <Cpu size={14} className="text-teal-700 dark:text-teal-300" />
                            <span>Engine v1.2.3</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-3 sm:p-8 space-y-4 sm:space-y-6">
                {/* Clean Segmented Tab Navigation */}
                <div role="tablist" aria-label="Master settings" className="grid grid-cols-2 gap-1.5 p-1.5 bg-muted/50 border border-border/80 rounded-2xl sm:flex sm:items-center sm:overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex min-w-0 min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-xs font-bold leading-tight transition-all select-none sm:min-h-0 sm:shrink-0 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs",
                                    isActive
                                        ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                                )}
                            >
                                <Icon size={14} className={cn("shrink-0 sm:h-4 sm:w-4", isActive ? "text-teal-800 dark:text-teal-300" : "text-muted-foreground")} />
                                <span className="min-w-0 break-words">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'appearance' && (
                    <Card className="max-w-3xl rounded-2xl border border-border/80 bg-card shadow-xs">
                        <CardContent className="space-y-6 p-4 sm:p-8">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-800 dark:text-teal-300">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground">
                                        {isKm ? "ពណ៌ស៊ុម iPhone Preview" : "iPhone Preview Frame Color"}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        {isKm
                                            ? "ពណ៌នេះនឹងបង្ហាញជាសកលក្នុង Phone Preview របស់អ្នកប្រើទាំងអស់។"
                                            : "This color is applied globally to every user's phone preview."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {(Object.entries(PHONE_FRAME_COLORS) as [PhoneFrameColor, typeof PHONE_FRAME_COLORS[PhoneFrameColor]][]).map(([color, option]) => (
                                    <button
                                        key={color}
                                        type="button"
                                        aria-pressed={phoneFrameColor === color}
                                        onClick={() => setPhoneFrameColor(color)}
                                        className={cn(
                                            "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                            phoneFrameColor === color ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <span className="h-8 w-12 rounded-lg border border-black/15 shadow-sm" style={{ background: option.gradient }} />
                                        <span className="text-xs font-semibold text-foreground">{option.label}</span>
                                    </button>
                                ))}
                            </div>

                            <Button
                                type="button"
                                onClick={() => void handleSavePhoneFrameColor()}
                                disabled={isSavingPhoneFrameColor || phoneFrameColor === (config?.phoneFrameColor ?? "black")}
                                className="h-11 w-full rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800 sm:w-auto sm:px-8"
                            >
                                {isSavingPhoneFrameColor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isKm ? "រក្សាទុកជាសកល" : "Save Globally"}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ─── TAB 2: SECURITY & 2FA (សុវត្ថិភាព) ─── */}
                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        {/* 2FA Setup Card */}
                        <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                            <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-8">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-800 dark:text-teal-300">
                                        <Lock size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words font-bold text-sm text-foreground sm:text-base">ផ្ទៀងផ្ទាត់ចូល (2FA Setup)</h3>
                                        <p className="text-xs leading-relaxed text-muted-foreground">ការពារគណនី SuperAdmin ជាមួយ Google Authenticator</p>
                                    </div>
                                </div>

                                {is2FAEnabled ? (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
                                        <CheckCircle2 size={18} className="text-emerald-600" />
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            បានបើកមុខងារ 2FA រួចរាល់
                                        </span>
                                    </div>
                                ) : !qrCode ? (
                                    showPasswordPromptFor2FA ? (
                                        <div className="space-y-3 p-4 bg-muted/40 border border-border/80 rounded-xl">
                                            <p className="text-xs font-bold text-foreground">
                                                បញ្ចូល Master Password ដើម្បីបន្ត៖
                                            </p>
                                            <div className="relative">
                                                <input
                                                    type={showPasswordFor2FA ? "text" : "password"}
                                                    placeholder="Master Password"
                                                    className="h-11 w-full pl-4 pr-10 rounded-xl border border-input bg-background text-sm font-medium focus:border-teal-600 outline-none"
                                                    value={passwordFor2FA}
                                                    onChange={(e) => setPasswordFor2FA(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSetup2FA()}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordFor2FA(!showPasswordFor2FA)}
                                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPasswordFor2FA ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={() => setShowPasswordPromptFor2FA(false)} variant="outline" className="h-10 flex-1 rounded-xl text-xs font-bold">
                                                    បោះបង់
                                                </Button>
                                                <Button onClick={handleSetup2FA} disabled={is2FASetupLoading || !passwordFor2FA} className="h-10 flex-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold">
                                                    {is2FASetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ផ្ទៀងផ្ទាត់"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => setShowPasswordPromptFor2FA(true)}
                                            disabled={is2FASetupLoading}
                                            className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs"
                                        >
                                            {is2FASetupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ចាប់ផ្តើមរៀបចំប្រព័ន្ធ 2FA"}
                                        </Button>
                                    )
                                ) : (
                                    <div className="space-y-4 p-4 bg-muted/40 border border-border/80 rounded-xl text-center">
                                        <div className="bg-white p-2 rounded-xl border border-border mx-auto w-32 h-32 flex items-center justify-center">
                                            <img src={qrCode} alt="2FA QR Code" width={110} height={110} className="rounded-lg object-contain" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">ស្កេន QR Code ក្នុង Google Authenticator App</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="000000"
                                                className="h-11 flex-1 px-4 rounded-xl border border-input bg-background text-base font-bold text-center focus:border-teal-600 outline-none font-mono"
                                                value={twoFactorToken}
                                                onChange={(e) => setTwoFactorToken(e.target.value)}
                                                maxLength={6}
                                            />
                                            <Button
                                                onClick={handleVerify2FA}
                                                disabled={is2FASetupLoading || twoFactorToken.length < 6}
                                                className="h-11 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs"
                                            >
                                                ផ្ទៀងផ្ទាត់
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Master Admin Profile & Email Card */}
                        <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                            <CardContent className="p-6 sm:p-8 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words font-bold text-sm text-foreground sm:text-base">គណនី និង អ៊ីមែល Master Admin</h3>
                                        <p className="text-xs leading-relaxed text-muted-foreground">ផ្លាស់ប្តូរឈ្មោះ និង Email សម្រាប់ចូលប្រើប្រាស់</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">ឈ្មោះ Admin:</label>
                                        <input
                                            type="text"
                                            value={adminName}
                                            onChange={(e) => setAdminName(e.target.value)}
                                            placeholder="Master Admin"
                                            className="h-11 w-full px-4 rounded-xl border border-input bg-background text-sm font-medium focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">អ៊ីមែល (Email):</label>
                                        <input
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            placeholder="admin@monea.com"
                                            className="h-11 w-full px-4 rounded-xl border border-input bg-background text-sm font-medium focus:border-blue-500 outline-none font-mono"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={isSavingProfile}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                                    >
                                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                                        <span>រក្សាទុកព័ត៌មានគណនី (Save Profile)</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Master Admin Change Password Card */}
                        <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                            <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-8">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-800 dark:text-teal-300">
                                        <Lock size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words font-bold text-sm text-foreground sm:text-base">ផ្លាស់ប្តូរលេខសម្ងាត់ (Password)</h3>
                                        <p className="text-xs leading-relaxed text-muted-foreground">កំណត់ Password ថ្មីយ៉ាងតិច ៨ ខ្ទង់</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type={showPwFields ? "text" : "password"}
                                            placeholder="លេខសម្ងាត់បច្ចុប្បន្ន (Current Password)"
                                            className="h-11 w-full pl-4 pr-10 rounded-xl border border-input bg-background text-xs font-medium focus:border-teal-600 outline-none"
                                            value={currPassword}
                                            onChange={(e) => setCurrPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwFields(!showPwFields)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPwFields ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>

                                    <input
                                        type={showPwFields ? "text" : "password"}
                                        placeholder="លេខសម្ងាត់ថ្មី (New Password - យ៉ាងតិច 8 ខ្ទង់)"
                                        className="h-11 w-full px-4 rounded-xl border border-input bg-background text-xs font-medium focus:border-teal-600 outline-none"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />

                                    <input
                                        type={showPwFields ? "text" : "password"}
                                        placeholder="ផ្ទៀងផ្ទាត់លេខសម្ងាត់ថ្មី (Confirm New Password)"
                                        className="h-11 w-full px-4 rounded-xl border border-input bg-background text-xs font-medium focus:border-teal-600 outline-none"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />

                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword || !currPassword || !newPassword}
                                        className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                                    >
                                        {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={15} />}
                                        <span>ផ្លាស់ប្តូរលេខសម្ងាត់ថ្មី (Change Password)</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ─── TAB 3: BAKONG KHQR GATEWAY ─── */}
                {activeTab === 'bakong' && (
                    <Card className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-xs">
                        <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-800 dark:text-teal-300">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words font-bold text-sm text-foreground sm:text-base">Bakong KHQR Gateway</h3>
                                        <p className="text-xs leading-relaxed text-muted-foreground">Manage NBC Bakong Payment Connection</p>
                                    </div>
                                </div>
                                {bakongInfo?.isConnected && (
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Connected</span>
                                    </div>
                                )}
                            </div>

                            {/* Receiving account — required, otherwise QR generation fails with
                                "Payment system not configured". */}
                            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground">Bakong Receiving Account</p>
                                        <p className="text-xs text-muted-foreground">គណនីទទួលប្រាក់ (Required for KHQR)</p>
                                    </div>
                                    {bakongInfo?.isPaymentReady ? (
                                        <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                                            <CheckCircle2 size={12} className="text-emerald-600" />
                                            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Payment Ready</span>
                                        </div>
                                    ) : (
                                        <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
                                            <AlertTriangle size={12} className="text-amber-600" />
                                            <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Not Ready</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Account ID (name@bank)</label>
                                        <input
                                            type="text"
                                            placeholder="seabkoeurn64@aclb"
                                            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-xs font-mono focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 outline-none transition-all"
                                            value={bakongAccountID}
                                            onChange={(e) => setBakongAccountID(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground">Merchant Name</label>
                                        <input
                                            type="text"
                                            placeholder="MONEO"
                                            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 outline-none transition-all"
                                            value={bakongMerchantName}
                                            onChange={(e) => setBakongMerchantName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBakongAccountSave}
                                    disabled={isSavingBakongAccount || !bakongAccountID.trim()}
                                    className="h-auto min-h-11 w-full whitespace-normal bg-teal-700 px-3 py-2 text-center text-xs font-bold text-white hover:bg-teal-800 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {isSavingBakongAccount ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>កំពុងរក្សាទុក...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>រក្សាទុកគណនីទទួលប្រាក់ (Save Receiving Account)</span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Terminal size={14} className="text-teal-800 dark:text-teal-300" />
                                        <span>API Token (JWT)</span>
                                    </label>
                                    <a
                                        href="https://api-bakong.nbc.gov.kh"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-teal-800 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200 flex items-center gap-1 transition-colors"
                                    >
                                        <span>NBC Portal</span>
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                                <textarea
                                    placeholder="Paste your production JWT token here..."
                                    className="w-full p-4 rounded-xl border border-input bg-background text-xs font-mono focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 outline-none transition-all min-h-[120px] resize-none"
                                    value={bakongManualToken}
                                    onChange={(e) => setBakongManualToken(e.target.value)}
                                />
                                <Button
                                    onClick={handleBakongManualSave}
                                    disabled={isBakongLoading || !bakongManualToken}
                                    className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                                >
                                    {isBakongLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>កំពុងរក្សាទុក...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>រក្សាទុក Bakong Token</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ─── TAB 4: MAINTENANCE (ការថែទាំប្រព័ន្ធ) ─── */}
                {activeTab === 'maintenance' && (
                    <Card className="bg-card border border-border/80 rounded-2xl shadow-xs max-w-2xl">
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        config?.maintenanceMode ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-600"
                                    )}>
                                        <Wrench size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-foreground">ស្ថានភាពប្រព័ន្ធ (System Maintenance)</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {config?.maintenanceMode ? "ប្រព័ន្ធកំពុងបិទថែទាំ (Maintenance Mode Active)" : "ប្រព័ន្ធដំណើរការជាធម្មតា (Online)"}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={config?.maintenanceMode}
                                    onCheckedChange={(val) => handleAutoSave({ maintenanceMode: val })}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {config?.maintenanceMode
                                    ? "រាល់សេវាកម្មទាំងអស់ត្រូវបានផ្អាកបណ្តោះអាសន្នសម្រាប់អតិថិជន។"
                                    : "រាល់សេវាកម្មទាំងអស់ និងការគ្រប់គ្រងរបស់អតិថិជនកំពុងដំណើរការជាធម្មតា។"}
                            </p>

                            <div className="space-y-4 pt-4 border-t border-border/80">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Calendar size={13} className="text-teal-700 dark:text-teal-300" />
                                        <span>{isKm ? "ម៉ោងចាប់ផ្តើមបិទ (Auto-Halt)" : "Maintenance Start"}</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full h-11 px-3 rounded-xl bg-background border border-input text-xs font-medium text-foreground outline-none focus:border-teal-600"
                                        value={config?.maintenanceStart ? new Date(new Date(config.maintenanceStart).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => setConfig({ ...config, maintenanceStart: e.target.value })}
                                        onBlur={(e) => handleAutoSave({ maintenanceStart: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <LayoutGrid size={13} className="text-emerald-500" />
                                        <span>{isKm ? "ម៉ោងបើកវិញ (Auto-Resume)" : "Opening Hour"}</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full h-11 px-3 rounded-xl bg-background border border-input text-xs font-medium text-foreground outline-none focus:border-teal-600"
                                        value={config?.maintenanceEnd ? new Date(new Date(config.maintenanceEnd).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => setConfig({ ...config, maintenanceEnd: e.target.value })}
                                        onBlur={(e) => handleAutoSave({ maintenanceEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ─── TAB 5: AUDIT LOGS (កំណត់ត្រាសវនកម្ម) ─── */}
                {activeTab === 'audit' && (
                    <Card className="bg-card border border-border/80 rounded-2xl shadow-xs">
                        <CardContent className="p-6 sm:p-8">
                            <SecurityAuditFeed />
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
