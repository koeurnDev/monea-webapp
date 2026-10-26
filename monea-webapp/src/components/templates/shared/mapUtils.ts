/**
 * Safe Google Maps URL utilities for MONEA templates.
 * Prevents X-Frame-Options Denied errors in iframes and creates reliable navigation links.
 */

interface MapCoordinates {
    latitude: number;
    longitude: number;
}

export function isGoogleMapsShortLink(value?: string | null): boolean {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:"
            && (url.hostname === "maps.app.goo.gl" || url.hostname === "goo.gl");
    } catch {
        return false;
    }
}

function parseCoordinates(value: string): MapCoordinates | null {
    const match = value.match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (!match) return null;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (
        !Number.isFinite(latitude)
        || !Number.isFinite(longitude)
        || latitude < -90
        || latitude > 90
        || longitude < -180
        || longitude > 180
    ) {
        return null;
    }
    return { latitude, longitude };
}

function getMapCoordinates(location: string): MapCoordinates | null {
    const candidates = [location];
    try {
        const decoded = decodeURIComponent(location);
        if (decoded !== location) candidates.push(decoded);
    } catch {
        // Keep processing the original URL if it contains malformed escapes.
    }

    for (const candidate of candidates) {
        const latitudeLongitude = candidate.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
        if (latitudeLongitude) {
            const coordinates = parseCoordinates(`${latitudeLongitude[1]},${latitudeLongitude[2]}`);
            if (coordinates) return coordinates;
        }

        const longitudeLatitude = candidate.match(/!2d(-?\d{1,3}(?:\.\d+)?)!3d(-?\d{1,3}(?:\.\d+)?)/);
        if (longitudeLatitude) {
            const coordinates = parseCoordinates(`${longitudeLatitude[2]},${longitudeLatitude[1]}`);
            if (coordinates) return coordinates;
        }
    }

    for (const candidate of candidates) {
        try {
            const url = new URL(candidate);
            for (const key of ["q", "query", "ll", "destination", "center"]) {
                const coordinates = parseCoordinates(url.searchParams.get(key) || "");
                if (coordinates) return coordinates;
            }
        } catch {
            // A non-URL location can still be a plain coordinate pair.
        }
    }

    for (const candidate of candidates) {
        const viewportCoordinates = candidate.match(/@(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/);
        if (viewportCoordinates) {
            const coordinates = parseCoordinates(`${viewportCoordinates[1]},${viewportCoordinates[2]}`);
            if (coordinates) return coordinates;
        }
    }

    return parseCoordinates(location);
}

function getGoogleMapsCid(location: string): string | null {
    const match = location.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i);
    if (!match) return null;

    try {
        return BigInt(`0x${match[1]}`).toString();
    } catch {
        return null;
    }
}

export const getMapEmbedUrl = (location?: string | null, venueName?: string | null): string => {
    const loc = (location || "").trim();
    const venue = (venueName || "").trim();

    // If it's already an embed URL, return as is
    if (loc.includes("google.com/maps/embed")) {
        return loc;
    }

    const placeCid = getGoogleMapsCid(loc);
    if (placeCid) {
        return `https://www.google.com/maps?output=embed&cid=${placeCid}`;
    }

    const coordinates = getMapCoordinates(loc);
    if (coordinates) {
        const query = `${coordinates.latitude},${coordinates.longitude}`;
        return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }

    // Use the original Google Maps search query when it is not a dropped-pin URL.
    if (loc.includes("google.com")) {
        try {
            const url = new URL(loc);
            for (const key of ["q", "query"]) {
                const query = url.searchParams.get(key);
                if (query?.trim()) {
                    return `https://maps.google.com/maps?q=${encodeURIComponent(query.trim())}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
                }
            }
        } catch {
            // Fall back to the venue name when the supplied maps URL is invalid.
        }
    }

    // If location is a raw URL or "https://maps.google.com", prioritize venue name
    let query = venue;
    if (!query && loc && !loc.startsWith("http")) {
        query = loc;
    }
    if (!query) {
        query = "Koh Pich Convention and Exhibition Centre Phnom Penh Cambodia";
    }

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
};

export const getDirectMapUrl = (location?: string | null, venueName?: string | null): string => {
    const loc = (location || "").trim();
    const venue = (venueName || "").trim();

    if (loc.startsWith("http://") || loc.startsWith("https://")) {
        if (loc !== "https://maps.google.com" && loc !== "https://maps.google.com/") {
            return loc;
        }
    }

    const query = venue || (loc && !loc.startsWith("http") ? loc : "Koh Pich Convention and Exhibition Centre Phnom Penh Cambodia");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
