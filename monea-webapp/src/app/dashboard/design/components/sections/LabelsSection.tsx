import * as React from 'react';
import { Label } from "@/components/ui/label";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { DebouncedTextarea } from "@/components/ui/debounced-textarea";
import type { WeddingData } from '@/components/templates/types';

const ENGAGEMENT_INVITATION_TITLES = [
    "សិរិមង្គលភ្ជាប់ពាក្យ",
    "សិរីមង្គលពិធីចែចូវ",
    "សិរីមង្គលពិធីពិសាស្លាដក់កន្សែង",
] as const;

interface LabelsSectionProps {
    wedding: WeddingData;
    updateTheme: (key: string, value: any) => void;
    updateLabel: (key: string, value: string) => void;
    t: (key: string, opts?: any) => string;
}

const LABEL_SECTIONS = [
    {
        title: "ក្បាលទំព័រ និងការអញ្ជើញ",
        fields: [
            { key: 'invitationTitle', legacyKey: 'invite_title', label: "ចំណងជើងធៀបការ", type: 'input', placeholder: "ឧ. សិរីសួស្តី អាពាហ៍ពិពាហ៍" },
            { key: 'heroSubtitle', legacyKey: 'hero_subtitle', label: "ពាក្យស្វាគមន៍លើរូបភាព", type: 'input', placeholder: "ឧ. យើងខ្ញុំសូមគោរពអញ្ជើញ..." },
            { key: 'heroButton', legacyKey: 'hero_button', label: "អត្ថបទប៊ូតុងលើគម្រប", type: 'input', placeholder: "ឧ. បើកសំបុត្រអញ្ជើញ" },
            { key: 'invitationText', label: "ខ្លឹមសារធៀបអញ្ជើញ", type: 'textarea', placeholder: "ខ្លឹមសារលម្អិតនៃធៀបអញ្ជើញ..." }
        ]
    },
    {
        title: "ទីតាំង និងពេលវេលា",
        fields: [
            { key: 'locationTitle', label: "ចំណងជើងទីតាំង", type: 'input', placeholder: "ឧ. ទីតាំងនៃកម្មវិធី" },
            { key: 'locationSubtitle', label: "ការពិពណ៌នាទីតាំង", type: 'input', placeholder: "ឧ. សូមចុចលើផែនទីដើម្បីស្វែងរកផ្លូវ" },
            { key: 'countdownLabel', label: "ចំណងជើងរាប់ថយក្រោយ", type: 'input', placeholder: "ឧ. កម្មវិធីនឹងចាប់ផ្តើមក្នុងរយៈពេល" }
        ]
    },
    {
        title: "រូបថត និងការជូនពរ",
        fields: [
            { key: 'galleryTitle', legacyKey: 'gallery_title', label: "ចំណងជើងរូបថត", type: 'input', placeholder: "ឧ. កម្រងរូបភាពអនុស្សាវរីយ៍" },
            { key: 'guestbookTitle', label: "ចំណងជើងសៀវភៅជូនពរ", type: 'input', placeholder: "ឧ. សៀវភៅជូនពរ" },
            { key: 'giftTitle', label: "ចំណងជើងចំណងដៃ", type: 'input', placeholder: "ឧ. ចូលរួមជូនពរ & ចំណងដៃ" },
            { key: 'giftSubtitle', label: "ការពិពណ៌នាចំណងដៃ", type: 'textarea', placeholder: "ឧ. សម្រាប់ភ្ញៀវកិត្តិយសដែលមិនអាចអញ្ជើញចូលរួមដោយផ្ទាល់..." },
            { key: 'giftBadge', label: "ស្លាកលើ QR", type: 'input', placeholder: "ឧ. ស្កេន KHQR ដើម្បីចងដៃ" }
        ]
    }
];

export function LabelsSection({ wedding, updateTheme, updateLabel, t }: LabelsSectionProps) {
    const customLabels = wedding.themeSettings?.customLabels;
    const isEngagement = wedding.eventType === "anniversary";
    const invitationTitle = customLabels?.invitationTitle
        || customLabels?.invite_title
        || "";
    const hasExistingCustomTitle = invitationTitle !== ""
        && !ENGAGEMENT_INVITATION_TITLES.some((title) => title === invitationTitle);

    return (
        <div className="space-y-6 pt-2 font-kantumruy">
            {LABEL_SECTIONS.map((section, sIdx) => (
                <div
                    key={sIdx}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <h5 className="text-xs font-bold text-foreground">{section.title}</h5>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm">
                        {section.fields.map((field) => (
                            <div key={field.key} className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground">
                                    {isEngagement && field.key === "invitationTitle" ? "ចំណងជើងធៀបភ្ជាប់ពាក្យ" : field.label}
                                </Label>
                                {field.type === 'textarea' ? (
                                    <DebouncedTextarea
                                        placeholder={field.placeholder}
                                        value={field.key === 'invitationText'
                                            ? (wedding.themeSettings?.invitationText || "")
                                            : (customLabels?.[field.key] || (field.legacyKey ? customLabels?.[field.legacyKey] : "") || "")}
                                        onDebouncedChange={(val) => field.key === 'invitationText' ? updateTheme('invitationText', val) : updateLabel(field.key, val)}
                                        className="min-h-[75px] rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/60 shadow-sm"
                                    />
                                ) : isEngagement && field.key === "invitationTitle" ? (
                                    <select
                                        value={invitationTitle}
                                        onChange={(event) => updateLabel(field.key, event.target.value)}
                                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="" disabled>ជ្រើសរើសចំណងជើង</option>
                                        {hasExistingCustomTitle && <option value={invitationTitle}>{invitationTitle}</option>}
                                        {ENGAGEMENT_INVITATION_TITLES.map((title) => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <DebouncedInput
                                        placeholder={field.placeholder}
                                        value={customLabels?.[field.key] || (field.legacyKey ? customLabels?.[field.legacyKey] : "") || ""}
                                        onDebouncedChange={(val) => updateLabel(field.key, val as string)}
                                        className="h-10 rounded-xl border border-border bg-background px-3.5 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/60 shadow-sm"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
