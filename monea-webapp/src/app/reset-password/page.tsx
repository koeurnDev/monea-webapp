import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { m, AnimatePresence } from 'framer-motion';
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
import { useTranslation } from "@/i18n/LanguageProvider";
import { AUTH_URLS } from "@/lib/constants";
import { moneaClient } from "@/lib/api-client";

function ResetPasswordForm() {
    const { t } = useTranslation();
    const router = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const emailFromUrl = searchParams.get("email");
    const emailFromState = typeof location.state === "object" && location.state !== null &&
        "email" in location.state && typeof location.state.email === "string"
        ? location.state.email
        : "";
    const email = emailFromUrl || emailFromState;

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const formSchema = z.object({
        password: z.string().min(8, { message: t('common.validation.tooShort') || "Password must be at least 8 characters" }),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('common.auth.passwordMismatched') || "Passwords don't match",
        path: ["confirmPassword"],
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) return;
        
        setError("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            const res = await moneaClient.post<{ message?: string }>("/api/auth/reset-password", {
                token,
                email,
                newPassword: values.password,
            });

            if (!res.error && res.data) {
                setSuccessMessage(res.data.message || "Password reset successfully!");
                setTimeout(() => {
                    router(AUTH_URLS.SIGN_IN);
                }, 3000);
            } else {
                setError(res.error || t('common.errors.unexpected'));
            }
        } catch (e) {
            setError(t('common.errors.technical'));
        } finally {
            setIsLoading(false);
        }
    }

    if (!token && !error) {
        return <div className="text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="text-center mb-8">
                <Link to="/" className="inline-flex justify-center">
                    <MoneaLogo showText size="md" />
                </Link>
                <h1 className="mt-4 mb-2 text-2xl font-bold text-foreground font-kantumruy">{t('common.auth.resetPasswordTitle') || "Reset Password"}</h1>
                <p className="text-xs text-muted-foreground font-kantumruy">{t('common.auth.resetPasswordSubtitle') || "Please enter your new password below."}</p>
            </div>

            {successMessage ? (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-foreground font-bold mb-2">Success!</h3>
                    <p className="text-muted-foreground text-sm mb-6">{successMessage}</p>
                    <p className="text-muted-foreground text-xs">Redirecting to login...</p>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground text-xs uppercase tracking-wider font-bold ml-1">{t('common.auth.newPassword') || "New Password"}</FormLabel>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <KeyRound className="w-5 h-5" />
                                        </div>
                                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-background border-input text-foreground rounded-xl focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 h-11" {...field} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground text-xs uppercase tracking-wider font-bold ml-1">{t('common.auth.confirmNewPassword') || "Confirm New Password"}</FormLabel>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <KeyRound className="w-5 h-5" />
                                        </div>
                                        <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-background border-input text-foreground rounded-xl focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 h-11" {...field} />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs" />
                                </FormItem>
                            )}
                        />

                        <AnimatePresence>
                            {error && (
                                <m.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs text-center font-kantumruy"
                                >
                                    {error}
                                </m.div>
                            )}
                        </AnimatePresence>

                        <Button type="submit" disabled={isLoading || !!error} className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase tracking-wide h-11 border border-primary/20 transition-all mt-6 text-primary-foreground text-sm">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('common.auth.resetButton') || "Reset Password")}
                        </Button>
                    </form>
                </Form>
            )}

            <div className="text-center mt-8">
                <Link to={AUTH_URLS.SIGN_IN} className="font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 text-xs font-kantumruy">
                    <ArrowLeft className="w-3 h-3" /> {t('common.auth.backToSignIn') || "Back to Sign In"}
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full relative flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary py-10">
            {/* Background Image with Overlay */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[15%] h-[50vw] w-[50vw] rounded-full bg-sage/10 blur-[130px]" />
                <div className="absolute -bottom-[15%] -right-[10%] h-[45vw] w-[45vw] rounded-full bg-gold/15 blur-[130px]" />
            </div>

            {/* Content Container */}
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-4 md:p-6"
            >
                <Suspense fallback={<div className="text-center text-muted-foreground p-10"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </m.div>
        </div>
    );
}
