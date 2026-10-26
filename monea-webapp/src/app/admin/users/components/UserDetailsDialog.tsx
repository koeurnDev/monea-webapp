import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Loader2, Fingerprint, ShieldAlert, Save, Globe, ArrowRight, Clock, LockKeyhole, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { TEMPLATE_CATALOG } from "@/components/templates/template-config";

interface UserDetailsDialogProps {
    selectedUserId: string | null;
    setSelectedUserId: (id: string | null) => void;
    loadingDetails: boolean;
    selectedUserDetails: any;
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    handleSaveRole: () => void;
    savingRole: boolean;
    handleRestoreUser: () => void;
    setShowDeleteDialog: (val: boolean) => void;
    deletingUser: boolean;
    onUnlockTemplate: (weddingId: string, templateId: string) => Promise<void>;
    onGrantUserTemplate: (templateId: string) => Promise<void>;
    onRevokeUserTemplate: (templateId: string) => Promise<void>;
    unlockingTemplateKey: string | null;
}

export function UserDetailsDialog({
    selectedUserId,
    setSelectedUserId,
    loadingDetails,
    selectedUserDetails,
    selectedRole,
    setSelectedRole,
    handleSaveRole,
    savingRole,
    handleRestoreUser,
    setShowDeleteDialog,
    deletingUser,
    onUnlockTemplate,
    onGrantUserTemplate,
    onRevokeUserTemplate,
    unlockingTemplateKey,
}: UserDetailsDialogProps) {
    const [selectedTemplateByWedding, setSelectedTemplateByWedding] = useState<Record<string, string>>({});
    const [selectedAccountTemplate, setSelectedAccountTemplate] = useState("");
    const getTemplateOptions = (wedding: any) =>
        TEMPLATE_CATALOG.filter((template) => template.eventType === "both" || template.eventType === wedding.eventType);
    const getSelectedTemplate = (wedding: any) => {
        const options = getTemplateOptions(wedding);
        return selectedTemplateByWedding[wedding.id]
            ?? options.find((template) => template.id === wedding.templateId)?.id
            ?? options[0]?.id
            ?? "";
    };

    return (
        <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
            <DialogContent className="max-w-[850px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl max-h-[90vh] flex flex-col">
                <DialogTitle className="sr-only">គ្រប់គ្រងអ្នកប្រើប្រាស់</DialogTitle>
                <DialogDescription className="sr-only">ផ្លាស់ប្តូរតួនាទី និងលេខសម្ងាត់របស់អ្នកប្រើប្រាស់។</DialogDescription>

                {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">កំពុងទាញយកទិន្នន័យ...</span>
                    </div>
                ) : selectedUserDetails && (
                    <div className="flex-1 overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                        <User size={28} strokeWidth={2} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-kantumruy">គ្រប់គ្រងគណនី</h2>
                                        <div className="flex items-center gap-2 text-slate-500 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg w-fit">
                                            <Mail size={12} />
                                            {selectedUserDetails.email}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    {selectedUserDetails.deletedAt ? (
                                        <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 px-3 py-1 rounded-md text-xs font-semibold tracking-wider uppercase">
                                            SUSPENDED
                                        </Badge>
                                    ) : (
                                        <Badge className={cn(
                                            "px-3 py-1 rounded-md text-xs font-semibold tracking-wider uppercase border",
                                            selectedUserDetails.role === ROLES.PLATFORM_OWNER
                                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                                : selectedUserDetails.role === ROLES.EVENT_MANAGER
                                                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                        )}>
                                            {ROLE_LABELS[selectedUserDetails.role as keyof typeof ROLE_LABELS] || selectedUserDetails.role}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">UID: {selectedUserDetails.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Left Side: Settings */}
                            <div className="md:col-span-2 space-y-8">
                                {/* Role Configuration */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-foreground font-kantumruy uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint size={16} className="text-red-500" />
                                        Role Configuration
                                    </h3>
                                    
                                    <div className="p-8 rounded-[2rem] border border-border bg-card shadow-sm">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Select Permission Level</label>
                                            
                                            {selectedUserDetails.role === ROLES.PLATFORM_OWNER ? (
                                                <div className="flex items-start gap-4 p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                                    <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-bold text-amber-900/70 font-kantumruy leading-relaxed">
                                                        គណនី PLATFORM OWNER គឺជាកម្រិតខ្ពស់បំផុត។ អ្នកមិនអាចផ្លាស់ប្តូរតួនាទីនេះបានឡើយសម្រាប់សុវត្ថិភាព។
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                                                    <div className="flex-1">
                                                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                                                            <SelectTrigger className="h-14 rounded-2xl border-border bg-slate-50/50 focus:ring-0 text-sm font-bold px-6">
                                                                <SelectValue placeholder="ជ្រើសរើសតួនាទី" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-border shadow-2xl">
                                                                <SelectItem value={ROLES.EVENT_MANAGER} className="rounded-xl font-bold">{ROLE_LABELS[ROLES.EVENT_MANAGER]}</SelectItem>
                                                                <SelectItem value={ROLES.EVENT_STAFF} className="rounded-xl font-bold">{ROLE_LABELS[ROLES.EVENT_STAFF]}</SelectItem>
                                                                <SelectItem value={ROLES.PLATFORM_OWNER} disabled className="opacity-50">
                                                                    {ROLE_LABELS[ROLES.PLATFORM_OWNER]} (Restricted)
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={handleSaveRole}
                                                        disabled={savingRole || selectedRole === selectedUserDetails.role}
                                                        className="h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-kantumruy font-black gap-2 px-8 min-w-[120px] transition-all active:scale-95"
                                                    >
                                                        {savingRole ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                        Save
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Linked Data */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-foreground font-kantumruy uppercase tracking-widest flex items-center gap-2">
                                        <Globe size={16} className="text-blue-500" />
                                        Linked Weddings
                                    </h3>
                                    <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">សិទ្ធិ Template VIP តាម User</p>
                                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                បើក Template មួយឲ្យ account នេះប្រើបានលើ wedding ទាំងអស់ រួមទាំង wedding ថ្មី។
                                            </p>
                                        </div>
                                        {selectedUserDetails.templateAccess?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUserDetails.templateAccess.map((access: any) => {
                                                    const key = `user:${access.templateId}`;
                                                    return (
                                                        <div key={access.id} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-background px-3 py-2">
                                                            <span className="text-xs font-bold">
                                                                {TEMPLATE_CATALOG.find((template) => template.id === access.templateId)?.title || access.templateId}
                                                            </span>
                                                            <Badge variant="outline" className="border-emerald-300 text-emerald-700">VIP</Badge>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                disabled={unlockingTemplateKey === key}
                                                                onClick={() => void onRevokeUserTemplate(access.templateId)}
                                                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                                            >
                                                                {unlockingTemplateKey === key ? <Loader2 size={13} className="animate-spin" /> : "បិទ"}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Select
                                                value={selectedAccountTemplate || TEMPLATE_CATALOG[0]?.id}
                                                onValueChange={setSelectedAccountTemplate}
                                            >
                                                <SelectTrigger className="h-10 text-xs">
                                                    <SelectValue placeholder="ជ្រើសរើស Template ID" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TEMPLATE_CATALOG.map((template) => (
                                                        <SelectItem key={template.id} value={template.id}>
                                                            {template.title} · {template.id}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {(() => {
                                                const templateId = selectedAccountTemplate || TEMPLATE_CATALOG[0]?.id || "";
                                                const hasAccess = selectedUserDetails.templateAccess?.some((access: any) => access.templateId === templateId);
                                                const key = `user:${templateId}`;
                                                return (
                                                    <Button
                                                        type="button"
                                                        disabled={!templateId || hasAccess || unlockingTemplateKey === key}
                                                        onClick={() => void onGrantUserTemplate(templateId)}
                                                        className="h-10 shrink-0 gap-2 text-xs font-bold"
                                                    >
                                                        {unlockingTemplateKey === key
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Unlock size={14} />}
                                                        {hasAccess ? "បានបើករួច" : "បើកឲ្យ User"}
                                                    </Button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedUserDetails.weddings && selectedUserDetails.weddings.length > 0 ? (
                                            selectedUserDetails.weddings.map((w: any) => (
                                                <div 
                                                    key={w.id} 
                                                    className="p-5 rounded-2xl border border-border hover:bg-slate-50 transition-colors group cursor-pointer"
                                                    onClick={() => window.location.href = `/admin/weddings/${w.id}`}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                                                                <Globe size={16} strokeWidth={2.5} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-black text-foreground font-kantumruy truncate">
                                                                    {w.groomName} & {w.brideName}
                                                                </span>
                                                                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{w.weddingCode || w.id.substring(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                                                    </div>
                                                    <div
                                                        className="mt-4 pt-4 border-t border-border space-y-3 cursor-default"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                                            <span className="font-bold text-muted-foreground">Template កំពុងប្រើ:</span>
                                                            <Badge variant="outline" className="font-mono">
                                                                {TEMPLATE_CATALOG.find((template) => template.id === w.templateId)?.title || w.templateId || "មិនទាន់ជ្រើសរើស"}
                                                            </Badge>
                                                        </div>
                                                        {w.templateLicenses?.length > 0 && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-muted-foreground">Template licenses:</p>
                                                                {w.templateLicenses.map((license: any) => (
                                                                    <div key={license.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                                        <span className="font-mono">{TEMPLATE_CATALOG.find((template) => template.id === license.templateId)?.title || license.templateId}</span>
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground">{license.amount} {license.currency}</span>
                                                                            <Badge variant="outline" className={license.status === "ACTIVE" ? "text-emerald-600 border-emerald-200" : "text-amber-600 border-amber-200"}>
                                                                                {license.status}
                                                                            </Badge>
                                                                        </span>
                                                                        {(license.paymentOrderId || license.bakongTrxId) && (
                                                                            <span className="basis-full text-[10px] text-muted-foreground break-all">
                                                                                Ref: {license.bakongTrxId || license.paymentOrderId}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                                                            <Select
                                                                value={getSelectedTemplate(w)}
                                                                onValueChange={(templateId) => setSelectedTemplateByWedding((current) => ({ ...current, [w.id]: templateId }))}
                                                            >
                                                                <SelectTrigger className="h-9 sm:max-w-xs text-xs" aria-label="Select template to unlock">
                                                                    <SelectValue placeholder="ជ្រើសរើស Template" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {getTemplateOptions(w).map((template) => (
                                                                            <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {(() => {
                                                                const templateId = getSelectedTemplate(w);
                                                                const license = w.templateLicenses?.find((item: any) => item.templateId === templateId);
                                                                const key = `${w.id}:${templateId}`;
                                                                const isActive = license?.status === "ACTIVE";
                                                                return (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={isActive ? "outline" : "default"}
                                                                        className="h-9 text-xs font-bold"
                                                                        disabled={!templateId || isActive || unlockingTemplateKey === key}
                                                                        onClick={() => templateId && void onUnlockTemplate(w.id, templateId)}
                                                                    >
                                                                        {unlockingTemplateKey === key
                                                                            ? <Loader2 size={14} className="mr-2 animate-spin" />
                                                                            : isActive
                                                                                ? <LockKeyhole size={14} className="mr-2" />
                                                                                : <Unlock size={14} className="mr-2" />}
                                                                        {isActive ? "បានដោះសោរួច" : "បានទទួលប្រាក់ — ដោះសោ"}
                                                                    </Button>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-border opacity-50">
                                                <p className="text-xs font-bold font-kantumruy uppercase tracking-widest">No Weddings Found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Actions & Info */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] border border-border bg-slate-50/50 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Joined At</p>
                                                <p className="text-xs font-bold">{new Date(selectedUserDetails.createdAt).toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Fingerprint size={16} className="text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Account Status</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {selectedUserDetails.deletedAt ? (
                                                        <span className="text-xs font-black text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/10">SUSPENDED</span>
                                                    ) : (
                                                        <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">ACTIVE</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Zone */}
                                <div className={cn(
                                    "p-6 rounded-[2rem] border transition-all duration-500",
                                    selectedUserDetails.deletedAt 
                                        ? "bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-600/20" 
                                        : "bg-white border-red-100 shadow-xl shadow-red-600/5 dark:bg-slate-900 dark:border-red-950/20"
                                )}>
                                    <h3 className={cn(
                                        "text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2",
                                        selectedUserDetails.deletedAt ? "text-white" : "text-red-600"
                                    )}>
                                        {selectedUserDetails.deletedAt ? <Clock size={14} /> : <ShieldAlert size={14} />}
                                        {selectedUserDetails.deletedAt ? "Account Recovery" : "Security Actions"}
                                    </h3>
                                    <p className={cn(
                                        "text-xs font-bold font-kantumruy leading-relaxed mb-6",
                                        selectedUserDetails.deletedAt ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                        {selectedUserDetails.deletedAt 
                                            ? "គណនីនេះត្រូវបានផ្អាក។ អ្នកអាចយកវាត្រឡប់មកប្រើប្រាស់វិញបានគ្រប់ពេលមុន ៣០ ថ្ងៃ។" 
                                            : "ការលុបគណនីនឹងផ្អាកការប្រើប្រាស់រយៈពេល ៣០ ថ្ងៃមុននឹងត្រូវលុបជាស្ថាពរ។"}
                                    </p>

                                    {selectedUserDetails.deletedAt ? (
                                        <Button 
                                            className="w-full rounded-2xl font-black font-kantumruy text-xs tracking-widest h-14 bg-white text-emerald-700 hover:bg-slate-50 transition-all uppercase shadow-lg shadow-black/10 active:scale-95"
                                            onClick={handleRestoreUser}
                                            disabled={savingRole}
                                        >
                                            {savingRole ? <Loader2 size={16} className="animate-spin" /> : "RESTORE ACCOUNT"}
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="destructive" 
                                            className="w-full rounded-2xl font-black font-kantumruy text-xs tracking-widest h-14 bg-red-600 hover:bg-red-700 transition-all uppercase shadow-lg shadow-red-600/20 active:scale-95"
                                            onClick={() => setShowDeleteDialog(true)}
                                            disabled={deletingUser || selectedUserDetails.role === ROLES.PLATFORM_OWNER}
                                        >
                                            SUSPEND ACCOUNT
                                        </Button>
                                    )}
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full h-12 rounded-2xl border-border font-black uppercase tracking-widest text-xs opacity-40 hover:opacity-100 transition-all"
                                    onClick={() => window.location.href = `/admin/users/${selectedUserDetails.id}`}
                                >
                                    Open Full View
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
