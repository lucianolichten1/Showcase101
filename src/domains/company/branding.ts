import type { CompanyBranding, CompanyRecord } from "@/domains/admin/types";

export const DEFAULT_COMPANY_BRANDING: CompanyBranding = {
  displayName: null,
  primaryColor: "#166534",
  logoUrl: null,
};

export const PLATFORM_DISPLAY_NAME = "AI Finance OS";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

function normalizeColor(value: string | null | undefined, fallback: string): string {
  if (value && isValidHexColor(value)) return value.trim();
  return fallback;
}

/** Merges stored branding with defaults; display name falls back to company name. */
export function resolveCompanyBranding(
  company: CompanyRecord | null | undefined
): CompanyBranding & { resolvedDisplayName: string } {
  if (!company) {
    return {
      ...DEFAULT_COMPANY_BRANDING,
      resolvedDisplayName: PLATFORM_DISPLAY_NAME,
    };
  }

  const displayName = company.branding.displayName?.trim() || company.name;

  return {
    displayName: company.branding.displayName,
    primaryColor: normalizeColor(
      company.branding.primaryColor,
      DEFAULT_COMPANY_BRANDING.primaryColor
    ),
    logoUrl: company.branding.logoUrl,
    resolvedDisplayName: displayName,
  };
}

export function brandingToCssVars(
  branding: CompanyBranding & { resolvedDisplayName?: string }
): Record<string, string> {
  return {
    "--company-primary": branding.primaryColor,
  };
}
