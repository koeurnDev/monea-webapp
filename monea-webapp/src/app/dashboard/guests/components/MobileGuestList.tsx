import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Copy, Edit, Trash2, Users, MoreVertical, Send, Ticket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";

interface MobileGuestListProps {
    loading: boolean;
    guests: any[];
    searchActive: boolean;
    onClearSearch: () => void;
    visibleCount: number;
    setVisibleCount: (v: any) => void;
    copiedId: string | null;
    isArchived: boolean;
    onCopyLink: (name: string, id: string) => void;
    onShareTelegram?: (name: string, id: string) => void;
    onViewPass?: (guest: any) => void;
    onEdit: (guest: any) => void;
    onDelete: (id: string, name: string) => void;
}

export function MobileGuestList({
    loading,
    guests,
    searchActive,
    onClearSearch,
    visibleCount,
    setVisibleCount,
    copiedId,
    isArchived,
    onCopyLink,
    onShareTelegram,
    onViewPass,
    onEdit,
    onDelete
}: MobileGuestListProps) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="md:hidden h-64 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[12px] font-black text-muted-foreground/50 uppercase tracking-widest">{t("guests.loading")}</span>
            </div>
        );
    }

    if (guests.length === 0) {
        return (
            <div className="md:hidden h-[300px] flex flex-col items-center justify-center text-center space-y-5 px-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center border border-primary/20">
                    <Users className="w-8 h-8 text-primary/60" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground font-kantumruy">
                        {searchActive
                            ? t("guests.searchEmptyTitle", { defaultValue: "រកមិនឃើញភ្ញៀវដែលត្រូវនឹងការស្វែងរកទេ" })
                            : isArchived ? "មិនមានភ្ញៀវក្នុងប័ណ្ណសារទេ" : t("guests.empty")}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground/80 font-kantumruy">
                        {searchActive
                            ? t("guests.searchEmptyDescription", { defaultValue: "សាកល្បងពាក្យផ្សេង ឬសម្អាតការស្វែងរក។" })
                            : isArchived ? "ភ្ញៀវដែលបានរក្សាទុកក្នុងប័ណ្ណសារ នឹងបង្ហាញនៅទីនេះ។" : "ចាប់ផ្តើមបន្ថែមភ្ញៀវកិត្តិយសរបស់អ្នក ដើម្បីងាយស្រួលក្នុងការគ្រប់គ្រង និងផ្ញើធៀប។"}
                    </p>
                </div>
                {searchActive ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClearSearch}
                        className="min-h-11 w-full max-w-[220px] rounded-xl font-kantumruy font-bold"
                    >
                        {t("guests.clearSearch", { defaultValue: "សម្អាតការស្វែងរក" })}
                    </Button>
                ) : !isArchived && (
                    <Button
                        type="button"
                        onClick={() => onEdit(null)}
                        className="h-12 w-full max-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg font-bold font-kantumruy transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {t("dashboard.actions.addGuest", { defaultValue: "បន្ថែមភ្ញៀវដំបូង" })}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="md:hidden space-y-2.5 p-3 sm:p-4 print:hidden">
            <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-xs font-bold font-kantumruy text-muted-foreground opacity-70">{t("guests.cols.name")}</span>
                <span className="text-xs font-bold font-kantumruy text-muted-foreground opacity-70">{guests.length} {t("guests.personUnit")}</span>
            </div>
            {guests.slice(0, visibleCount).map((g: any) => (
                <div key={g.id} className="bg-background rounded-2xl px-3.5 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border border-black/[0.02] dark:border-white/[0.02]">
                    <div className="min-w-0 flex items-center gap-2">
                        <div className={cn("w-2 h-2 shrink-0 rounded-full", g.rsvpStatus === 'CONFIRMED' ? 'bg-green-500' : g.rsvpStatus === 'DECLINED' ? 'bg-red-500' : 'bg-muted-foreground/40')} title={g.rsvpStatus || 'PENDING'} />
                        <span className="font-bold text-foreground font-kantumruy text-[15px] leading-tight truncate">{g.name}</span>
                    </div>

                    <div className="row-start-2 min-w-0 pt-1 pl-4">
                        <span className="inline-block max-w-full truncate rounded-lg bg-muted px-2 py-0.5 text-xs font-bold tracking-tight text-muted-foreground">
                            {g.group && g.group !== "None" ? g.group : (g.source && g.source !== "GIFT_ENTRY" && g.source !== "None" ? g.source : t("guests.general"))}
                        </span>
                    </div>

                    <div className="row-span-2 flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-xl">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 font-kantumruy">
                                <DropdownMenuItem onClick={() => onCopyLink(g.name, g.id)} className="gap-3 py-3 rounded-xl cursor-pointer">
                                    {copiedId === g.id ? (
                                        <CheckCircle2 size={16} className="text-green-600" />
                                    ) : (
                                        <Copy size={16} className="text-muted-foreground" />
                                    )}
                                    <span className="font-bold">{copiedId === g.id ? t("guests.copied", { defaultValue: "បានចម្លង" }) : t("guests.copyLink", { defaultValue: "ចម្លងតំណភ្ជាប់" })}</span>
                                </DropdownMenuItem>

                                {onShareTelegram && (
                                    <DropdownMenuItem onClick={() => onShareTelegram(g.name, g.id)} className="gap-3 py-3 rounded-xl cursor-pointer text-[#229ED9] focus:bg-[#229ED9]/10 focus:text-[#229ED9]">
                                        <Send size={16} />
                                        <span className="font-bold">ផ្ញើតាម Telegram</span>
                                    </DropdownMenuItem>
                                )}

                                {onViewPass && (
                                    <DropdownMenuItem onClick={() => onViewPass(g)} className="gap-3 py-3 rounded-xl cursor-pointer text-amber-700 dark:text-amber-300 focus:bg-amber-500/10 focus:text-amber-700">
                                        <Ticket size={16} className="text-amber-600" />
                                        <span className="font-bold">សំបុត្រឌីជីថល</span>
                                    </DropdownMenuItem>
                                )}
                                
                                {!isArchived && (
                                    <>
                                        <DropdownMenuItem onClick={() => onEdit(g)} className="gap-3 py-3 rounded-xl cursor-pointer">
                                            <Edit size={16} className="text-primary" />
                                            <span className="font-bold">កែប្រែ</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(g.id, g.name)} className="gap-3 py-3 rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 size={16} />
                                            <span className="font-bold">លុប</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}
            {guests.length > visibleCount && (
                <div className="pt-4 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => setVisibleCount((prev: number) => prev + 50)}
                        className="w-full h-12 rounded-2xl border-dashed border-2 border-border text-muted-foreground font-kantumruy font-bold hover:bg-muted/50"
                    >
                        <Plus size={16} className="mr-2" /> {t("guests.showMore", { count: guests.length - visibleCount })}
                    </Button>
                </div>
            )}
        </div>
    );
}
