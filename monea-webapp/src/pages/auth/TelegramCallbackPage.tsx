import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { moneaClient } from "@/lib/api-client";

const VERIFIER_STORAGE_KEY = "telegram_oidc_verifier";

export default function TelegramCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const finishLogin = async () => {
            const providerError = searchParams.get("error");
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
            window.history.replaceState(null, "", window.location.pathname);

            if (providerError || !code || !state || !verifier) {
                sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
                setError("ការភ្ជាប់ Telegram មិនបានសម្រេចទេ។ សូមព្យាយាមម្ដងទៀត។");
                return;
            }

            try {
                const response = await moneaClient.post<{
                    code?: string;
                    linked?: boolean;
                    ownerMfaSetupRequired?: boolean;
                }>("/api/auth/sso/telegram/callback", { code, state, verifier });
                if (response.error || !response.data) {
                    if (response.code === "TWO_FACTOR_REQUIRED") {
                        throw new Error(response.code);
                    }
                    throw new Error(response.error || "Telegram sign-in failed");
                }

                sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
                if (response.data.ownerMfaSetupRequired) {
                    navigate("/sign-in?error=owner_mfa_setup_required", { replace: true });
                    return;
                }
                if (response.data.linked) {
                    navigate("/dashboard/account?telegramLinked=1", { replace: true });
                    return;
                }
                if (response.data.code) {
                    window.location.replace(`/auth/callback?code=${encodeURIComponent(response.data.code)}`);
                    return;
                }
                throw new Error("Telegram sign-in response was incomplete");
            } catch (callbackError) {
                console.error("[Telegram OIDC Callback] Failed to finish:", callbackError);
                sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
                setError(callbackError instanceof Error && callbackError.message === "TWO_FACTOR_REQUIRED"
                    ? "គណនីនេះបានបើក 2FA។ សូមចូលដោយអ៊ីមែល ពាក្យសម្ងាត់ និងលេខកូដ Authenticator។"
                    : "មិនអាចបញ្ចប់ការចូលតាម Telegram បានទេ។ សូមសាកល្បងម្ដងទៀត។");
            }
        };

        void finishLogin();
    }, [navigate, searchParams]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="space-y-4 text-center">
                {error ? (
                    <>
                        <p role="alert" className="font-kantumruy text-rose-600">{error}</p>
                        <button
                            type="button"
                            onClick={() => navigate("/sign-in", { replace: true })}
                            className="font-kantumruy text-sm font-bold text-rose-600 underline"
                        >
                            ត្រឡប់ទៅចូលគណនី
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
                        <p className="font-kantumruy text-muted-foreground">កំពុងផ្ទៀងផ្ទាត់ Telegram...</p>
                    </>
                )}
            </div>
        </main>
    );
}
