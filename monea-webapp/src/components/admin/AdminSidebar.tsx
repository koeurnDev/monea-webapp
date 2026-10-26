import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    LayoutGrid,
    PartyPopper,
    Users,
    DollarSign,
    Megaphone,
    ShieldAlert,
    FileText,
    Wrench,
    TrendingUp,
    Settings,
    LifeBuoy,
    LogOut,
    ExternalLink,
    ShieldCheck,
    ChevronRight,
    ChevronDown,
    User,
    Share2,
    ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoneaLogo } from "@/components/ui/MoneaLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AdminSidebarProps {
    onCloseMobile?: () => void;
}

interface NavItem {
    href: string;
    label: string;
    shortLabel?: string;
    enLabel: string;
    icon: React.ElementType;
    exact?: boolean;
    badge?: string;
}

interface NavSection {
    title: string;
    shortTitle?: string;
    items: NavItem[];
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
    const { pathname } = useLocation();
    const { user, logout } = useAuth();
    const isPlatformOwner = user?.role === "SUPERADMIN" || user?.role === "PLATFORM_OWNER";
    const ownerOnlyLinks = new Set([
        "/admin/master",
        "/admin/master/weddings",
        "/admin/master/users",
        "/admin/master/payments",
        "/admin/master/support",
        "/admin/master/templates",
        "/admin/master/audit",
        "/admin/master/analytics",
        "/admin/master/social-links",
        "/admin/master/media-validator"
    ]);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/admin/login";
        } catch (e) {
            window.location.href = "/admin/login";
        }
    };

    const navSections: NavSection[] = [
        {
            title: "គ្រប់គ្រងទូទៅ",
            shortTitle: "ទូទៅ",
            items: [
                { href: "/admin/master", label: "ផ្ទាំងទូទៅ", shortLabel: "ទូទៅ", enLabel: "Overview", icon: LayoutDashboard, exact: true },
                { href: "/admin/master/weddings", label: "កម្មវិធីមង្គលការ", shortLabel: "មង្គលការ", enLabel: "Weddings", icon: PartyPopper },
                { href: "/admin/master/users", label: "អ្នកប្រើប្រាស់", shortLabel: "អ្នកប្រើ", enLabel: "Users", icon: Users },
                { href: "/admin/master/payments", label: "ការលក់ Template", shortLabel: "លក់ Template", enLabel: "Template Sales", icon: DollarSign },
            ]
        },
        {
            title: "ប្រព័ន្ធ & សុវត្ថិភាព",
            shortTitle: "ប្រព័ន្ធ",
            items: [
                { href: "/admin/master/broadcast", label: "សារប្រកាស", shortLabel: "ប្រកាស", enLabel: "Broadcast", icon: Megaphone },
                { href: "/admin/master/security", label: "សន្តិសុខ & IP", shortLabel: "សុវត្ថិភាព", enLabel: "Security", icon: ShieldAlert },
                { href: "/admin/master/audit", label: "កំណត់ត្រាសវនកម្ម", shortLabel: "សវនកម្ម", enLabel: "Audit Logs", icon: FileText },
                { href: "/admin/master/maintenance", label: "ការថែទាំប្រព័ន្ធ", shortLabel: "ថែទាំ", enLabel: "Maintenance", icon: Wrench },
                { href: "/admin/master/templates", label: "គ្រប់គ្រង Template", shortLabel: "Template", enLabel: "Templates", icon: LayoutGrid },
                { href: "/admin/master/media-validator", label: "ពិនិត្យរូបភាព", shortLabel: "រូបភាព", enLabel: "Media Validator", icon: ImageIcon },
                { href: "/dashboard/design?templatePreview=modern-minimal", label: "Demo Preview Template", shortLabel: "Demo Preview", enLabel: "Demo Preview", icon: ExternalLink },
                { href: "/admin/master/analytics", label: "ស្ថិតិទូទាំងប្រទេស", shortLabel: "ស្ថិតិ", enLabel: "Analytics", icon: TrendingUp },
                { href: "/admin/master/social-links", label: "បណ្តាញសង្គម", shortLabel: "Social", enLabel: "Social Media", icon: Share2 },
            ]
        },
        {
            title: "ជំនួយ & ការកំណត់",
            shortTitle: "ជំនួយ",
            items: [
                { href: "/admin/master/support", label: "ផ្នែកជំនួយអតិថិជន", shortLabel: "ជំនួយ", enLabel: "Support Desk", icon: LifeBuoy, badge: "LIVE" },
                { href: "/admin/master/settings", label: "ការកំណត់ប្រព័ន្ធ", shortLabel: "កំណត់", enLabel: "Global Settings", icon: Settings },
            ]
        }
    ];

    return (
        <aside className="flex h-full w-72 flex-col justify-between border-r border-border bg-card text-foreground font-kantumruy select-none relative z-30">
            {/* Top Brand Header */}
            <div>
                <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-5">
                    <Link to="/admin/master" onClick={onCloseMobile} className="flex items-center gap-3 group">
                        <MoneaLogo showText size="sm" />
                        <span className="rounded-full border border-border bg-accent px-2 py-0.5 text-xs font-black uppercase tracking-wider text-primary">
                            Admin
                        </span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-none">
                    {navSections.map((section, sIdx) => {
                        const visibleItems = section.items.filter(
                            (item) => !ownerOnlyLinks.has(item.href) || isPlatformOwner
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={sIdx} className="space-y-2">
                            <div className="px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    {section.shortTitle || section.title}
                                </div>
                                <div className="space-y-1">
                                    {visibleItems.map((item) => {
                                        const isActive = item.exact
                                            ? pathname === item.href
                                            : pathname.startsWith(item.href);

                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                onClick={onCloseMobile}
                                                className={cn(
                                                    "flex min-h-[44px] items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-all group",
                                                    isActive
                                                        ? "border-primary/20 bg-accent font-bold text-primary shadow-sm"
                                                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Icon size={17} className={cn(
                                                        "shrink-0 transition-transform group-hover:scale-110",
                                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                    )} />
                                                    <span className="truncate">{item.shortLabel || item.label}</span>
                                                </div>

                                                {item.badge && (
                                                    <span className="shrink-0 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Profile & Actions */}
            <div className="p-4 border-t border-border/50 bg-muted/20 space-y-2">
                {/* Switch to Couple Dashboard */}
                <Link
                    to="/dashboard"
                    onClick={onCloseMobile}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ExternalLink size={14} className="text-muted-foreground" />
                        <span>ផ្ទាំង User Dashboard</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/60" />
                </Link>

                {/* Profile Card */}
                <div className="p-2.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-accent border border-border flex items-center justify-center text-primary shrink-0 font-black text-xs uppercase">
                            {user?.name && user.name !== '-' ? user.name.replace(/[^a-zA-Z0-9\u1780-\u17FF]/g, '').charAt(0).toUpperCase() || 'A' : (user?.email?.charAt(0).toUpperCase() || 'A')}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                                {user?.name && user.name !== '-' ? user.name : (user?.email ? user.email.split('@')[0] : "Master Admin")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                                {user?.email || "kook74532@gmail.com"}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        title="ចាកចេញ (Logout)"
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                        <LogOut size={15} />
                    </Button>
                </div>
            </div>
        </aside>
    );
}
