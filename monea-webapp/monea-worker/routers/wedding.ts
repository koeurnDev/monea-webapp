import { Hono } from 'hono'
import { prisma } from "@/lib/prisma"
import { getServerUser } from "@/lib/auth"
import { sanitizeObject, sanitize } from "@/lib/sanitize"
import { encrypt, decrypt } from "@/lib/encryption"
import { ROLES } from "@/lib/constants"
import { EventType, WeddingStatus } from "@prisma/client"
import { weddingSchema, weddingUpdateSchema } from "@/lib/validations/wedding"
import { isEditingLocked } from "@/lib/permissions"
import { cloudinaryDelete } from "@/lib/cloudinary-edge"
import { publicLimiter, getIP } from "@/lib/ratelimit"
import { z } from "zod"
import { generateWeddingCode } from "@/lib/wedding-code"
import { canUseTemplate } from "../lib/template-licensing"

const weddingRouter = new Hono()


weddingRouter.get('/analytics/stats', async (c) => {
    try {
        const user = await getServerUser(c.req.raw);
        if (!user) {
            console.log("[Wedding Analytics Stats] No authenticated user found");
            return c.json({ error: "Unauthorized" }, 401);
        }

        const weddingId = c.req.query("weddingId");

        if (!weddingId) {
            return c.json({ error: "Missing weddingId" }, 400);
        }

        if (user.role === "STAFF") {
            if ((user as any).weddingId !== weddingId) {
                return c.json({ error: "Forbidden: You do not have access to this wedding" }, 403);
            }
        } else {
            const wedding = await prisma.wedding.findUnique({
                where: { id: weddingId },
                select: { userId: true }
            });
            if (!wedding || wedding.userId !== user.userId) {
                return c.json({ error: "Forbidden: You do not own this wedding" }, 403);
            }
        }

        const stats = await Promise.allSettled([
            (prisma as any).invitationAnalytics.groupBy({
                by: ['type'],
                where: { weddingId },
                _count: { _all: true }
            }),
            (prisma as any).invitationAnalytics.groupBy({
                by: ['deviceType'],
                where: { weddingId, type: "VIEW" },
                _count: { _all: true }
            })
        ]);

        const rawTypeStats = stats[0].status === 'fulfilled' ? (stats[0].value as any[]) : [];
        const rawDeviceStats = stats[1].status === 'fulfilled' ? (stats[1].value as any[]) : [];

        const getCount = (type: string) => {
            const stat = rawTypeStats.find(s => s.type === type);
            if (!stat) return 0;
            return typeof stat._count === 'object' ? (stat._count._all || 0) : (stat._count || 0);
        };

        const totalViews = getCount("VIEW");
        const mapClicks = getCount("MAP_CLICK");
        const saveDateClicks = getCount("SAVE_DATE");
        const rsvpOpens = getCount("RSVP_OPEN");
        const rsvpSubmits = getCount("RSVP_SUBMIT");

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 21);

        let dailyTrendRaw: { day: Date, count: bigint }[] = [];
        try {
            dailyTrendRaw = await prisma.$queryRaw`
                SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
                FROM "InvitationAnalytics"
                WHERE "weddingId" = ${weddingId} 
                  AND "type" = 'VIEW'::"AnalyticsType"
                  AND "createdAt" >= ${sevenDaysAgo}
                GROUP BY day
                ORDER BY day ASC
            `;
        } catch (e: any) {
            console.error("[Stats] Failed to query daily trend:", e.message);
        }

        const trendMap = new Map();
        for (let i = 20; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trendMap.set(d.toISOString().split('T')[0], 0);
        }

        if (Array.isArray(dailyTrendRaw)) {
            dailyTrendRaw.forEach((item) => {
                if (item?.day) {
                    const dayStr = (item.day instanceof Date ? item.day : new Date(item.day)).toISOString().split('T')[0];
                    trendMap.set(dayStr, Number(item.count || 0));
                }
            });
        }

        const formattedTrend = Array.from(trendMap.entries())
            .map(([date, count]) => ({ date, count }));

        return c.json({
            totalViews,
            mapClicks,
            saveDateClicks,
            rsvpOpens,
            rsvpSubmits,
            deviceStats: (rawDeviceStats as any[]).map((s: any) => ({
                type: s.deviceType || 'UNKNOWN',
                count: typeof s._count === 'object' ? (s._count._all || 0) : (s._count || 0)
            })),
            dailyTrend: formattedTrend
        });
    } catch (error) {
        console.error("Analytics Fetch Error:", error);
        return c.json({
            error: "Internal Server Error",
            totalViews: 0,
            mapClicks: 0,
            saveDateClicks: 0,
            deviceStats: [],
            dailyTrend: []
        }, 500);
    }
});

