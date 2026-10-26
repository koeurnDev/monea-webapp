import React, { lazy, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Shield, Menu, Activity, Bell, Megaphone, Globe, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from 'framer-motion';
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { useTranslation } from "@/i18n/LanguageProvider";
import AdminHealthPulse from "@/components/admin/AdminHealthPulse";
import { moneaClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/constants";

const ConfirmModal = lazy<React.ComponentType<any>>(() => import("@/components/ui/ConfirmModal").then(m => ({ default: (m as any).ConfirmModal })));

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
    const { t, locale } = useTranslation();
    const { user } = useAuth();
    const { pathname } = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    async function confirmLogout() {
        setLogoutLoading(true);
        try {
            await moneaClient.post("/api/auth/logout");
            window.location.href = "/sign-in";
        } catch (e) {
            console.error(e);
            setLogoutLoading(false);
        }
    }

    const isPlatformOwner = user?.role === ROLES.PLATFORM_OWNER;
    const isPlatformStaff = user?.role === ROLES.EVENT_STAFF;
    const isMasterAdmin = isPlatformOwner || isPlatformStaff;

    const navItems = [
        { href: "/admin", label: t("admin.sidebar.overview"), icon: LayoutDashboard, color: "text-teal-400", bg: "bg-teal-500/10" },
        ...(isMasterAdmin
            ? [
                { href: "/admin/weddings", label: t("admin.sidebar.weddings"), icon: Globe, color: "text-violet-400", bg: "bg-violet-500/10" },
                { href: "/admin/users", label: t("admin.sidebar.users"), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                { href: "/admin/master/broadcast", label: locale === 'km' ? "ផ្សព្វផ្សាយសារ" : "Broadcasts", icon: Megaphone, color: "text-amber-400", bg: "bg-amber-500/10" },
                ...(isPlatformOwner
                    ? [{ href: "/admin/master/settings", label: t("admin.sidebar.settings"), icon: Settings, color: "text-slate-400", bg: "bg-slate-500/10" }]
                    : []),
            ]
            : []),
    ];

    const renderSidebarContent = (isMobile: boolean = false) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200/60 dark:border-slate-800/60">
                <Link to="/" className="flex items-center gap-2.5">
                    <MoneaLogo showText size="md" />
                </Link>
                <span className="ml-auto rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
                    Admin
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <p className="px-3 pt-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-600">
                    Navigation
                </p>
                {navItems.map((item) => {
                    const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => isMobile && setIsMobileMenuOpen(false)}
                            className={cn(
                                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                                isActive
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? "bg-white/15"
                                    : cn(item.bg, "group-hover:opacity-80")
                            )}>
                                <item.icon size={15} className={isActive ? "text-white" : item.color} />
                            </div>
                            <span className="flex-1 font-kantumruy">{item.label}</span>
                            {isActive && <ChevronRight size={14} className="text-white/50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Health Indicator */}
            <AdminHealthPulse />

            {/* User + Logout */}
            <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                {/* User info pill */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                        <Shield size={14} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.email || "Admin"}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{user?.role || "—"}</p>
                    </div>
                </div>
                <button
                    onClick={() => setLogoutConfirm(true)}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                    <LogOut size={15} />
                    <span className="flex-1 text-left font-kantumruy">{t("admin.sidebar.logout")}</span>
                </button>
            </div>
        </div>
    );

    return (
        <ToastProvider>
            <div className="flex min-h-screen w-full bg-slate-50/80 dark:bg-slate-950 text-foreground font-kantumruy">
                {logoutConfirm && (
                    <ConfirmModal
                        open={logoutConfirm}
                        onClose={() => setLogoutConfirm(false)}
                        onConfirm={confirmLogout}
                        loading={logoutLoading}
                        title={t("admin.logout.title")}
                        description={t("admin.logout.description")}
                        confirmLabel={t("admin.logout.confirm")}
                        cancelLabel={t("admin.logout.cancel")}
                        variant="logout"
                    />
                )}

                {/* Desktop Sidebar */}
                <aside className="w-64 border-r border-slate-200/70 dark:border-slate-800/70 hidden lg:flex flex-col fixed h-full z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                    {renderSidebarContent(false)}
                </aside>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <m.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                                className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-white dark:bg-slate-900 shadow-2xl lg:hidden"
                            >
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="absolute right-3 top-4 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                                {renderSidebarContent(true)}
                            </m.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
                    {/* Header */}
                    <header className={cn(
                        "sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 transition-all duration-300",
                        scrolled
                            ? "bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
                            : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60"
                    )}>
                        {/* Left */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                {/* Breadcrumb */}
                                <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500">Admin</span>
                                <ChevronRight size={12} className="hidden sm:block text-slate-300 dark:text-slate-700" />
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-kantumruy">
                                    {navItems.find(i => i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href))?.label || t("admin.sidebar.overview")}
                                </span>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                                <Bell size={17} className="text-slate-600 dark:text-slate-400" />
                            </button>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 shadow-sm">
                                <Shield size={14} className="text-white" />
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-4 lg:p-7">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}