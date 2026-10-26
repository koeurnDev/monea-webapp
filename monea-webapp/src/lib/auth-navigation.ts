export function getPostLoginPath(isPlatformOwner: boolean, from: unknown, origin: string): string {
    const fallback = isPlatformOwner ? "/admin" : "/dashboard";
    if (!from || typeof from !== "object") return fallback;

    const target = from as { pathname?: unknown; search?: unknown; hash?: unknown };
    if (
        typeof target.pathname !== "string" ||
        !target.pathname.startsWith("/") ||
        target.pathname.startsWith("//") ||
        target.pathname.includes("\\")
    ) {
        return fallback;
    }

    const search = typeof target.search === "string" ? target.search : "";
    const hash = typeof target.hash === "string" ? target.hash : "";
    let url: URL;
    try {
        url = new URL(`${target.pathname}${search}${hash}`, origin);
    } catch {
        return fallback;
    }
    if (url.origin !== origin) return fallback;

    const isDashboardPath = url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");
    const isAdminPath = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
    if (isDashboardPath || (isAdminPath && isPlatformOwner)) {
        return `${url.pathname}${url.search}${url.hash}`;
    }
    return fallback;
}