weddingRouter.post('/analytics', async (c) => {
    try {
        const { weddingId, type } = await c.req.json();

        console.log(`[Analytics] POST body: weddingId=${weddingId}, type=${type}`);

        if (!weddingId || !type) {
            console.warn(`[Analytics] 400: Missing required fields. Body: ${JSON.stringify({ weddingId, type })}`);
            return c.json({ error: "Missing required fields" }, 400);
        }

        const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
        const userAgent = c.req.header("user-agent") || "unknown";

        // Web Crypto compatible hash (no Node crypto.createHash)
        const ipHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
        const ipHash    = btoa(Array.from(new Uint8Array(ipHashBuf)).map(b => String.fromCharCode(b)).join("")).slice(0, 16);

        const isMobile = userAgent.toLowerCase().includes("mobile") || userAgent.toLowerCase().includes("android") || userAgent.toLowerCase().includes("iphone");
        const deviceType = isMobile ? "MOBILE" : "DESKTOP";

        await (prisma as any).invitationAnalytics.create({
            data: {
                weddingId,
                type,
                ipHash,
                userAgent: userAgent.slice(0, 255),
                deviceType
            }
        });

        return c.json({ success: true });
    } catch (error) {
        console.error("Analytics Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

weddingRouter.get('/notes', async (c) => {
    const user = await getServerUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const wedding = await prisma.wedding.findFirst({
        where: { userId: user.userId },
        select: { notes: true }
    });

    if (!wedding) return c.json({ error: "Wedding not found" }, 404);

    return c.json({ notes: wedding.notes || "" });
});

weddingRouter.patch('/notes', async (c) => {
    const user = await getServerUser(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { notes } = sanitizeObject<any>(body);

    const wedding = await prisma.wedding.findFirst({
        where: { userId: user.userId }
    });

    if (!wedding) return c.json({ error: "Wedding not found" }, 404);

    const updated = await prisma.wedding.update({
        where: { id: wedding.id },
        data: { notes }
    });

    return c.json({ notes: updated.notes });
});

weddingRouter.post('/rsvp', async (c) => {
    const ip = getIP(c.req.raw as any);
    const { success } = await publicLimiter.limit(ip);
    if (!success) {
        console.warn(`[RateLimit] RSVP spam blocked for IP: ${ip}`);
        return c.json({ error: "Too many requests. Please slow down." }, 429);
    }

    try {
        const body = await c.req.json();
        const { guestId, weddingId, rsvpStatus, adultsCount, childrenCount, rsvpNotes, website, cfTurnstileResponse } = body;

        if (website) {
            console.warn(`[BOT_DETECTION] RSVP Honeypot triggered. Payload:`, { guestId, weddingId, website });
            return c.json({ success: true }); 
        }

        // Verify Turnstile CAPTCHA
        if (!cfTurnstileResponse) {
            return c.json({ error: "Missing CAPTCHA response" }, 400);
        }

        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;
        const isDevEnvironment =
            process.env.NODE_ENV === 'development' || process.env.ENVIRONMENT === 'development';
        const usingTestSecret =
            !turnstileSecret || turnstileSecret === '1x0000000000000000000000000000000AA';

        // Fail closed outside development: never send Cloudflare's always-pass test secret.
        if (usingTestSecret && !isDevEnvironment) {
            console.error(
                '[Turnstile] RSVP blocked: CAPTCHA secret is missing or set to the always-pass test key.'
            );
            return c.json({ error: "CAPTCHA verification is unavailable. Please try again later." }, 503);
        }

        const formData = new FormData();
        formData.append('secret', turnstileSecret || '1x0000000000000000000000000000000AA');
        formData.append('response', cfTurnstileResponse);
        formData.append('remoteip', ip);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const outcome = await verifyRes.json();
        if (!outcome.success) {
            console.warn(`[BOT_DETECTION] Turnstile failed for IP: ${ip}. Error:`, outcome['error-codes']);
            return c.json({ error: "CAPTCHA verification failed. Please try again." }, 403);
        }

        if (!weddingId || !rsvpStatus) {
            return c.json({ error: "Missing required fields" }, 400);
        }

        const sanitizedNotes = rsvpNotes ? sanitize(rsvpNotes) : null;

        if (guestId) {
            const existingGuest = await prisma.guest.findUnique({ 
                where: { id: guestId },
                select: { weddingId: true }
            });

            if (!existingGuest) return c.json({ error: "Guest not found" }, 404);
            if (existingGuest.weddingId !== weddingId) {
                console.error(`[Security] BOLA Attempt: Guest ${guestId} does not belong to wedding ${weddingId}`);
                return c.json({ error: "Access denied" }, 403);
            }

            const updatedGuest = await prisma.guest.update({
                where: { id: guestId },
                data: {
                    rsvpStatus,
                    adultsCount: adultsCount || 1,
                    childrenCount: childrenCount || 0,
                    rsvpNotes: sanitizedNotes,
                    rsvpAt: new Date(),
                }
            });
            return c.json({ success: true, guest: updatedGuest });
        }

        const weddingExists = await prisma.wedding.findUnique({
            where: { id: weddingId },
            select: { id: true }
        });
        
        if (!weddingExists) {
            console.warn(`[Security] Invalid weddingId provided for anonymous RSVP: ${weddingId}`);
            return c.json({ error: "Wedding not found" }, 404);
        }

        const newGuest = await prisma.guest.create({
            data: {
                weddingId,
                name: rsvpNotes?.startsWith("Name: ") ? rsvpNotes.replace("Name: ", "").substring(0, 50) : "General Guest",
                rsvpStatus,
                adultsCount: adultsCount || 1,
                childrenCount: childrenCount || 0,
                rsvpNotes: rsvpNotes || "General RSVP",
                rsvpAt: new Date(),
                source: "WEBSITE_RSVP"
            }
        });

        return c.json({ success: true, guest: newGuest });

    } catch (error) {
        console.error("RSVP Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

weddingRouter.get('/', async (c) => {
    console.log("[Wedding API] GET Request received");
    try {
        const user = await getServerUser(c.req.raw);
        console.log(`[Wedding API Debug] GET. UserRole: ${user?.role}, UserId: ${user?.userId}`);

        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const id = c.req.query("id");
        const full = c.req.query("full") === "true";

        let wedding;
        const include = full ? {
            galleryItems: { orderBy: { id: 'asc' } as any },
            activities: { orderBy: { order: 'asc' } as any }
        } : undefined;

        if (user.role === "STAFF") {
            const staffWeddingId = (user as any).weddingId;
            wedding = await prisma.wedding.findUnique({
                where: { id: staffWeddingId },
                include
            });
        } else if (id) {
            wedding = await prisma.wedding.findUnique({
                where: { id, userId: user.userId },
                include
            });
        } else {
            wedding = await prisma.wedding.findFirst({
                where: { userId: user.userId },
                orderBy: { createdAt: 'desc' },
                include
            });
        }

        if (!wedding) {
            console.log(`[Wedding API Debug] GET. No wedding found for user ${user.userId}`);
            return c.json({});
        }

        const safeWedding = { ...wedding };
        delete (safeWedding as any).paymentInfo; 
        
        try {
            if (wedding.paymentInfo) {
                (safeWedding as any).paymentInfo = await decrypt(wedding.paymentInfo);
            }
        } catch (e: any) {
            console.error(`[Wedding API Debug] Decryption failure: ${e.message}`);
        }

        let responseData: any = safeWedding;
        if (wedding && wedding.themeSettings) {
            try {
                const parsed = typeof wedding.themeSettings === 'string' 
                    ? JSON.parse(wedding.themeSettings) 
                    : wedding.themeSettings;
                responseData = { ...safeWedding, themeSettings: parsed };
            } catch (e) {
                responseData = { ...safeWedding, themeSettings: {} };
            }
        }

        return c.json(responseData);
    } catch (error: any) {
        console.error(`[Wedding GET ERROR] ${error.message}`, { stack: error.stack });
        return c.json({ error: "Internal Server Error in Wedding GET", details: error.message }, 500);
    }
});

weddingRouter.post('/', async (c) => {
    console.log("[Wedding API] POST Request received");
    try {
        const user = await getServerUser(c.req.raw);
        console.log(`[Wedding API Debug] POST. UserRole: ${user?.role}`);

        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const existingWedding = await prisma.wedding.findFirst({
            where: { userId: user.userId }
        });
        
        if (existingWedding) {
            return c.json({ error: "Wedding already exists" }, 409);
        }

        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        const validated = weddingSchema.safeParse(body);
        if (!validated.success) return c.json({ error: validated.error.issues }, 400);

        const sanitizedData = sanitizeObject<any>(validated.data);
        const { groomName, brideName, date, location, eventType, paymentInfo } = sanitizedData;

        const wedding = await prisma.wedding.create({
            data: {
                userId: user.userId,
                weddingCode: generateWeddingCode(),
                groomName: groomName || "Groom",
                brideName: brideName || "Bride",
                date: date,
                location: location,
                status: "ACTIVE" as WeddingStatus,
                eventType: eventType || "wedding",
                paymentInfo: paymentInfo ? await encrypt(paymentInfo) : null,
                themeSettings: sanitizedData.themeSettings || {},
            }
        });

        if (wedding.paymentInfo) {
            wedding.paymentInfo = await decrypt(wedding.paymentInfo);
        }

        console.log(`[Wedding API Debug] POST Success. WeddingId: ${wedding.id}`);
        return c.json(wedding);
    } catch (error: any) {
        console.error(`[Wedding API Debug] POST CRASH: ${error.message}`, error);
        return c.json({ error: "Internal Server Error in Wedding POST", details: error.message }, 500);
    }
});

weddingRouter.put('/', async (c) => {
    try {
        const user = await getServerUser(c.req.raw);
        console.log(`[Wedding API Debug] PUT. UserRole: ${user?.role}`);

        if (!user) return c.json({ error: "Unauthorized" }, 401);

        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        const validated = weddingUpdateSchema.safeParse(body);
        if (!validated.success) return c.json({ error: validated.error.issues }, 400);

        const sanitizedBody = sanitizeObject<any>(validated.data);
        const { status, templateId, groomName, brideName, location, date, eventType, paymentInfo, weddingId } = sanitizedBody;

        let wedding;
        const includeObj = { galleryItems: true, activities: true };
        if (user.role === "STAFF") {
            wedding = await prisma.wedding.findUnique({ where: { id: (user as any).weddingId }, include: includeObj });
        } else if (weddingId) {
            wedding = await prisma.wedding.findUnique({ where: { id: weddingId, userId: user.userId }, include: includeObj });
        }

        // Fallback: If weddingId wasn't provided or didn't match, find the user's latest wedding
        if (!wedding && user.userId) {
            wedding = await prisma.wedding.findFirst({
                where: { userId: user.userId },
                orderBy: { createdAt: 'desc' },
                include: includeObj
            });
        }

        let currentTheme = {};
        if (wedding && wedding.themeSettings) {
            try {
                currentTheme = typeof wedding.themeSettings === 'string'
                    ? JSON.parse(wedding.themeSettings)
                    : wedding.themeSettings;
            } catch (e) {
                console.error("[Wedding API] Failed to parse existing themeSettings", e);
            }
        }

        const mergedTheme = sanitizedBody.themeSettings !== undefined ? {
            ...(sanitizedBody.themeSettings || {}),
            ...(sanitizedBody.galleryItems ? { galleryItems: sanitizedBody.galleryItems } : {})
        } : currentTheme;

        // If user still has no wedding in database, CREATE one automatically
        if (!wedding && user.userId) {
            wedding = await prisma.wedding.create({
                data: {
                    userId: user.userId,
                    weddingCode: generateWeddingCode(),
                    groomName: groomName || "Groom",
                    brideName: brideName || "Bride",
                    date: date ? new Date(date) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    location: location || "",
                    status: (status as WeddingStatus) || "ACTIVE",
                    templateId: templateId || "khmer-legacy",
                    eventType: (eventType as EventType) || "wedding",
                    themeSettings: mergedTheme,
                },
                include: includeObj
            });
            console.log(`[Wedding API Debug] Auto-created new wedding for user ${user.userId}. WeddingId: ${wedding.id}`);
        }

        if (!wedding) {
            return c.json({ error: "Wedding not found or access denied" }, 404);
        }

        if (isEditingLocked(wedding as any) && user.role !== ROLES.PLATFORM_OWNER) {
            return c.json({ error: "Editing is locked for this wedding. Please upgrade or contact support." }, 403);
        }

        // Template validation - check per-template licensing
        if (templateId && templateId !== wedding.templateId) {
            const canAccess = await canUseTemplate(wedding.id, templateId);
            if (!canAccess) {
                return c.json({
                    error: "This template requires a license. Please purchase it to use this template.",
                    code: "TEMPLATE_LICENSE_REQUIRED",
                }, 403);
            }
        }

        const updateData: any = {
            ...(status && { status: status as WeddingStatus }),
            ...(templateId && { templateId }),
            ...(groomName !== undefined && { groomName: groomName || "" }),
            ...(brideName !== undefined && { brideName: brideName || "" }),
            ...(location !== undefined && { location: location || "" }),
            ...(date && !isNaN(new Date(date).getTime()) && { date: new Date(date) }),
            ...(eventType && { eventType: eventType as EventType }),
            ...(paymentInfo && { paymentInfo: await encrypt(paymentInfo) }),
            themeSettings: mergedTheme
        };
        console.log("[Wedding API] Merged Theme to save:", mergedTheme);

        if (sanitizedBody.themeSettings) {
            const oldHeroPublicId = (currentTheme as any)?.heroImagePublicId;
            const newHeroPublicId = sanitizedBody.themeSettings.heroImagePublicId;
            if (oldHeroPublicId && newHeroPublicId && oldHeroPublicId !== newHeroPublicId) {
                try {
                    await cloudinaryDelete(oldHeroPublicId, 'image');
                    console.log(`[Cloudinary] Deleted old hero image: ${oldHeroPublicId}`);
                } catch (e: any) {
                    console.error(`[Cloudinary] Failed to delete old hero image:`, e.message);
                }
            }

            const oldMusicPublicId = (currentTheme as any)?.musicUrlPublicId;
            const newMusicPublicId = sanitizedBody.themeSettings.musicUrlPublicId;
            if (oldMusicPublicId && newMusicPublicId && oldMusicPublicId !== newMusicPublicId) {
                try {
                    await cloudinaryDelete(oldMusicPublicId, 'video');
                    console.log(`[Cloudinary] Deleted old music file: ${oldMusicPublicId}`);
                } catch (e: any) {
                    console.error(`[Cloudinary] Failed to delete old music file:`, e.message);
                }
            }
        }

        if (sanitizedBody.galleryItems) {
            const incomingPublicIds = sanitizedBody.galleryItems.map((item: any) => item?.publicId).filter(Boolean);
            const deletedGalleryItems = (wedding as any).galleryItems?.filter((item: any) => item.publicId && !incomingPublicIds.includes(item.publicId)) || [];
            
            for (const item of deletedGalleryItems) {
                try {
                    await cloudinaryDelete(item.publicId, item.type === 'VIDEO' ? 'video' : 'image');
                    console.log(`[Cloudinary] Deleted orphaned gallery item: ${item.publicId}`);
                } catch (e: any) {
                    console.error(`[Cloudinary] Failed to delete orphaned gallery item ${item.publicId}:`, e.message);
                }
            }

            updateData.galleryItems = {
                deleteMany: {},
                create: sanitizedBody.galleryItems
                    .map((item: any, idx: number) => ({
                        url: item?.url || "",
                        publicId: item?.publicId || null,
                        type: item?.type || 'IMAGE',
                        caption: item?.caption || `slot:${idx}`
                    }))
                    .filter((item: any) => item.url || item.publicId)
            };
        }

        if (sanitizedBody.activities) {
            const incomingActivityPublicIds = sanitizedBody.activities.map((item: any) => item.publicId).filter(Boolean);
            const deletedActivities = (wedding as any).activities?.filter((item: any) => item.publicId && !incomingActivityPublicIds.includes(item.publicId)) || [];
            
            for (const item of deletedActivities) {
                try {
                    await cloudinaryDelete(item.publicId, 'image');
                    console.log(`[Cloudinary] Deleted orphaned activity image: ${item.publicId}`);
                } catch (e: any) {
                    console.error(`[Cloudinary] Failed to delete orphaned activity image ${item.publicId}:`, e.message);
                }
            }

            updateData.activities = {
                deleteMany: {},
                create: sanitizedBody.activities.map((item: any) => ({
                    title: item.title || "Activity",
                    time: item.time || "",
                    description: item.description || "",
                    icon: item.icon || null,
                    publicId: item.publicId || null,
                    order: item.order || 0
                }))
            };
        }

        wedding = await prisma.wedding.update({
            where: { id: wedding.id },
            data: updateData,
            include: includeObj
        });

        if (wedding.paymentInfo) {
            wedding.paymentInfo = await decrypt(wedding.paymentInfo);
        }

        console.log(`[Wedding API Debug] PUT Success. WeddingId: ${wedding.id}`);
        return c.json(wedding);
    } catch (error: any) {
        console.error(`[Wedding API Debug] PUT CRASH: ${error.message}`, error);
        return c.json({ error: "Internal Server Error in Wedding PUT", details: error.message }, 500);
    }
});

// Public endpoint for wedding lookup (for static export)
weddingRouter.get('/:id', async (c) => {
    try {
        const weddingId = c.req.param("id");
        
        const wedding = await prisma.wedding.findUnique({
            where: { id: weddingId },
            include: {
                activities: { orderBy: { order: 'asc' } },
                galleryItems: { orderBy: { createdAt: 'asc' }, take: 50 },
            },
        });

        if (!wedding) {
            return c.json({ error: "Wedding not found" }, 404);
        }

        // Enable edge caching for 60 seconds (Cloudflare will serve from cache to prevent DB overload)
        c.header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120');

        let parsedThemeSettings: any = wedding.themeSettings;
        if (typeof parsedThemeSettings === 'string') {
            try {
                parsedThemeSettings = JSON.parse(parsedThemeSettings);
            } catch (e) {
                parsedThemeSettings = {};
            }
        }

        let galleryItems: any[] = wedding.galleryItems;
        if (parsedThemeSettings?.galleryItems && Array.isArray(parsedThemeSettings.galleryItems)) {
            galleryItems = parsedThemeSettings.galleryItems;
        } else if (galleryItems && Array.isArray(galleryItems)) {
            const reconstructed: any[] = [];
            galleryItems.forEach((item: any, idx: number) => {
                if (item.caption?.startsWith("slot:")) {
                    const slotIdx = parseInt(item.caption.replace("slot:", ""), 10);
                    if (!isNaN(slotIdx)) {
                        reconstructed[slotIdx] = item;
                        return;
                    }
                }
                reconstructed[idx] = item;
            });
            galleryItems = reconstructed;
        }

        // Return only public fields
        return c.json({
            id: wedding.id,
            groomName: wedding.groomName,
            brideName: wedding.brideName,
            date: wedding.date,
            location: wedding.location,
            eventType: wedding.eventType,
            templateId: wedding.templateId,
            themeSettings: parsedThemeSettings || {},
            activities: wedding.activities,
            galleryItems: galleryItems,
        });
    } catch (error: any) {
        console.error("[Wedding GET]", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

export default weddingRouter;
