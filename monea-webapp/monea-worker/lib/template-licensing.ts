/**
 * Template Licensing Module - Webapp Stub
 * Simplified version for webapp worker
 * Full implementation is in monea-api-worker
 */

/**
 * Check if wedding can use a specific template
 * Stub: Always returns true for webapp builds
 */
export async function canUseTemplate(
  weddingId: string,
  templateId: string,
  _prisma?: any
): Promise<boolean> {
  // Stub implementation - validation happens on API worker
  return true;
}

/**
 * Get active templates for a wedding
 * Stub: Returns empty array for webapp builds
 */
export async function getActiveTemplates(
  weddingId: string,
  _prisma?: any
): Promise<string[]> {
  // Stub implementation - actual data comes from API worker
  return [];
}

/**
 * Check if wedding has legacy package
 */
export function hasLegacyPackage(wedding: any): boolean {
  if (!wedding) return false;
  const packageType = wedding.packageType;
  return packageType === 'PRO' || packageType === 'PREMIUM';
}

/**
 * Get template access info
 */
export async function getTemplateAccessInfo(
  weddingId: string,
  templateId: string,
  _prisma?: any
): Promise<{
  canUse: boolean;
  reason: string;
  license?: any;
}> {
  return {
    canUse: true,
    reason: 'STUB',
  };
}
