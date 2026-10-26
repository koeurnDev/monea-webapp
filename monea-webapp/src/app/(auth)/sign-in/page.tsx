"use client";

import React, { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
    Mail, 
    Lock, 
    ChevronLeft, 
    Loader2, 
    Eye, 
    EyeOff, 
    Key
} from "lucide-react";
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
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { ROLES, AUTH_URLS } from "@/lib/constants";
import { khmerToEnglishNumbers } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Turnstile } from "@marsidev/react-turnstile";
import { moneaClient } from "@/lib/api-client";
import SSOIcons from "@/components/auth/SSOIcons";
import { motion as m, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import type { AuthUser } from "@/types/auth";
import { getPostLoginPath } from "@/lib/auth-navigation";

export default function SignInPage() {
    const { user, isLoading: authLoading, refetch, setAuthenticatedUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { t, locale } = useTranslation();
    const isKm = locale === 'km';
    const [searchParams] = useSearchParams();
    
    // Auto redirect if already authenticated
    useEffect(() => {
        if (!authLoading && user) {
            navigate(getPostLoginPath(user.role === ROLES.PLATFORM_OWNER, location.state?.from, window.location.origin), { replace: true });
        }
    }, [user, authLoading, location.state, navigate]);

    const [error, setError] = useState("");
    const [canRestoreAccount, setCanRestoreAccount] = useState(false);
    const [isRestoringAccount, setIsRestoringAccount] = useState(false);
    const [accountRestoreMessage, setAccountRestoreMessage] = useState("");
    const [verificationEmail, setVerificationEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [captchaState, setCaptchaState] = useState<"loading" | "ready" | "error" | "expired">("ready");
    const [captchaWidgetKey, setCaptchaWidgetKey] = useState(0);
    const [twoFactorToken, setTwoFactorToken] = useState("");
    const [ownerMfaSetup, setOwnerMfaSetup] = useState<{
        qrCodeDataUrl: string;
        secret: string;
        recoveryCodes: string[];
    } | null>(null);
    const ownerMfaSetupAttemptedRef = useRef(false);
    const [ownerMfaToken, setOwnerMfaToken] = useState("");
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    const hint = searchParams.get('hint');
    const registered = searchParams.get('registered');
    const authError = searchParams.get('error');

    const loadOwnerMfaSetup = useCallback(async () => {
        if (ownerMfaSetupAttemptedRef.current) return;
        ownerMfaSetupAttemptedRef.current = true;
        console.log('[SignIn] loadOwnerMfaSetup called');
        setError("");
        try {
            const response = await moneaClient.post<{
                qrCodeDataUrl: string;
                secret: string;
                recoveryCodes: string[];
            }>("/api/auth/2fa/setup", {});
            console.log('[SignIn] 2FA setup response:', { 
                error: response.error, 
                status: response.status,
                hasData: !!response.data 
            });
            if (response.error || !response.data?.qrCodeDataUrl || !response.data.secret ||
                !Array.isArray(response.data.recoveryCodes)) {
                setError(response.error || (isKm
                    ? "មិនអាចចាប់ផ្ដើមការកំណត់ 2FA បានទេ។ សូមចូលម្ដងទៀត។"
                    : "Could not start 2FA setup. Please sign in again."));
                return;
            }
            console.log('[SignIn] 2FA setup data received successfully');
            setOwnerMfaSetup(response.data);
            setOwnerMfaToken("");
            setShow2FA(false);
            setShowCaptcha(false);
        } catch (err) {
            console.error('[SignIn] loadOwnerMfaSetup error:', err);
            setError(isKm
                ? "មិនអាចចាប់ផ្ដើមការកំណត់ 2FA បានទេ។ សូមចូលម្ដងទៀត។"
                : "Could not start 2FA setup. Please sign in again.");
        }
    }, [isKm]);

    useEffect(() => {
        if (authError === "network_error") {
            setError(t("common.errors.network"));
        } else if (authError === "owner_mfa_setup_required") {
            void loadOwnerMfaSetup();
        } else if (authError === "two_factor_required") {
            setError(isKm
                ? "គណនីនេះបានបើក 2FA។ សូមចូលដោយអ៊ីមែល ពាក្យសម្ងាត់ និងលេខកូដ Authenticator។"
                : "Two-factor authentication is enabled for this account. Sign in with your email, password, and authenticator code.");
        }
    }, [authError, isKm, loadOwnerMfaSetup, t]);

    // Listen for 2FA setup event from useAuth (when /api/auth/me returns 428)
    useEffect(() => {
        const handle2FASetupRequired = () => {
            console.log('[SignIn] Received monea:2fa-setup-required event');
            void loadOwnerMfaSetup();
        };

        window.addEventListener('monea:2fa-setup-required', handle2FASetupRequired);
        return () => {
            window.removeEventListener('monea:2fa-setup-required', handle2FASetupRequired);
        };
    }, [loadOwnerMfaSetup]);

    function retryCaptcha() {
        setCaptchaToken("");
        setCaptchaState("loading");
        setCaptchaWidgetKey((key) => key + 1);
    }

    const loginSchema = z.object({
        email: z.string().email({ message: "សូមបញ្ចូលអ៊ីមែលឱ្យបានត្រឹមត្រូវ" }),
        password: z.string().min(6, { message: "ពាក្យសម្ងាត់យ៉ាងតិច ៦ តួអក្សរ" }),
    });

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        if (ownerMfaSetup) {
            await verifyOwnerMfaSetup();
            return;
        }

        if (showCaptcha && turnstileSiteKey && !captchaToken) {
            return;
        }

        setError("");
        setCanRestoreAccount(false);
        setAccountRestoreMessage("");
        setVerificationEmail("");
        setIsLoading(true);
        const turnstileToken = captchaToken;
        try {
            const body = {
                ...values,
                turnstileToken: turnstileToken || undefined,
                twoFactorToken: show2FA ? twoFactorToken : undefined
            };
            const res = await moneaClient.post<{
                user?: { id: string; email: string; role: string };
                token?: string;  // ← Token in response body
                require2FA?: boolean;
                requireOwnerMfaSetup?: boolean;
                requireCaptcha?: boolean;
            }>("/api/auth/signin", body);
            const data = res.data;

            if (!res.error && data?.user?.id && data.user.email && data.user.role) {
                // ✅ Token received - store in sessionStorage as fallback
                if (data.token) {
                    try {
                        sessionStorage.setItem('auth_token', data.token);
                        console.log('[SignIn] Token stored in sessionStorage');
                    } catch (e) {
                        console.warn('[SignIn] Could not store token in sessionStorage:', e);
                    }
                }
                
                const signedInUser: AuthUser = {
                    id: data.user.id,
                    userId: data.user.id,
                    email: data.user.email,
                    name: null,
                    role: data.user.role,
                    type: data.user.role === ROLES.EVENT_STAFF
                        ? "staff"
                        : data.user.role === ROLES.PLATFORM_OWNER
                            ? "admin"
                            : "user",
                };
                setAuthenticatedUser(signedInUser);
                void refetch({ silent: true });
                navigate(getPostLoginPath(signedInUser.role === ROLES.PLATFORM_OWNER, location.state?.from, window.location.origin), { replace: true });
                return;
            }

            if (data?.require2FA) {
                setTwoFactorToken("");
                setUseRecoveryCode(false);
                setShow2FA(true);
                return;
            }

            if (data?.requireOwnerMfaSetup) {
                await loadOwnerMfaSetup();
                return;
            }

            if (res.status === 428) {
                setShowCaptcha(true);
                setCaptchaState("loading");
                setError(res.error || (isKm ? "សូមផ្ទៀងផ្ទាត់សុវត្ថិភាព ដើម្បីបន្ត។" : "Complete the security check to continue."));
                return;
            }

            if (res.error) {
                setError(res.error);
                setCanRestoreAccount(res.code === "ACCOUNT_PENDING_DELETION");
                if (res.code === "EMAIL_VERIFICATION_REQUIRED") {
                    setVerificationEmail(values.email.trim().toLowerCase());
                }
            } else if (!data?.user) {
                setError(isKm
                    ? "ការចូលគណនីមិនបានបញ្ចប់ទេ។ សូមព្យាយាមម្ដងទៀត។"
                    : "Sign-in could not be completed. Please try again.");
            }
        } catch (e: any) {
            console.error("[SignIn] Request failed:", e);
            setError("សូមពិនិត្យសេវាអ៊ីនធឺណិតរបស់អ្នក ហើយព្យាយាមម្ដងទៀត។");
        } finally {
            setIsLoading(false);
            if (turnstileSiteKey && showCaptcha) retryCaptcha();
        }
    }

    function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
        if (ownerMfaSetup) {
            event.preventDefault();
            void verifyOwnerMfaSetup();
            return;
        }
        void form.handleSubmit(onSubmit)(event);
    }

    async function verifyOwnerMfaSetup() {
        if (ownerMfaToken.length !== 6 || isLoading) return;

        console.log('[SignIn] verifyOwnerMfaSetup called with token:', ownerMfaToken);
        setError("");
        setIsLoading(true);
        try {
            const response = await moneaClient.post<{
                success: boolean;
                user?: { id: string; email: string; role: string };
            }>("/api/auth/2fa/verify", { token: ownerMfaToken });
            console.log('[SignIn] 2FA verify response:', {
                error: response.error,
                status: response.status,
                success: response.data?.success,
                hasUser: !!response.data?.user
            });
            const signedInUser = response.data?.user;
            if (response.error || !response.data?.success || !signedInUser?.id ||
                !signedInUser.email || !signedInUser.role) {
                console.error('[SignIn] 2FA verify failed:', response.error);
                setError(response.error || (isKm
                    ? "លេខកូដមិនត្រឹមត្រូវ។ សូមពិនិត្យ Authenticator ហើយសាកល្បងម្ដងទៀត។"
                    : "The code is invalid. Check your authenticator and try again."));
                return;
            }

            const authenticatedUser: AuthUser = {
                id: signedInUser.id,
                userId: signedInUser.id,
                email: signedInUser.email,
                name: null,
                role: signedInUser.role,
                type: signedInUser.role === ROLES.PLATFORM_OWNER ? "admin" : "user",
            };
            setAuthenticatedUser(authenticatedUser);
            void refetch({ silent: true });
            navigate(getPostLoginPath(true, location.state?.from, window.location.origin), { replace: true });
        } catch (verificationError) {
            console.error("[SignIn] Owner MFA setup verification failed:", verificationError);
            setError(isKm
                ? "មិនអាចផ្ទៀងផ្ទាត់លេខកូដបានទេ។ សូមព្យាយាមម្ដងទៀត។"
                : "Could not verify the code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function restoreAccount() {
        const { email, password } = form.getValues();
        if (!email || !password || isRestoringAccount) return;

        setIsRestoringAccount(true);
        setError("");
        setAccountRestoreMessage("");
        try {
            const response = await moneaClient.post<{ success: boolean; message?: string }>(
                "/api/user/account/restore",
                { email, password },
            );
            if (response.error || !response.data?.success) {
                setError(response.error || (isKm ? "មិនអាចស្ដារគណនីបានទេ។" : "Could not restore the account."));
                return;
            }

            setCanRestoreAccount(false);
            setAccountRestoreMessage(isKm
                ? "បានស្ដារគណនីរួចហើយ។ សូមចូលគណនីម្ដងទៀត។"
                : "Account restored. Please sign in again.");
        } catch (restoreError) {
            console.error("[SignIn] Account recovery failed:", restoreError);
            setError("សូមពិនិត្យសេវាអ៊ីនធឺណិតរបស់អ្នក ហើយព្យាយាមម្ដងទៀត។");
        } finally {
            setIsRestoringAccount(false);
        }
    }

    return (
        <div className="relative w-full min-h-[100dvh] flex flex-col font-kantumruy bg-gradient-to-br from-background via-background to-secondary items-center justify-center py-4 px-3 sm:px-4 overflow-x-hidden transition-colors duration-300">
            {/* Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-sage/10 blur-[130px]" />
                <div className="absolute -bottom-[15%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-gold/15 blur-[130px]" />
            </div>

            {/* Top Bar Navigation */}
            <div className="w-full max-w-[420px] flex items-center justify-between mb-3 px-1">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
                >
                    <ChevronLeft size={15} />
                    <span>{isKm ? "ទំព័រដើម" : "Home"}</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="h-8 w-8 border border-border/80 bg-card text-foreground shadow-xs hover:bg-muted" />
                </div>
            </div>

            {/* Auth Card (Ultra-Compact) */}
            <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full max-w-[420px]"
            >
                <div className="rounded-[28px] border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
                    
                    {/* Header */}
                    <div className="mb-4 text-center">
                        <Link to="/" className="mb-2 inline-flex justify-center">
                            <MoneaLogo showText size="sm" />
                        </Link>
                        <h1 className="text-xl font-black text-foreground font-kantumruy sm:text-2xl">
                            {isKm ? "ចូលគណនី" : "Sign In"}
                        </h1>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {isKm ? "ប្រើអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នកដើម្បីបន្ត" : "Use your email and password to continue"}
                        </p>
                    </div>

                    {/* Hint Banners */}
                    {hint === 'check-email' && (
                        <div className="mb-3 p-2.5 rounded-xl bg-accent border border-border text-accent-foreground text-xs text-center font-bold">
                            📧 {isKm ? "ប្រសិនបើ Email នេះធ្លាប់ចុះឈ្មោះរួចហើយ សូមចូលប្រើដោយផ្ទាល់" : "If registered, sign in directly"}
                        </div>
                    )}
                    {registered === 'true' && (
                        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs text-center font-bold">
                            ✅ {isKm ? "បានចុះឈ្មោះជោគជ័យ! អ្នកអាចចូលប្រើបានហើយ" : "Registration successful! Sign in now"}
                        </div>
                    )}

                    {/* Email / Password Form */}
                    <Form {...form}>
                        <form onSubmit={handleFormSubmit} className="space-y-3">
                            <AnimatePresence mode="wait">
                                {ownerMfaSetup ? (
                                    <m.div
                                        key="owner-mfa-setup"
                                        initial={{ opacity: 0, x: 15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -15 }}
                                        className="space-y-3 py-1"
                                    >
                                        <div className="space-y-1 text-center">
                                            <h3 className="text-foreground font-bold text-sm font-kantumruy">
                                                {isKm ? "កំណត់ 2FA សម្រាប់ Platform Owner" : "Set up Platform Owner 2FA"}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {isKm
                                                    ? "ស្កេន QR code ដោយប្រើកម្មវិធី Authenticator រួចបញ្ចូលលេខកូដ ៦ ខ្ទង់។"
                                                    : "Scan the QR code with an authenticator app, then enter its six-digit code."}
                                            </p>
                                        </div>
                                        <img
                                            src={ownerMfaSetup.qrCodeDataUrl}
                                            alt={isKm ? "កូដ QR សម្រាប់ 2FA" : "2FA setup QR code"}
                                            className="mx-auto h-48 w-48 rounded-xl border bg-white p-2"
                                        />
                                        <div className="rounded-lg bg-muted p-2 text-center">
                                            <p className="mb-1 text-xs text-muted-foreground">
                                                {isKm ? "ឬបញ្ចូលកូនសោដោយដៃ" : "Or enter this setup key manually"}
                                            </p>
                                            <code className="select-all break-all text-sm font-bold">{ownerMfaSetup.secret}</code>
                                        </div>
                                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                                            <p className="mb-1 text-xs font-bold text-amber-800 dark:text-amber-200">
                                                {isKm
                                                    ? "រក្សាទុក Recovery Codes នៅកន្លែងមានសុវត្ថិភាព"
                                                    : "Save these recovery codes somewhere safe"}
                                            </p>
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs">
                                                {ownerMfaSetup.recoveryCodes.map((code) => (
                                                    <code key={code}>{code}</code>
                                                ))}
                                            </div>
                                        </div>
                                        <Input
                                            value={ownerMfaToken}
                                            onChange={(event) => setOwnerMfaToken(
                                                khmerToEnglishNumbers(event.target.value).replace(/[^0-9]/g, "").slice(0, 6)
                                            )}
                                            placeholder="000000"
                                            autoComplete="one-time-code"
                                            className="h-11 text-center font-mono text-lg font-bold tracking-[0.3em]"
                                            maxLength={6}
                                            inputMode="numeric"
                                        />
                                    </m.div>
                                ) : !show2FA ? (
                                    <m.div
                                        key="password-step"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-3"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-foreground text-xs font-bold font-kantumruy">
                                                        {isKm ? "អ៊ីមែល" : "Email"}
                                                    </FormLabel>
                                                    <div className="relative group">
                                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                                                            <Mail size={16} />
                                                        </div>
                                                        <Input
                                                            placeholder="name@example.com"
                                                            autoComplete="email"
                                                            className="h-11 pl-11 bg-background border border-input text-foreground rounded-xl focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 text-sm font-mono transition-all"
                                                            {...field}
                                                        />
                                                    </div>
                                                    <FormMessage className="text-rose-600 text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <FormLabel className="text-foreground text-xs font-bold font-kantumruy">
                                                            {isKm ? "ពាក្យសម្ងាត់" : "Password"}
                                                        </FormLabel>
                                                        <Link to="/forgot-password" className="text-xs text-primary hover:underline font-bold font-kantumruy">
                                                            {isKm ? "ភ្លេចពាក្យសម្ងាត់?" : "Forgot?"}
                                                        </Link>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                                                            <Lock size={16} />
                                                        </div>
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            autoComplete="current-password"
                                                            className="h-11 pl-11 pr-11 bg-background border border-input text-foreground rounded-xl focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 text-sm transition-all"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-90 transition-all p-1 z-10"
                                                            aria-label="Toggle password visibility"
                                                        >
                                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                    <FormMessage className="text-rose-600 text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </m.div>
                                ) : (
                                    <m.div
                                        key="2fa-step"
                                        initial={{ opacity: 0, x: 15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -15 }}
                                        className="space-y-3 py-1"
                                    >
                                        <div className="text-center space-y-1 mb-1.5">
                                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mx-auto mb-1 text-accent-foreground">
                                                <Key size={18} />
                                            </div>
                                            <h3 className="text-foreground font-bold text-sm font-kantumruy">
                                                {isKm ? "ផ្ទៀងផ្ទាត់ ២ ដំណាក់ (2FA)" : "Two-Factor Auth"}
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary pointer-events-none z-10">
                                                    <Lock size={16} />
                                                </div>
                                                <Input
                                                    value={twoFactorToken}
                                                    onChange={(e) => {
                                                        const input = khmerToEnglishNumbers(e.target.value);
                                                        const val = useRecoveryCode
                                                            ? input.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 10)
                                                            : input.replace(/[^0-9]/g, "").slice(0, 6);
                                                        setTwoFactorToken(val);
                                                    }}
                                                    placeholder={useRecoveryCode ? "A1B2C3D4E5" : "000000"}
                                                    autoComplete="one-time-code"
                                                    className="pl-11 text-center text-lg font-bold tracking-[0.3em] bg-background border border-input text-foreground rounded-xl focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 h-11 font-mono"
                                                    maxLength={useRecoveryCode ? 10 : 6}
                                                    autoFocus
                                                    inputMode={useRecoveryCode ? "text" : "numeric"}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTwoFactorToken("");
                                                    setUseRecoveryCode((enabled) => !enabled);
                                                }}
                                                className="w-full text-xs font-bold text-primary hover:underline"
                                            >
                                                {useRecoveryCode
                                                    ? (isKm ? "ប្រើលេខកូដ Authenticator" : "Use authenticator code")
                                                    : (isKm ? "ប្រើ Recovery Code" : "Use a recovery code")}
                                            </button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setShow2FA(false);
                                                    setTwoFactorToken("");
                                                    setUseRecoveryCode(false);
                                                }}
                                                className="w-full text-muted-foreground hover:text-foreground text-xs h-8 active:scale-95 transition-transform font-kantumruy"
                                            >
                                                {isKm ? "← ត្រឡប់ទៅវាយពាក្យសម្ងាត់" : "← Back to password"}
                                            </Button>
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            {/* Cloudflare Turnstile */}
                            {turnstileSiteKey && showCaptcha && (
                                <div className="flex justify-center items-center py-0.5 min-h-[58px] w-full">
                                    <Turnstile
                                        key={captchaWidgetKey}
                                        siteKey={turnstileSiteKey}
                                        onSuccess={(token: string) => {
                                            setCaptchaToken(token);
                                            setCaptchaState("ready");
                                        }}
                                        onError={() => {
                                            setCaptchaToken("");
                                            setCaptchaState("error");
                                        }}
                                        onExpire={() => {
                                            setCaptchaToken("");
                                            setCaptchaState("expired");
                                        }}
                                        options={{ theme: 'auto', appearance: 'always', action: "signin" }}
                                    />
                                </div>
                            )}

                            {turnstileSiteKey && showCaptcha && captchaState !== "ready" && (
                                <div
                                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span>
                                        {captchaState === "loading"
                                            ? (isKm ? "កំពុងផ្ទៀងផ្ទាត់សុវត្ថិភាព…" : "Loading security verification…")
                                            : captchaState === "expired"
                                                ? (isKm ? "ការផ្ទៀងផ្ទាត់បានផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។" : "Verification expired. Please try again.")
                                                : (isKm ? "មិនអាចផ្ទុកការផ្ទៀងផ្ទាត់បានទេ។ សូមពិនិត្យការតភ្ជាប់ រួចព្យាយាមម្ដងទៀត។" : "Security verification failed to load. Check your connection and retry.")}
                                    </span>
                                    {captchaState !== "loading" && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={retryCaptcha}
                                            className="h-8 shrink-0 border-amber-600/30 px-3 text-amber-900 dark:text-amber-100"
                                        >
                                            {isKm ? "ព្យាយាមម្ដងទៀត" : "Retry"}
                                        </Button>
                                    )}
                                    {showCaptcha && !turnstileSiteKey && (
                                        <p role="alert" className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                                            {isKm ? "មិនអាចផ្ទុកការផ្ទៀងផ្ទាត់សុវត្ថិភាពបានទេ។ សូមទាក់ទងជំនួយ។" : "Security verification is unavailable. Please contact support."}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Error Alert */}
                            <AnimatePresence>
                                {error && (
                                    <m.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        role="alert"
                                        aria-live="assertive"
                                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-center font-bold font-kantumruy"
                                    >
                                        {error}
                                    </m.div>
                                )}
                            </AnimatePresence>
                            {canRestoreAccount && (
                                <Button
                                    type="button"
                                    onClick={restoreAccount}
                                    disabled={isRestoringAccount || isLoading}
                                    variant="outline"
                                    className="w-full border-primary/30 text-primary hover:bg-accent"
                                >
                                    {isRestoringAccount
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : isKm ? "ស្ដារគណនីរបស់ខ្ញុំ" : "Restore my account"}
                                </Button>
                            )}
                            {accountRestoreMessage && (
                                <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    {accountRestoreMessage}
                                </p>
                            )}
                            {verificationEmail && (
                                <Link
                                    to={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
                                    className="block text-center text-xs font-bold text-primary underline underline-offset-4"
                                >
                                    {isKm ? "ផ្ទៀងផ្ទាត់អ៊ីមែល ឬផ្ញើតំណថ្មី" : "Verify your email or resend the link"}
                                </Link>
                            )}

                            {/* Primary Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={isLoading || (showCaptcha && (!turnstileSiteKey || !captchaToken)) ||
                                    (ownerMfaSetup !== null && ownerMfaToken.length !== 6) ||
                                    (show2FA && twoFactorToken.length !== (useRecoveryCode ? 10 : 6))}
                                className="w-full min-h-12 h-auto whitespace-normal px-4 py-3 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 font-bold rounded-xl shadow-lg shadow-primary/15 transition-all text-sm font-kantumruy mt-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <span className="text-center leading-snug">
                                        {ownerMfaSetup
                                            ? (isKm ? "បើក 2FA និងបន្ត" : "Enable 2FA and continue")
                                            : (isKm ? "ចូលគណនី" : "Sign In")}
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>

                    {/* Divider */}
                    {!ownerMfaSetup && (
                        <>
                            <div className="relative my-3.5 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/60" />
                                </div>
                                <span className="relative bg-card px-2.5 text-xs text-muted-foreground font-kantumruy">
                                    {isKm ? "ឬ" : "or"}
                                </span>
                            </div>

                            {/* Social Logins */}
                            <div className="w-full">
                                <SSOIcons />
                            </div>
                        </>
                    )}

                    {/* Footer Switch Link */}
                    {!ownerMfaSetup && (
                        <div className="mt-3.5 border-t border-border/60 pt-3 text-center">
                            <p className="text-xs text-muted-foreground font-kantumruy">
                                {isKm ? "មិនទាន់មានគណនីទេ?" : "Need an account?"}{" "}
                                <Link
                                    to={AUTH_URLS.SIGN_UP}
                                    className="ml-1 font-bold text-primary hover:underline"
                                >
                                    {isKm ? "ចុះឈ្មោះ" : "Create one"}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </m.div>
        </div>
    );
}
