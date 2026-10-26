import { Fragment, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from 'react-router-dom';
import { mutate } from "swr";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarIcon, MapPin, User, Heart, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { moneaClient } from "@/lib/api-client";

const formSchema = z.object({
    eventType: z.enum(["wedding", "anniversary"]),
    groomName: z.string().min(2, "សូមបញ្ចូលឈ្មោះកូនកំលោះ"),
    brideName: z.string().min(2, "សូមបញ្ចូលឈ្មោះកូនក្រមុំ"),
    date: z.date({ message: "សូមជ្រើសរើសកាលបរិច្ឆេទ" }).optional(),
    location: z.string().optional(),
});

type FormValues = {
    eventType: "wedding" | "anniversary";
    groomName: string;
    brideName: string;
    date?: Date;
    location?: string;
};

export default function CreateWeddingPage() {
    const router = useNavigate();
    const { user: authUser, isLoading: authLoading, refetch } = useAuth();
    const [step, setStep] = useState(1);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!authLoading && authUser?.weddingId) {
            router('/dashboard');
        }
    }, [authUser, authLoading, router]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            eventType: "wedding",
            groomName: "",
            brideName: "",
            location: "",
        },
    });

    const { watch, trigger, setValue, formState } = form;
    const formData = watch();
    const step1IsValid = formData.groomName?.trim().length >= 2 && formData.brideName?.trim().length >= 2;
    const step2IsValid = !!formData.date && !Number.isNaN(formData.date.getTime());

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        setValue('date', date, {
            shouldValidate: true,
            shouldDirty: true,
        });
        setCalendarMonth(date);
    };

    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger(["groomName", "brideName"]);
        } else if (step === 2) {
            valid = await trigger(["date"]);
        }

        if (valid) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    async function onSubmit() {
        if (authUser?.weddingId) {
            setSubmitFeedback({
                type: 'error',
                message: 'អ្នកមានកម្មវិធីរួចហើយ។ កំពុងបញ្ជូនអ្នកទៅ Dashboard…',
            });
            setTimeout(() => router('/dashboard'), 800);
            return;
        }

        setIsLoading(true);
        setSubmitFeedback(null);

        // Ensure all fields are valid
        const valid = await trigger();
        if (!valid) {
            setSubmitFeedback({
                type: 'error',
                message: 'សូមបំពេញព័ត៌មានដែលទាមទារដោយខ្នាត។',
            });
            setIsLoading(false);
            return;
        }

        try {
            const res = await moneaClient.post<any>("/api/wedding", formData);

            if (res.status === 200 || res.status === 201) {
                setSubmitFeedback({
                    type: 'success',
                    message: 'បានបង្កើតកម្មវិធីរួចរាល់។',
                });
                await refetch();
                setTimeout(() => router("/dashboard"), 900);
                return;
            }

            if (res.error === "Wedding already exists" || res.status === 409) {
                setSubmitFeedback({
                    type: 'success',
                    message: 'កម្មវិធីនេះមានរួចហើយ។ កំពុងបញ្ជូនអ្នកទៅ Dashboard…',
                });
                await refetch();
                setTimeout(() => router("/dashboard"), 900);
                return;
            }

            setSubmitFeedback({
                type: 'error',
                message: 'បង្កើតមិនបានជោគជ័យ។ សូមព្យាយាមម្ដងទៀត។',
            });
            console.error(`Failed to create wedding: Status ${res.status}`, {
                error: res.error,
                details: res.details,
            });
        } catch (error) {
            setSubmitFeedback({
                type: 'error',
                message: 'មានបញ្ហាក្នុងភ្ជាប់ SERVER ។ សូមព្យាយាមម្ដងទៀត។',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    if (authLoading) {
        return (
            <div className="w-full min-h-[calc(100dvh-5rem)] bg-background flex items-center justify-center p-4 py-8">
                <div className="text-sm text-muted-foreground">កំពុងបញ្ជាក់ស្ថានភាព…</div>
            </div>
        );
    }

    if (authUser?.weddingId) {
        return null;
    }

    return (
        <div className="w-full min-h-[calc(100dvh-5rem)] bg-background flex items-center justify-center p-4 py-8">
            <Card className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border shadow-xl sm:rounded-3xl">
                <CardHeader className={`text-center space-y-1.5 ${step === 2 ? "p-4" : "p-5 sm:p-6"}`}>
                    <div className={`mx-auto bg-accent rounded-full flex items-center justify-center ${step === 2 ? "w-10 h-10 mb-1" : "w-12 h-12 mb-2"}`}>
                        <Heart className={`${step === 2 ? "w-5 h-5" : "w-6 h-6"} text-primary fill-primary`} />
                    </div>
                    <CardTitle className={`${step === 2 ? "text-xl" : "text-2xl"} font-bold font-kantumruy`}>
                        {step === 1 && "សូមបញ្ចូលឈ្មោះ"}
                        {step === 2 && "កាលបរិច្ឆេទ"}
                        {step === 3 && "ទីតាំង"}
                    </CardTitle>
                    <CardDescription>
                        ជំហានទី {step} នៃ 3
                    </CardDescription>
                    <div
                        className={`mx-auto w-full max-w-xs ${step === 2 ? "mt-2" : "mt-3"}`}
                        role="progressbar"
                        aria-label="ដំណើរការបង្កើតកម្មវិធី"
                        aria-valuemin={1}
                        aria-valuemax={3}
                        aria-valuenow={step}
                    >
                        <div className="flex items-center gap-2" aria-hidden="true">
                            {[1, 2, 3].map((stepNumber) => (
                                <Fragment key={stepNumber}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                        stepNumber < step
                                            ? "bg-primary text-primary-foreground"
                                            : stepNumber === step
                                                ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                                                : "bg-muted text-muted-foreground"
                                    }`}>
                                        {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
                                    </div>
                                    {stepNumber < 3 && (
                                        <div className={`h-1 flex-1 rounded-full transition-colors ${stepNumber < step ? "bg-primary" : "bg-muted"}`} />
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-6">
                    {submitFeedback && (
                        <div
                            className={`mb-4 rounded-xl border px-3 py-2 text-sm font-medium ${
                                submitFeedback.type === 'success'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                            }`}
                        >
                            {submitFeedback.message}
                        </div>
                    )}

                    <div className="space-y-5" aria-live="polite">
                        {/* Step 1: Event type + names */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>ប្រភេទកម្មវិធី</Label>
                                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setValue("eventType", "wedding")}
                                            aria-pressed={formData.eventType === "wedding"}
                                            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${formData.eventType === "wedding" ? "bg-red-600 text-white shadow-sm" : "text-muted-foreground hover:bg-background"}`}
                                        >
                                            រៀបការ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue("eventType", "anniversary")}
                                            aria-pressed={formData.eventType === "anniversary"}
                                            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${formData.eventType === "anniversary" ? "bg-red-600 text-white shadow-sm" : "text-muted-foreground hover:bg-background"}`}
                                        >
                                            ភ្ជាប់ពាក្យ
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="create-groom-name">ឈ្មោះកូនកំលោះ</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="create-groom-name"
                                            autoComplete="given-name"
                                            className="pl-10 h-11 text-base bg-background border-border"
                                            placeholder="ឈ្មោះកូនកំលោះ"
                                            value={formData.groomName}
                                            onChange={(e) => setValue("groomName", e.target.value)}
                                        />
                                    </div>
                                    {form.formState.errors.groomName && <p className="text-red-600 text-sm" role="alert">{form.formState.errors.groomName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="create-bride-name">ឈ្មោះកូនក្រមុំ (Bride)</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="create-bride-name"
                                            autoComplete="family-name"
                                            className="pl-10 h-11 text-base bg-background border-border"
                                            placeholder="ឈ្មោះកូនក្រមុំ"
                                            value={formData.brideName}
                                            onChange={(e) => setValue("brideName", e.target.value)}
                                        />
                                    </div>
                                    {form.formState.errors.brideName && <p className="text-red-600 text-sm" role="alert">{form.formState.errors.brideName.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Date */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
                                <Label className="self-start" htmlFor="wedding-date-calendar">ជ្រើសរើសថ្ងៃមង្គល</Label>
                                <Calendar
                                    id="wedding-date-calendar"
                                    mode="single"
                                    selected={formData.date}
                                    month={calendarMonth}
                                    onMonthChange={setCalendarMonth}
                                    onSelect={handleDateSelect}
                                    className="w-full max-w-[400px] justify-center rounded-xl border border-border bg-card p-2 shadow [--cell-size:2rem] sm:[--cell-size:2.25rem]"
                                    classNames={{
                                        months: "relative flex flex-col gap-2 md:flex-row",
                                        month: "flex w-full flex-col gap-2",
                                        week: "mt-1 flex w-full",
                                        day_selected: "bg-red-600 text-white hover:bg-red-600 focus:bg-red-600"
                                    }}
                                />
                                {form.formState.errors.date && <p className="text-red-600 text-sm" role="alert">{form.formState.errors.date.message}</p>}
                            </div>
                        )}

                        {/* Step 3: Location & Finish */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="create-location">ទីតាំង (តំណរភ្ជាប់ Google Maps)</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="create-location"
                                            inputMode="url"
                                            className="pl-10 h-11 bg-background border-border"
                                            placeholder="https://maps.app.goo.gl/..."
                                            value={formData.location}
                                            onChange={(e) => setValue("location", e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground/60">អ្នកអាចដាក់ទីតាំងនៅពេលក្រោយបាន</p>
                                </div>

                                <div className="rounded-lg bg-muted/50 p-4 space-y-3 border border-border">
                                    <h4 className="font-semibold text-foreground">សូមពិនិត្យព័ត៌មាន៖</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                        <span>ប្រភេទ:</span>
                                        <span className="font-medium text-foreground">{formData.eventType === "anniversary" ? "ភ្ជាប់ពាក្យ" : "រៀបការ"}</span>
                                        <span>កូនកំលោះ:</span>
                                        <span className="font-medium text-foreground">{formData.groomName}</span>
                                        <span>កូនក្រមុំ:</span>
                                        <span className="font-medium text-foreground">{formData.brideName}</span>
                                        <span>កាលបរិច្ឆេទ:</span>
                                        <span className="font-medium text-foreground">{formData.date ? format(formData.date, 'dd MMM yyyy') : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
                    {step > 1 ? (
                        <Button type="button" variant="outline" onClick={prevStep} className="min-h-11 flex-1 gap-2">
                            <ArrowLeft className="w-4 h-4" /> ត្រឡប់
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < 3 ? (
                        <Button
                            type="button"
                            onClick={nextStep}
                            disabled={
                                (step === 1 && !step1IsValid) ||
                                (step === 2 && !step2IsValid)
                            }
                            className="min-h-11 flex-1 gap-2 bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            បន្ទាប់ <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button type="button" onClick={onSubmit} disabled={isLoading} className="min-h-11 flex-1 gap-2 bg-red-600 hover:bg-red-700 min-w-[120px]">
                            {isLoading ? "កំពុងបង្កើត..." : "បង្កើត"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
