import * as React from "react";
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardSidebar } from "./DashboardSidebar";
import { BroadcastBanner } from "./BroadcastBanner";
import { NotificationBell } from "./NotificationBell";
import MobileBottomNav from "./MobileBottomNav";
import { InstallAppPrompt } from "./InstallAppPrompt";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";

import { cn } from "@/lib/utils";
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Settings, LogOut, LifeBuoy, ShieldCheck, Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { useTranslation } from "@/i18n/LanguageProvider";

interface DashboardShellProps {
    children: React.ReactNode;
    isStaff: boolean;
    isAdmin: boolean;
}

export function DashboardShell({ children, isStaff, isAdmin }: DashboardShellProps) {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
    const [is2FASetupOpen, setIs2FASetupOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const { pathname } = useLocation();

    React.useEffect(() => {
        setMounted(true);
        try {
            setIsSidebarCollapsed(localStorage.getItem("monea-sidebar-collapsed") === "true");
        } catch {
            // Ignore storage restrictions.
        }
    }, []);

    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Listen for 2FA setup required event
    React.useEffect(() => {
        const handle2FASetupRequired = (event: Event) => {
            const customEvent = event as CustomEvent<{ code?: string; error?: string }>;
            console.log('[DashboardShell] 2FA setup required event received:', customEvent.detail);
            setIs2FASetupOpen(true);
        };
        
        window.addEventListener('monea:2fa-setup-required', handle2FASetupRequired);
        return () => window.removeEventListener('monea:2fa-setup-required', handle2FASetupRequired);
    }, []);

    const toggleSidebar = React.useCallback(() => {
        setIsSidebarCollapsed((collapsed) => {
            const next = !collapsed;
            try {
                localStorage.setItem("monea-sidebar-collapsed", String(next));
            } catch {
                // Ignore storage restrictions.
            }
            return next;
        });
    }, []);

    const router = useNavigate();

    const isDesignPage = pathname?.includes("/dashboard/design");
    const isLivePage = pathname?.includes("/dashboard/gifts/live");

    const handleLogout = async () => {
        try {
            await logout();
        } catch (e) {
            console.error("Logout API failed", e);
            window.location.href = "/sign-in";
        }
    };

    const isEffectiveAdmin = isAdmin || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'PLATFORM_OWNER' || user?.type === 'admin';
    const isCustomer = !isStaff && !isEffectiveAdmin;

    React.useEffect(() => {
        if (!isCustomer || isLivePage) return;

        document.body.classList.add("monea-customer-dashboard");
        return () => document.body.classList.remove("monea-customer-dashboard");
    }, [isCustomer, isLivePage]);

    const memoizedSidebar = React.useMemo(() => (
        <DashboardSidebar
            isStaff={isStaff}
            isAdmin={isEffectiveAdmin}
            isCustomer={isCustomer}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
        />
    ), [isStaff, isEffectiveAdmin, isCustomer, isSidebarCollapsed, toggleSidebar]);

    const userName = user?.name || (user?.email ? user.email.split('@')[0] : "");
    const resolvedTitle = userName || "MONEO User";
    const resolvedSubtitle = user?.email || "MONEO User";
    const avatarUrl = user?.avatar || user?.image || undefined;

    if (isLivePage) {
        return <main className="w-full min-h-[100dvh] relative">{children}</main>;
    }

    return (
        <div className={cn(
            "flex min-h-screen w-full max-w-full overflow-x-clip bg-background font-sans text-foreground print:!bg-white print:!text-black",
            isCustomer && "monea-customer-dashboard"
        )}>
            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden md:flex flex-col fixed h-full z-20 bg-card shadow-sm dark:shadow-none print:hidden border-r border-border/50 transition-[width] duration-200",
                isSidebarCollapsed ? "w-[76px]" : "w-[280px]"
            )}>
                {memoizedSidebar}
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 min-w-0 max-w-full overflow-x-clip flex flex-col min-h-screen relative print:ml-0 print:m-0 print:p-0 transition-[margin] duration-200",
                isSidebarCollapsed ? "md:ml-[76px]" : "md:ml-[280px]",
                isDesignPage && "p-0 h-[100dvh] overflow-hidden"
            )}>
                {/* Unified Header */}
                {!isDesignPage && (
                    <header className={cn(
                        "h-[58px] md:h-20 sticky top-0 z-30 flex items-center px-3 sm:px-6 md:px-10 print:hidden transition-all duration-300",
                        "bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm"
                    )}>
                        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("dashboard.nav.menu", { defaultValue: "ម៉ឺនុយ" })}
                                    className="md:hidden -ml-2 h-11 w-11 text-muted-foreground hover:text-foreground active:scale-95 transition-transform p-2"
                                    onClick={() => setIsMobileMenuOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>

                                <Link to="/dashboard/account" className="hidden md:flex group items-center gap-3 outline-none transition-opacity focus-visible:opacity-80 active:scale-95 duration-200">
                                    <Avatar className="w-10 h-10 rounded-2xl bg-muted/30 group-hover:bg-primary/5 transition-all shadow-sm border-none">
                                        {avatarUrl ? (
                                            <AvatarImage src={avatarUrl} alt="User" />
                                        ) : null}
                                        <AvatarFallback className="bg-transparent text-muted-foreground group-hover:text-primary">
                                            <User className="w-5 h-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden sm:flex flex-col items-start">
                                        <span className="text-sm font-black text-foreground font-kantumruy leading-none group-hover:text-primary transition-colors">
                                            {!mounted ? t("common.loading.fetching") : resolvedTitle}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-bold tracking-[0.1em] uppercase mt-1.5 opacity-60">
                                            {!mounted ? "MONEO User" : resolvedSubtitle}
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            <div aria-hidden="true" className="md:hidden flex min-w-0 flex-1 items-center justify-center overflow-hidden">
                                <MoneaLogo showText size="sm" />
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5 md:gap-4">
                                <div className="hidden md:flex items-center gap-4">
                                    <ThemeToggle />
                                </div>
                                <NotificationBell isAuthenticated={!!user} />
                                <Link
                                    to="/dashboard/account"
                                    aria-label={t("dashboard.nav.account", { defaultValue: "គណនី និងប្រវត្តិរូប" })}
                                    className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground transition-transform hover:text-foreground active:scale-95"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="User" className="h-8 w-8 rounded-lg object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-primary" />
                                    )}
                                </Link>
                            </div>
                        </div>
                    </header>
                )}

                {/* Mobile Hidden Sheet */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetContent side="left" className="p-0 bg-card w-72 z-[60] border-none print:hidden">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Mobile navigation menu for accessing dashboard sections.</SheetDescription>
                        <DashboardSidebar
                            isStaff={isStaff}
                            isAdmin={isEffectiveAdmin}
                            isCustomer={isCustomer}
                            onCloseMobile={() => setIsMobileMenuOpen(false)}
                        />
                    </SheetContent>
                </Sheet>

                {/* Content Container */}
                <div className={cn(
                    "dashboard-mobile-content w-full print:p-0 print:max-w-none",
                    !isDesignPage && "max-w-7xl mx-auto px-3 sm:px-6 md:px-10 py-3 sm:py-5 md:py-8 pb-[6.5rem] md:pb-12",
                    isDesignPage && "p-0 m-0 max-w-none h-full flex flex-col"
                )}>
                    {!isDesignPage && <InstallAppPrompt />}
                    {!isDesignPage && <div className="print:hidden"><BroadcastBanner isAuthenticated={!!user} /></div>}
                    {children}
                </div>

            </main>

            {/* Mobile Bottom Navigation — outside <main> so fixed positioning is relative to viewport, not scroll container */}
            {!isDesignPage && (
                <div className="print:hidden">
                    <MobileBottomNav
                        isCustomer={isCustomer}
                        onOpenMenu={() => setIsMobileMenuOpen(true)}
                    />
                </div>
            )}

            <ConfirmModal
                open={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title={t("dashboard.logout.confirmTitle")}
                description={t("dashboard.logout.confirmDescription")}
                confirmLabel={t("common.actions.logout")}
                cancelLabel={t("common.actions.cancel")}
                variant="logout"
            />

            <TwoFactorSetup 
                open={is2FASetupOpen}
                onOpenChange={setIs2FASetupOpen}
                onSuccess={() => {
                    setIs2FASetupOpen(false);
                    // Refetch user data after successful 2FA setup
                    window.location.reload();
                }}
            />
        </div>
    );
}