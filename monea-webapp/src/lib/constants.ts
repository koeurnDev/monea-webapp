/**
 * MONEA Platform Roles
 * 
 * Terminology for Developers & UI:
 * - PLATFORM_OWNER (SUPERADMIN): Controls the entire platform, manages all events and users.
 * - EVENT_STAFF (STAFF): Support Staff or Admin Assistant who helps manage the platform.
 * - EVENT_MANAGER (ADMIN): The user who owns/manages a specific wedding/event.
 */

export const ROLES = {
    PLATFORM_OWNER: "SUPERADMIN",
    EVENT_MANAGER: "ADMIN",
    EVENT_STAFF: "STAFF"
} as const;

export const ROLE_LABELS: Record<Role, string> = {
    [ROLES.PLATFORM_OWNER]: "Superadmin",
    [ROLES.EVENT_STAFF]: "Support Staff",
    [ROLES.EVENT_MANAGER]: "User"
};

export type Role = typeof ROLES[keyof typeof ROLES];

// Helper to check if a user is an owner/admin of the platform
export const isPlatformOwner = (role: string) => role === ROLES.PLATFORM_OWNER;

// Helper to check if a user is an event manager
export const isEventManager = (role: string) => role === ROLES.EVENT_MANAGER;

// Helper to check if a user is event staff
export const isEventStaff = (role: string) => role === ROLES.EVENT_STAFF;
// --- Middleware & Auth Specific Constants ---

export const COOKIE_NAMES = {
    TOKEN: "token",
    STAFF_TOKEN: "staff_token",
    REFRESH_TOKEN: "refresh_token",
} as const;

export const AUTH_URLS = {
    SIGN_IN: "/sign-in",
    SIGN_UP: "/sign-up",
    DASHBOARD: "/dashboard",
} as const;

export const JWT_CONFIG = {
    ISSUER: "monea:app",
    AUDIENCE: {
        USER: "user",
        STAFF: "staff",
        ADMIN: "admin",
    },
} as const;

export const BLOCKED_BOTS = [
    "python-requests", "curl", "wget", "headlesschrome", "puppeteer", 
    "playwright", "phantomjs", "scrapy", "urllib",
    "GPTBot", "CCBot", "ChatGPT-User", "Omgilibot", "FacebookBot", "PerplexityBot",
    "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot",
    "sogou", "exabot", "facebot", "ia_archiver"
];

export const SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=(), xr-spatial-tracking=()",
    "Content-Security-Policy": 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://upload-widget.cloudinary.com https://browser.sentry-cdn.com https://accounts.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: blob: https://media.moneoez.com https://res.cloudinary.com https://ik.imagekit.io https://images.unsplash.com https://plus.unsplash.com https://*.google.com https://*.gstatic.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://youtube.com https://upload-widget.cloudinary.com https://accounts.google.com https://maps.google.com https://www.google.com; " +
        "connect-src 'self' https://api.moneoez.com https://*.r2.cloudflarestorage.com https://challenges.cloudflare.com https://api.cloudinary.com https://upload-widget.cloudinary.com https://res.cloudinary.com https://upload.imagekit.io https://api.imagekit.io https://ik.imagekit.io https://*.sentry.io wss:; " +
        "media-src 'self' data: blob: https://media.moneoez.com https://res.cloudinary.com https://ik.imagekit.io; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "frame-ancestors 'self'; " +
        "form-action 'self';",
} as const;
