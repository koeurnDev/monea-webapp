export function isEditingLocked(wedding: any): boolean {
    if (!wedding) return true;
    if (process.env.NODE_ENV === "development") return false; // Unlock for local development

    // With per-template licensing, editing is only locked for administrative reasons
    // Template access is controlled via template licenses instead
    if (wedding.status === "SUSPENDED" || wedding.status === "DISABLED" || wedding.status === "ARCHIVED") {
        return true;
    }

    return false;
}
