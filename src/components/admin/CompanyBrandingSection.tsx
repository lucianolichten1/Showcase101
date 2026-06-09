import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BarChart3, ImagePlus, Loader2, Palette, Trash2 } from "lucide-react";
import {
  removeCompanyLogo,
  saveCompanyBranding,
  uploadCompanyLogo,
} from "@/domains/admin/companyBrandingService";
import { DEFAULT_COMPANY_BRANDING } from "@/domains/company/branding";
import type { CompanyBranding, CompanyRecord } from "@/domains/admin/types";
import { AdminButton } from "./ui/AdminButton";

interface Props {
  company: CompanyRecord;
  onUpdated: (company: CompanyRecord) => void;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_COMPANY_BRANDING.primaryColor;

  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-semibold text-[var(--admin-ink-2)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-md border border-[var(--admin-line)] bg-white p-0.5"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#166534"
          className="admin-input flex-1 font-mono text-[13px]"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function brandingFromCompany(company: CompanyRecord): CompanyBranding {
  return { ...company.branding };
}

export function CompanyBrandingSection({ company, onUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CompanyBranding>(() => brandingFromCompany(company));
  const [logoPreview, setLogoPreview] = useState<string | null>(company.branding.logoUrl);
  const [logoBroken, setLogoBroken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDraft(brandingFromCompany(company));
    setLogoPreview(company.branding.logoUrl);
    setLogoBroken(false);
  }, [company]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const resolvedDisplayName = draft.displayName?.trim() || company.name;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCompanyBranding(company.id, {
        displayName: draft.displayName?.trim() || null,
        primaryColor: draft.primaryColor,
      });
      onUpdated(updated);
      setSuccess("Appearance saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save appearance.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    try {
      const logoUrl = await uploadCompanyLogo(company.id, file);
      setLogoPreview(logoUrl);
      setLogoBroken(false);
      setDraft((prev) => ({ ...prev, logoUrl }));
      onUpdated({
        ...company,
        branding: { ...company.branding, logoUrl },
      });
      setSuccess("Logo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setError(null);
    try {
      const updated = await removeCompanyLogo(company.id);
      setLogoPreview(null);
      setLogoBroken(false);
      setDraft((prev) => ({ ...prev, logoUrl: null }));
      onUpdated(updated);
      setSuccess("Logo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const showLogoImage = logoPreview && !logoBroken;

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      <div
        className="rounded-lg border border-[var(--admin-line)] bg-[#FBFBF9] p-3"
        style={{ borderColor: `${draft.primaryColor}33` }}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-ink-3)]">
          Live preview
        </p>
        <div className="flex items-center gap-2.5">
          {showLogoImage ? (
            <img
              src={logoPreview}
              alt=""
              className="max-h-8 w-auto shrink-0 object-contain"
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: draft.primaryColor }}
            >
              <BarChart3 className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-900">{resolvedDisplayName}</p>
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: draft.primaryColor }}
            >
              Company workspace
            </p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-[var(--admin-ink-2)]">
          Display name
        </span>
        <input
          type="text"
          value={draft.displayName ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, displayName: e.target.value || null }))
          }
          placeholder={company.name}
          className="admin-input w-full"
        />
        <span className="mt-1 block text-[11.5px] text-[var(--admin-ink-3)]">
          Shown in the company sidebar. Leave blank to use &ldquo;{company.name}&rdquo;.
        </span>
      </label>

      <div>
        <span className="mb-1 block text-[12.5px] font-semibold text-[var(--admin-ink-2)]">
          Logo
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {showLogoImage ? (
            <div className="flex min-h-12 items-center rounded-lg border border-[var(--admin-line)] bg-white px-2 py-1">
              <img
                src={logoPreview}
                alt=""
                className="max-h-12 w-auto object-contain"
                onError={() => setLogoBroken(true)}
              />
            </div>
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--admin-line)] text-white"
              style={{ backgroundColor: draft.primaryColor }}
            >
              <BarChart3 className="h-5 w-5" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleLogoSelect(e)}
          />
          <AdminButton
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Upload logo
          </AdminButton>
          {logoPreview && (
            <AdminButton
              type="button"
              size="sm"
              onClick={() => void handleRemoveLogo()}
              disabled={uploadingLogo}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </AdminButton>
          )}
        </div>
        <span className="mt-1 block text-[11.5px] text-[var(--admin-ink-3)]">
          Any image format. Converted to WebP on upload. Max 5 MB input.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        <ColorField
          label="Primary color"
          value={draft.primaryColor}
          onChange={(value) => setDraft((prev) => ({ ...prev, primaryColor: value }))}
        />
      </div>

      {error && (
        <p className="text-[12.5px] text-[var(--admin-rust)]" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-[12.5px] text-[var(--admin-green-ink)]" role="status">
          {success}
        </p>
      )}

      <div className="flex justify-end">
        <AdminButton type="submit" variant="primary" size="sm" disabled={saving || uploadingLogo}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Palette className="h-3.5 w-3.5" />
          )}
          Save appearance
        </AdminButton>
      </div>
    </form>
  );
}
