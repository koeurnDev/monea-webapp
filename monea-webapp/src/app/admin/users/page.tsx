import { useEffect, useState, type FormEvent } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, Search, Filter, User, ArrowRight, UserPlus, Copy, Check } from "lucide-react";

import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { DeleteUserAdminDialog } from "./components/DeleteUserAdminDialog";
import { UserDetailsDialog } from "./components/UserDetailsDialog";
import { useToast } from "@/components/ui/Toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreatedAccount {
    email: string;
    temporaryPassword: string;
    verificationEmailSent: boolean;
}

export default function AdminUsersPage() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [savingRole, setSavingRole] = useState(false);
    const [deletingUser, setDeletingUser] = useState(false);
    const [unlockingTemplateKey, setUnlockingTemplateKey] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
    const [copiedTemporaryPassword, setCopiedTemporaryPassword] = useState(false);

    // Fetch All Users
    useEffect(() => {
        fetch("/api/admin/users", { cache: "no-store" }) // Use native cache control
            .then(res => {
                if (res.ok) {
                    res.json().then(result => setUsers(result.data || []));
                }
            })
            .catch(err => console.error("Failed to fetch users:", err))
            .finally(() => setLoading(false));
    }, []);

    // Fetch User Details
    useEffect(() => {
        if (!selectedUserId) {
            setSelectedUserDetails(null);
            return;
        }

        setLoadingDetails(true);
        fetch(`/api/admin/users/${selectedUserId}`, { cache: "no-store" })
            .then(res => {
                if (res.ok) {
                    res.json().then(result => {
                        setSelectedUserDetails(result.data);
                        setSelectedRole(result.data.role);
                    });
                } else {
                    showToast({
                        title: "ចូលមិនបានសម្រេច",
                        description: "មិនអាចទាញយកព័ត៌មានអ្នកប្រើប្រាស់បានទេ។",
                        type: "info"
                    });
                    setSelectedUserId(null);
                }
            })
            .catch(err => {
                console.error(err);
                setSelectedUserId(null);
            })
            .finally(() => setLoadingDetails(false));
    }, [selectedUserId, showToast]);

    const handleSaveRole = async () => {
        if (!selectedUserDetails || selectedUserDetails.role === selectedRole) return;

        setSavingRole(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUserDetails.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (res.ok) {
                showToast({
                    title: "ជោគជ័យ",
                    description: "តួនាទីរបស់អ្នកប្រើប្រាស់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។",
                    type: "success"
                });
                setSelectedUserDetails({ ...selectedUserDetails, role: selectedRole });
                setUsers(prev => prev.map(u => u.id === selectedUserDetails.id ? { ...u, role: selectedRole } : u));
            } else {
                const data = await res.json();
                showToast({
                    title: "បរាជ័យ",
                    description: data.error || "មិនអាចផ្លាស់ប្តូរតួនាទីបានទេ។",
                    type: "info"
                });
            }
        } catch (error) {
            showToast({ title: "Error", description: "Unexpected error while saving role.", type: "info" });
        } finally {
            setSavingRole(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUserDetails) return;

        setDeletingUser(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUserDetails.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                showToast({
                    title: "ជោគជ័យ",
                    description: "គណនីអ្នកប្រើប្រាស់ត្រូវបានផ្អាកបណ្ដោះអាសន្ន។",
                    type: "success"
                });
                const now = new Date().toISOString();
                setUsers(prev => prev.map(u => u.id === selectedUserDetails.id ? { ...u, deletedAt: now } : u));
                setSelectedUserDetails({ ...selectedUserDetails, deletedAt: now });
            } else {
                const data = await res.json();
                showToast({
                    title: "បរាជ័យ",
                    description: data.error || "មិនអាចផ្អាកគណនីបានទេ។",
                    type: "info"
                });
            }
        } catch (error) {
            showToast({ title: "Error", description: "Unexpected error during deletion.", type: "info" });
        } finally {
            setDeletingUser(false);
            setShowDeleteDialog(false);
        }
    };

    const handleRestoreUser = async () => {
        if (!selectedUserDetails) return;

        setSavingRole(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUserDetails.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restore: true }),
            });

            if (res.ok) {
                showToast({
                    title: "ជោគជ័យ",
                    description: "គណនីអ្នកប្រើប្រាស់ត្រូវបានយកមកវិញដោយជោគជ័យ។",
                    type: "success"
                });
                setUsers(prev => prev.map(u => u.id === selectedUserDetails.id ? { ...u, deletedAt: null } : u));
                setSelectedUserDetails({ ...selectedUserDetails, deletedAt: null });
            } else {
                const data = await res.json();
                showToast({
                    title: "បរាជ័យ",
                    description: data.error || "មិនអាចយកគណនីមកវិញបានទេ។",
                    type: "info"
                });
            }
        } catch (error) {
            showToast({ title: "Error", description: "Unexpected error during restoration.", type: "info" });
        } finally {
            setSavingRole(false);
        }
    };

    const handleUnlockTemplate = async (weddingId: string, templateId: string) => {
        if (!selectedUserDetails || !window.confirm("តើអ្នកបានទទួលប្រាក់សម្រាប់ Template នេះរួចហើយឬនៅ? បញ្ជាក់ដើម្បីដោះសោ។")) {
            return;
        }

        const key = `${weddingId}:${templateId}`;
        setUnlockingTemplateKey(key);
        try {
            const response = await fetch(`/api/admin/users/${selectedUserDetails.id}/template-license`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weddingId, templateId }),
            });
            const result = await response.json();

            if (!response.ok) {
                showToast({
                    title: "បរាជ័យ",
                    description: result.error || "មិនអាចដោះសោ Template បានទេ។",
                    type: "info",
                });
                return;
            }

            setSelectedUserDetails((current: any) => ({
                ...current,
                weddings: current.weddings.map((wedding: any) => wedding.id === weddingId
                    ? {
                        ...wedding,
                        templateLicenses: [
                            ...(wedding.templateLicenses || []).filter((license: any) => license.templateId !== templateId),
                            result.data,
                        ],
                    }
                    : wedding),
            }));
            showToast({
                title: "ជោគជ័យ",
                description: "បានដោះសោ Template បន្ទាប់ពីបញ្ជាក់ថាបានទទួលប្រាក់។",
                type: "success",
            });
        } catch (error) {
            showToast({
                title: "បរាជ័យ",
                description: "មានបញ្ហាក្នុងការដោះសោ Template។ សូមព្យាយាមម្ដងទៀត។",
                type: "info",
            });
        } finally {
            setUnlockingTemplateKey(null);
        }
    };

    const handleGrantUserTemplate = async (templateId: string) => {
        if (!selectedUserDetails || !window.confirm(`បើក Template ${templateId} ឲ្យ user នេះប្រើគ្រប់ wedding របស់គាត់?`)) {
            return;
        }

        const key = `user:${templateId}`;
        setUnlockingTemplateKey(key);
        try {
            const response = await fetch(`/api/admin/users/${selectedUserDetails.id}/template-access`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId }),
            });
            const result = await response.json();
            if (!response.ok) {
                showToast({
                    title: "បរាជ័យ",
                    description: result.error || "មិនអាចបើក Template ឲ្យ user បានទេ។",
                    type: "error",
                });
                return;
            }

            setSelectedUserDetails((current: any) => ({
                ...current,
                templateAccess: [
                    ...(current.templateAccess || []).filter((access: any) => access.templateId !== templateId),
                    result.data,
                ],
            }));
            showToast({
                title: "បានបើក Template",
                description: `${templateId} អាចប្រើបានលើ wedding ទាំងអស់របស់ user នេះ។`,
                type: "success",
            });
        } catch (error) {
            console.error("[Admin Users] Failed to grant user template access:", error);
            showToast({
                title: "បរាជ័យ",
                description: "មានបញ្ហាក្នុងការបើក Template។ សូមព្យាយាមម្ដងទៀត។",
                type: "error",
            });
        } finally {
            setUnlockingTemplateKey(null);
        }
    };

    const handleRevokeUserTemplate = async (templateId: string) => {
        if (!selectedUserDetails || !window.confirm(`បិទសិទ្ធិ Template ${templateId} ពី user នេះ?`)) {
            return;
        }

        const key = `user:${templateId}`;
        setUnlockingTemplateKey(key);
        try {
            const response = await fetch(
                `/api/admin/users/${selectedUserDetails.id}/template-access/${encodeURIComponent(templateId)}`,
                { method: "DELETE" },
            );
            const result = await response.json();
            if (!response.ok) {
                showToast({
                    title: "បរាជ័យ",
                    description: result.error || "មិនអាចបិទសិទ្ធិ Template បានទេ។",
                    type: "error",
                });
                return;
            }

            setSelectedUserDetails((current: any) => ({
                ...current,
                templateAccess: (current.templateAccess || []).filter((access: any) => access.templateId !== templateId),
            }));
            showToast({
                title: "បានបិទសិទ្ធិ Template",
                description: templateId,
                type: "success",
            });
        } catch (error) {
            console.error("[Admin Users] Failed to revoke user template access:", error);
            showToast({
                title: "បរាជ័យ",
                description: "មានបញ្ហាក្នុងការបិទសិទ្ធិ Template។ សូមព្យាយាមម្ដងទៀត។",
                type: "error",
            });
        } finally {
            setUnlockingTemplateKey(null);
        }
    };

    const closeCreateDialog = (open: boolean) => {
        if (open) {
            setShowCreateDialog(true);
            return;
        }
        if (creatingUser) return;
        setShowCreateDialog(false);
        if (createdAccount) return;
        setCreateName("");
        setCreateEmail("");
        setCopiedTemporaryPassword(false);
    };

    const finishCreateDialog = () => {
        setShowCreateDialog(false);
        setCreateName("");
        setCreateEmail("");
        setCreatedAccount(null);
        setCopiedTemporaryPassword(false);
    };

    const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreatingUser(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: createName, email: createEmail }),
            });
            const result = await res.json();
            if (!res.ok) {
                showToast({
                    title: "មិនអាចបង្កើតគណនីបានទេ",
                    description: result.error || "សូមពិនិត្យព័ត៌មាន ហើយព្យាយាមម្ដងទៀត។",
                    type: "error",
                });
                return;
            }
            if (
                !result.data ||
                typeof result.data.id !== "string" ||
                typeof result.temporaryPassword !== "string" ||
                typeof result.verificationEmailSent !== "boolean"
            ) {
                throw new Error("The server returned an incomplete account creation response");
            }

            setUsers(prev => [result.data, ...prev]);
            setSearchQuery("");
            setCreatedAccount({
                email: result.data.email,
                temporaryPassword: result.temporaryPassword,
                verificationEmailSent: result.verificationEmailSent,
            });
            showToast({
                title: "បានបង្កើតគណនី",
                description: result.verificationEmailSent
                    ? "បានផ្ញើលេខកូដផ្ទៀងផ្ទាត់ទៅអ៊ីមែលអ្នកប្រើប្រាស់។"
                    : "គណនីបានបង្កើត ប៉ុន្តែការផ្ញើអ៊ីមែលផ្ទៀងផ្ទាត់មិនបានសម្រេចទេ។",
                type: result.verificationEmailSent ? "success" : "error",
            });
        } catch (error) {
            console.error("[AdminUsers] Failed to create account:", error);
            showToast({
                title: "បរាជ័យ",
                description: "មានបញ្ហាពេលបង្កើតគណនី។ សូមព្យាយាមម្ដងទៀត។",
                type: "error",
            });
        } finally {
            setCreatingUser(false);
        }
    };

    const handleCopyTemporaryPassword = async () => {
        if (!createdAccount) return;
        try {
            await navigator.clipboard.writeText(createdAccount.temporaryPassword);
            setCopiedTemporaryPassword(true);
            showToast({ title: "បានចម្លងពាក្យសម្ងាត់", type: "success" });
        } catch (error) {
            console.error("[AdminUsers] Could not copy temporary password:", error);
            showToast({
                title: "មិនអាចចម្លងបានទេ",
                description: "សូមជ្រើសរើស និងចម្លងពាក្យសម្ងាត់ដោយដៃ។",
                type: "error",
            });
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-rose-500 border-x-transparent border-b-transparent animate-spin" />
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-sm font-kantumruy">កំពុងទាញយក...</span>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 mb-1">User Management</p>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-kantumruy tracking-tight">អ្នកប្រើប្រាស់</h2>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="ស្វែងរកអ្នកប្រើ..."
                            className="h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-kantumruy text-sm w-full md:w-[260px] placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={() => setShowCreateDialog(true)}
                        className="h-10 rounded-xl font-kantumruy font-bold"
                    >
                        <UserPlus className="h-4 w-4" />
                        បង្កើតគណនី
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/40">
                        <TableRow className="border-b border-slate-200/80 dark:border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider px-5 py-3.5 font-kantumruy">អ្នកប្រើប្រាស់</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider font-kantumruy">តួនាទី</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-center font-kantumruy">ការងារ</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider font-kantumruy">ឈ្មោះ</TableHead>
                            <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider font-kantumruy">ថ្ងៃចូល</TableHead>
                            <TableHead className="text-right text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider px-5"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <Users size={40} />
                                        <p className="font-kantumruy font-bold text-sm">គ្មានអ្នកប្រើប្រាស់</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.map((user, idx) => {
                            const avatarColors = [
                                "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
                                "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
                                "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
                                "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
                                "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
                            ];
                            const avatarColor = avatarColors[idx % avatarColors.length];
                            return (
                            <TableRow
                                key={user.id}
                                className="border-b border-slate-100/80 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedUserId(user.id)}
                            >
                                <TableCell className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm", avatarColor)}>
                                            {user.name ? user.name[0].toUpperCase() : <User size={15} />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-slate-900 dark:text-white truncate text-sm" title={user.name}>{user.name || "N/A"}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono" title={user.email}>{user.email}</span>
                                            {user.emailVerified === false && (
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    មិនទាន់ផ្ទៀងផ្ទាត់អ៊ីមែល
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border",
                                        user.role === ROLES.PLATFORM_OWNER
                                            ? "bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900 dark:border-slate-200"
                                            : user.role === ROLES.EVENT_MANAGER
                                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    )}>
                                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs">
                                        {user.weddings?.length || 0}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {user.weddings && user.weddings.length > 0 ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold font-kantumruy truncate max-w-[150px] text-slate-800 dark:text-slate-200">{user.weddings[0].groomName} & {user.weddings[0].brideName}</span>
                                            {user.weddings.length > 1 && (
                                                <span className="text-xs text-slate-400 font-medium">+{user.weddings.length - 1} more</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                        {new Date(user.createdAt).toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right px-5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 text-xs h-8 font-bold"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedUserId(user.id);
                                        }}
                                    >
                                        មើល
                                        <ArrowRight size={13} className="ml-1" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </div>

            <UserDetailsDialog
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                loadingDetails={loadingDetails}
                selectedUserDetails={selectedUserDetails}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                handleSaveRole={handleSaveRole}
                savingRole={savingRole}
                handleRestoreUser={handleRestoreUser}
                setShowDeleteDialog={setShowDeleteDialog}
                deletingUser={deletingUser}
                onUnlockTemplate={handleUnlockTemplate}
                onGrantUserTemplate={handleGrantUserTemplate}
                onRevokeUserTemplate={handleRevokeUserTemplate}
                unlockingTemplateKey={unlockingTemplateKey}
            />

            <DeleteUserAdminDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteUser}
                isDeleting={deletingUser}
                userEmail={selectedUserDetails?.email || ""}
            />

            <Dialog open={showCreateDialog} onOpenChange={closeCreateDialog}>
                <DialogContent className="bg-card border-border text-foreground rounded-3xl max-w-lg p-0 overflow-hidden">
                    {createdAccount ? (
                        <>
                            <DialogHeader className="p-7 pb-4">
                                <DialogTitle className="text-xl font-black font-kantumruy">បានបង្កើតគណនីរួចរាល់</DialogTitle>
                                <DialogDescription className="font-kantumruy">
                                    {createdAccount.verificationEmailSent
                                        ? `បានផ្ញើលេខកូដផ្ទៀងផ្ទាត់ទៅ ${createdAccount.email}។ អ្នកប្រើប្រាស់ត្រូវផ្ទៀងផ្ទាត់អ៊ីមែលមុនចូលប្រើ។`
                                        : `គណនី ${createdAccount.email} ត្រូវបានបង្កើត ប៉ុន្តែមិនអាចផ្ញើលេខកូដផ្ទៀងផ្ទាត់បានទេ។ សូមឱ្យអ្នកប្រើស្នើសុំផ្ញើកូដម្ដងទៀតពីទំព័រចូល។`}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-7 pb-5 space-y-3">
                                <Label htmlFor="temporary-password">ពាក្យសម្ងាត់ដំបូង</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="temporary-password"
                                        readOnly
                                        value={createdAccount.temporaryPassword}
                                        className="font-mono text-sm"
                                        onFocus={(event) => event.currentTarget.select()}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCopyTemporaryPassword}
                                        className="shrink-0"
                                        aria-label="ចម្លងពាក្យសម្ងាត់"
                                    >
                                        {copiedTemporaryPassword ? <Check /> : <Copy />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground font-kantumruy leading-relaxed">
                                    សូមចែករំលែកពាក្យសម្ងាត់នេះជាលក្ខណៈឯកជន។ អ្នកប្រើប្រាស់អាចប្តូរពាក្យសម្ងាត់ក្រោយចូលគណនី។ ពាក្យសម្ងាត់នេះនឹងមិនបង្ហាញម្ដងទៀតទេ។
                                </p>
                            </div>
                            <DialogFooter className="p-7 pt-4 border-t border-border/60">
                                <Button type="button" onClick={finishCreateDialog} className="rounded-xl font-kantumruy">
                                    រួចរាល់
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <form onSubmit={handleCreateUser}>
                            <DialogHeader className="p-7 pb-4">
                                <DialogTitle className="text-xl font-black font-kantumruy">បង្កើតគណនីជំនួសអ្នកប្រើប្រាស់</DialogTitle>
                                <DialogDescription className="font-kantumruy">
                                    បំពេញឈ្មោះ និងអ៊ីមែល។ ប្រព័ន្ធនឹងបង្កើតពាក្យសម្ងាត់ដំបូង ហើយផ្ញើកូដផ្ទៀងផ្ទាត់ទៅអ៊ីមែល។
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-7 pb-5 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-user-name">ឈ្មោះ</Label>
                                    <Input
                                        id="new-user-name"
                                        autoComplete="name"
                                        value={createName}
                                        onChange={(event) => setCreateName(event.target.value)}
                                        minLength={2}
                                        maxLength={80}
                                        required
                                        disabled={creatingUser}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-user-email">អ៊ីមែល</Label>
                                    <Input
                                        id="new-user-email"
                                        type="email"
                                        autoComplete="email"
                                        value={createEmail}
                                        onChange={(event) => setCreateEmail(event.target.value)}
                                        maxLength={254}
                                        required
                                        disabled={creatingUser}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-7 pt-4 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => closeCreateDialog(false)}
                                    disabled={creatingUser}
                                    className="rounded-xl font-kantumruy"
                                >
                                    បោះបង់
                                </Button>
                                <Button type="submit" disabled={creatingUser} className="rounded-xl font-kantumruy">
                                    {creatingUser ? "កំពុងបង្កើត..." : "បង្កើតគណនី"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}