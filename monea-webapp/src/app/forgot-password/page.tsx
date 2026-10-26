import { lazy, Suspense, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from 'react-router-dom';
import { Mail, MailCheck, Loader2, ChevronLeft } from "lucide-react";
import { motion as m, AnimatePresence } from 'framer-motion';
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { moneaClient } from "@/lib/api-client";

const Turnstile = lazy(() => import("@marsidev/react-turnstile").then(mod => ({ default: mod.Turnstile })));

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTurnstile, setShowTurnstile] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);

    const formSchema = z.object({
        email: z.string().email({ message: t('common.validation.invalidEmail') }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError("");
        setSuccessMessage("");
        setIsLoading(true);
        try {
            const res = await moneaClient.post("/api/auth/forgot-password", {
                email: values.email,
                turnstileToken: turnstileToken || undefined
            });

            if (res.status === 428) {
                setShowTurnstile(true);
                setError(res.error || t('common.auth.completeSecurityCheck', { defaultValue: 'សូមផ្ទៀងផ្ទាត់សុវត្ថិភាព ដើម្បីបន្ត។' }));
            } else if (!res.error) {
                setSuccessMessage(t('common.auth.resetLinkSent', { defaultValue: 'បើមានគណនីភ្ជាប់នឹងអ៊ីមែលនេះ តំណកំណត់ពាក្យសម្ងាត់នឹងត្រូវបានផ្ញើទៅអ៊ីមែល។' }));
            } else {
                setError(res.error || t('common.errors.technical'));
            }
        } catch (e) {
            setError(t('common.errors.technical'));
        } finally {
            setIsLoading(false);
            setTurnstileToken("");
            setTurnstileWidgetKey((key) => key + 1);
        }
    }

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-background via-background to-secondary px-3 py-6 font-kantumruy transition-colors duration-300 sm:px-4">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[15%] h-[50vw] w-[50vw] rounded-full bg-sage/10 blur-[130px]" />
                <div className="absolute -bottom-[15%] -right-[10%] h-[45vw] w-[45vw] rounded-full bg-gold/15 blur-[130px]" />
            </div>

            <div className="z-10 mb-3 flex w-full max-w-[420px] items-center justify-between px-1">
                <Link
                    to={AUTH_URLS.SIGN_IN}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
                >
                    <ChevronLeft size={15} />
                    <span>{t('common.auth.back', { defaultValue: 'ត្រឡប់' })}</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="h-8 w-8 border border-border/80 bg-card text-foreground shadow-xs hover:bg-muted" />
                </div>
            </div>

            <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[420px]"
            >
                <div className="rounded-[28px] border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-2xl sm:p-7">
                    <div className="mb-3 text-center sm:mb-6">
                        <Link to="/" className="mb-3 inline-flex justify-center sm:mb-5">
                            <MoneaLogo showText size="sm" />
                        </Link>
                        <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-accent text-primary shadow-sm sm:mb-4 sm:h-14 sm:w-14">
                            <Mail className="h-4 w-4 sm:h-6 sm:w-6" aria-hidden="true" />
                        </div>
                        <h1 className="text-[22px] font-black leading-tight text-foreground sm:text-[28px]">
                            {t('common.auth.forgotPasswordTitle', { defaultValue: 'ភ្លេចពាក្យសម្ងាត់?' })}
                        </h1>
                        <p className="mx-auto mt-1.5 max-w-[290px] text-xs leading-5 text-muted-foreground sm:mt-2 sm:max-w-[310px] sm:text-sm sm:leading-6">
                            {t('common.auth.forgotPasswordSubtitle', { defaultValue: 'បញ្ចូលអ៊ីមែលគណនី។ បើមានគណនី តំណកំណត់ពាក្យសម្ងាត់នឹងផ្ញើទៅអ៊ីមែលនេះ។' })}
                        </p>
                    </div>

                    {successMessage ? (
                        <m.div
                            role="status"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 text-center sm:space-y-5"
                        >
                            <div className="rounded-2xl border border-emerald-600/15 bg-emerald-600/5 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/5 sm:p-5">
                                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300 sm:h-12 sm:w-12">
                                    <MailCheck className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                                </div>
                                <p className="text-sm font-semibold leading-6 text-emerald-800 dark:text-emerald-200">
                                    {successMessage}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-xs">
                                    {t('common.auth.checkInboxHint', { defaultValue: 'សូមពិនិត្យប្រអប់ទទួល និងថតសារឥតបានការ។' })}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    asChild
                                    className="h-11 flex-1 rounded-xl border border-primary bg-primary text-primary-foreground text-sm font-bold shadow-md transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <Link to={AUTH_URLS.SIGN_IN}>
                                        {t('common.auth.backToSignIn', { defaultValue: 'ត្រឡប់ទៅចូលគណនី' })}
                                    </Link>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSuccessMessage("");
                                        setError("");
                                        setTurnstileToken("");
                                        setTurnstileWidgetKey((key) => key + 1);
                                        form.reset({ email: "" });
                                    }}
                                    className="h-11 flex-1 rounded-xl text-sm font-bold"
                                >
                                    {t('common.auth.useAnotherEmail', { defaultValue: 'ប្រើអ៊ីមែលផ្សេង' })}
                                </Button>
                            </div>
                        </m.div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-sm font-bold text-foreground">
                                                {t('common.auth.emailLabel', { defaultValue: 'អ៊ីមែល' })}
                                            </FormLabel>
                                            <div className="relative group">
                                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                                <Input
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="name@example.com"
                                                    className="h-12 rounded-xl border border-input bg-background pl-11 text-sm text-foreground transition-all focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                                                    {...field}
                                                />
                                            </div>
                                            <FormMessage className="text-xs text-rose-600" />
                                        </FormItem>
                                    )}
                                />

                                {showTurnstile && import.meta.env.VITE_TURNSTILE_SITE_KEY ? (
                                    <div className="flex min-h-[66px] w-full items-center justify-center rounded-xl border border-border/70 bg-muted/20 px-2 py-1">
                                        <Suspense fallback={<div className="h-[58px] w-full animate-pulse rounded-lg bg-muted" />}>
                                            <Turnstile
                                                key={turnstileWidgetKey}
                                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                                onSuccess={(token: string) => setTurnstileToken(token)}
                                                options={{ theme: 'auto', appearance: 'always', action: "forgot_password" }}
                                            />
                                        </Suspense>
                                    </div>
                                ) : showTurnstile ? (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
                                        {t('common.auth.verificationUnavailable', { defaultValue: 'ការផ្ទៀងផ្ទាត់សុវត្ថិភាពមិនទាន់រួចរាល់ទេ។' })}
                                    </div>
                                ) : null}

                                <AnimatePresence>
                                    {error && (
                                        <m.div
                                            role="alert"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-semibold text-rose-700 dark:text-rose-300"
                                        >
                                            {error}
                                        </m.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    disabled={isLoading || (showTurnstile && (!import.meta.env.VITE_TURNSTILE_SITE_KEY || !turnstileToken))}
                                    className="min-h-12 h-auto w-full whitespace-normal rounded-xl border border-primary bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t('common.auth.sending', { defaultValue: 'កំពុងផ្ញើ...' })}
                                        </span>
                                    ) : (
                                        t('common.auth.sendResetLink', { defaultValue: 'ផ្ញើតំណកំណត់ពាក្យសម្ងាត់' })
                                    )}
                                </Button>

                                <p className="text-center text-xs leading-5 text-muted-foreground">
                                    {t('common.auth.resetLinkPrivacyHint', { defaultValue: 'ដើម្បីការពារគណនី យើងមិនបញ្ជាក់ថាអ៊ីមែលណាមួយមានគណនីទេ។' })}
                                </p>
                            </form>
                        </Form>
                    )}
                </div>
            </m.div>
        </div>
    );
}
