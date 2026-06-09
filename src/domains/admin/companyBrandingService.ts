import { supabase } from "@/lib/supabase";
import { convertImageFileToWebp } from "@/lib/convertImageToWebp";
import { isValidHexColor } from "@/domains/company/branding";
import { updateCompanyBranding } from "./companyService";
import type { CompanyBrandingPatch, CompanyRecord } from "./types";

const LOGO_BUCKET = "company-logos";
const LOGO_PATH_SUFFIX = "logo.webp";

function logoStoragePath(companyId: string): string {
  return `${companyId}/${LOGO_PATH_SUFFIX}`;
}

function publicLogoUrl(path: string): string {
  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Legacy formats from before WebP-only storage. */
const LEGACY_LOGO_PATHS = (companyId: string) =>
  ["png", "jpg", "jpeg", "svg"].map((ext) => `${companyId}/logo.${ext}`);

export function validateBrandingPatch(patch: CompanyBrandingPatch): string | null {
  if (patch.primaryColor !== undefined && !isValidHexColor(patch.primaryColor)) {
    return "Primary color must be a valid hex value (e.g. #166534).";
  }
  return null;
}

export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<string> {
  const webpBlob = await convertImageFileToWebp(file);
  const path = logoStoragePath(companyId);

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, webpBlob, { upsert: true, contentType: "image/webp" });

  if (uploadError) throw new Error(uploadError.message);

  // Clean up legacy logo files if present.
  await supabase.storage.from(LOGO_BUCKET).remove(LEGACY_LOGO_PATHS(companyId));

  const logoUrl = publicLogoUrl(path);
  await updateCompanyBranding(companyId, { logoUrl });
  return logoUrl;
}

export async function removeCompanyLogo(companyId: string): Promise<CompanyRecord> {
  await supabase.storage
    .from(LOGO_BUCKET)
    .remove([logoStoragePath(companyId), ...LEGACY_LOGO_PATHS(companyId)]);

  return updateCompanyBranding(companyId, { logoUrl: null });
}

export async function saveCompanyBranding(
  companyId: string,
  patch: CompanyBrandingPatch
): Promise<CompanyRecord> {
  const validationError = validateBrandingPatch(patch);
  if (validationError) throw new Error(validationError);
  return updateCompanyBranding(companyId, patch);
}
