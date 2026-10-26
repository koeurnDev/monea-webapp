import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { TemplateProps, TemplateSection } from "./types";

export type TemplateEventType = "wedding" | "anniversary";

export interface TemplatePresentationMetadata {
    title: string;
    description: string;
    image: string;
    eventType: TemplateEventType | "both";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const isTemplateEventType = (value: unknown): value is TemplatePresentationMetadata["eventType"] =>
    value === "wedding" || value === "anniversary" || value === "both";

const isUploadedTemplateCover = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === "https:"
            && (
                (url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/"))
                || (url.hostname === "media.moneoez.com"
                    && url.pathname.split("/").filter(Boolean)[0] === "template-covers")
            );
    } catch {
        return false;
    }
};

export function normalizeTemplateAvailability(value: unknown): Record<string, boolean> {
    if (!isRecord(value)) {
        throw new TypeError("Template availability response must be an object");
    }

    return Object.fromEntries(
        Object.entries(TEMPLATE_DEFINITIONS).map(([id, template]) => {
            const enabled = value[id];
            if (enabled !== undefined && typeof enabled !== "boolean") {
                throw new TypeError(`Template availability for "${id}" must be a boolean`);
            }
            return [id, enabled ?? template.selectable];
        }),
    );
}

export function normalizeTemplatePresentationMetadata(
    value: unknown,
): Record<string, TemplatePresentationMetadata> {
    if (!isRecord(value)) {
        throw new TypeError("Template metadata response must be an object");
    }

    return Object.fromEntries(
        Object.entries(TEMPLATE_DEFINITIONS).map(([id, template]) => {
            const metadata = value[id];
            if (metadata === undefined) {
                return [id, {
                    title: template.title,
                    description: template.description,
                    image: template.image,
                    eventType: template.eventType,
                }];
            }

            if (
                !isRecord(metadata)
                || typeof metadata.title !== "string"
                || typeof metadata.description !== "string"
                || typeof metadata.image !== "string"
                || !isTemplateEventType(metadata.eventType)
            ) {
                throw new TypeError(`Template metadata for "${id}" is invalid`);
            }

            return [id, {
                title: metadata.title,
                description: metadata.description,
                image: isUploadedTemplateCover(metadata.image) ? metadata.image : "",
                eventType: metadata.eventType,
            }];
        }),
    );
}

export interface TemplateConfig {
    code: string;
    id: string;
    title: string;
    description: string;
    eventType: TemplateEventType | "both";
    image: string;
    primaryColor: string;
    isFree: boolean;
    comingSoon: boolean;
    selectable: boolean;
    visibilityControls: readonly TemplateSection[];
    component: LazyExoticComponent<ComponentType<TemplateProps>>;
}

const STANDARD_VISIBILITY_CONTROLS = ["story", "gallery", "timeline", "guestbook"] as const satisfies readonly TemplateSection[];

export const TEMPLATE_DEFINITIONS = {
    "khmer-legacy": {
        code: "M1",
        id: "khmer-legacy",
        title: "Khmer Legacy",
        description: "រចនាបែបប្រពៃណីខ្មែរ សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#E8AC00",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./KhmerLegacy")),
    },
    "modern-minimal": {
        code: "M2",
        id: "modern-minimal",
        title: "ទំនើប សាមញ្ញ",
        description: "រចនាស្អាតសាមញ្ញ សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#0A1226",
        isFree: true,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./ModernMinimal")),
    },
    "fortune-harmony": {
        code: "M3",
        id: "fortune-harmony",
        title: "ប្រណីត - Fortune Harmony",
        description: "រចនាបែបប្រណីត សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#D4AF37",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./FortuneHarmony")),
    },
    "blossom-romance": {
        code: "M4",
        id: "blossom-romance",
        title: "Rose Garden",
        description: "រចនាបែបផ្កា ទន់ភ្លន់ និងរ៉ូម៉ង់ សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#B76572",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./BlossomRomance")),
    },
    "nea-m05": {
        code: "M5",
        id: "nea-m05",
        title: "NEA - Olive & Gold",
        description: "រចនាបែបក្រដាសធៀបខ្មែរ សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#A27A43",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./NeaM05")),
    },
    "emerald-garden": {
        code: "M6",
        id: "emerald-garden",
        title: "Emerald Garden",
        description: "រចនាបែបសួនបៃតង សម្រាប់ពិធីមង្គលការ និងភ្ជាប់ពាក្យ",
        eventType: "both",
        image: "",
        primaryColor: "#1B4332",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./EmeraldGarden")),
    },
    "anniversary-elegant": {
        code: "M7",
        id: "anniversary-elegant",
        title: "Anniversary Elegant",
        description: "រចនាបែបឆើតឆាយសម្រាប់ពិធីភ្ជាប់ពាក្យ",
        eventType: "anniversary",
        image: "",
        primaryColor: "#8B4B55",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./AnniversaryElegant")),
    },
    "garden-editorial": {
        code: "M8",
        id: "garden-editorial",
        title: "Palace Bloom",
        description: "រចនាបែបវិមានផ្កា ទន់ភ្លន់ និងប្រណីត ជាមួយពណ៌មាស",
        eventType: "wedding",
        image: "",
        primaryColor: "#A78337",
        isFree: false,
        comingSoon: false,
        selectable: true,
        visibilityControls: STANDARD_VISIBILITY_CONTROLS,
        component: lazy(() => import("./GardenEditorial")),
    },
} satisfies Record<string, TemplateConfig>;

export const TEMPLATE_REGISTRY: Record<string, ComponentType<TemplateProps>> =
    Object.fromEntries(
        Object.values(TEMPLATE_DEFINITIONS).map(({ id, component }) => [id, component]),
    );

export const TEMPLATE_CATALOG: TemplateConfig[] = Object.values(TEMPLATE_DEFINITIONS)
    .filter((template) => template.selectable);

export const getTemplatesForEventType = (
    eventType: TemplateEventType,
    enabledTemplateIds?: ReadonlySet<string>,
) => {
    const templates = enabledTemplateIds
        ? Object.values(TEMPLATE_DEFINITIONS).filter((template) => enabledTemplateIds.has(template.id))
        : TEMPLATE_CATALOG;

    return templates.filter((template) =>
        template.eventType === eventType || template.eventType === "both",
    );
};

export const getTemplateConfig = (templateId?: string | null) =>
    templateId ? TEMPLATE_DEFINITIONS[templateId as keyof typeof TEMPLATE_DEFINITIONS] || null : null;

const TEMPLATE_IMPORTERS: Record<string, () => Promise<unknown>> = {
    "khmer-legacy": () => import("./KhmerLegacy"),
    "modern-minimal": () => import("./ModernMinimal"),
    "fortune-harmony": () => import("./FortuneHarmony"),
    "blossom-romance": () => import("./BlossomRomance"),
    "emerald-garden": () => import("./EmeraldGarden"),
    "nea-m05": () => import("./NeaM05"),
    "anniversary-elegant": () => import("./AnniversaryElegant"),
    "garden-editorial": () => import("./GardenEditorial"),
};

export function preloadTemplate(templateId?: string | null): void {
    if (!templateId) return;
    const importer = TEMPLATE_IMPORTERS[templateId];
    if (importer) {
        importer().catch(() => {});
    }
}
