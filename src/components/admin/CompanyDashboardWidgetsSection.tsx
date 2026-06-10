import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { saveCompanyDashboardWidgets } from "@/domains/admin/companyDashboardWidgetsService";
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  type DashboardWidgetKind,
} from "@/domains/admin/dashboardWidgets";
import type { CompanyRecord } from "@/domains/admin/types";
import { AdminButton } from "./ui/AdminButton";

interface Props {
  company: CompanyRecord;
  onUpdated: (company: CompanyRecord) => void;
}

function WidgetToggleGrid({
  kind,
  enabled,
  onToggle,
}: {
  kind: DashboardWidgetKind;
  enabled: string[];
  onToggle: (key: string) => void;
}) {
  const widgets = DASHBOARD_WIDGET_DEFINITIONS.filter((w) => w.kind === kind);

  return (
    <div className="admin-mod-grid">
      {widgets.map((widget) => {
        const on = enabled.includes(widget.key);
        return (
          <div
            key={widget.key}
            className={`admin-mod${on ? " on" : ""}`}
            onClick={() => onToggle(widget.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(widget.key);
              }
            }}
            role="button"
            tabIndex={0}
            title={widget.description}
          >
            <span className="admin-mod-name">{widget.name}</span>
            <span className="admin-toggle" />
          </div>
        );
      })}
    </div>
  );
}

export function CompanyDashboardWidgetsSection({ company, onUpdated }: Props) {
  const [enabled, setEnabled] = useState<string[]>(company.enabledDashboardWidgets);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(company.enabledDashboardWidgets);
  }, [company]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const handleToggle = (key: string) => {
    setEnabled((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((k) => k !== key);
        return next.length > 0 ? next : prev;
      }
      return [...prev, key];
    });
    setError(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCompanyDashboardWidgets(company.id, enabled);
      onUpdated(updated);
      setEnabled(updated.enabledDashboardWidgets);
      setSuccess("Charts and KPIs saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save charts and KPIs.");
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = enabled.filter((key) =>
    DASHBOARD_WIDGET_DEFINITIONS.some((w) => w.key === key)
  ).length;

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-ink-3)]">
          KPIs
        </p>
        <WidgetToggleGrid kind="kpi" enabled={enabled} onToggle={handleToggle} />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-ink-3)]">
          Charts
        </p>
        <WidgetToggleGrid kind="chart" enabled={enabled} onToggle={handleToggle} />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-ink-3)]">
          Inventory
        </p>
        <WidgetToggleGrid kind="inventory" enabled={enabled} onToggle={handleToggle} />
      </div>

      <p className="text-[11.5px] text-[var(--admin-ink-3)]">
        {enabledCount}/{DASHBOARD_WIDGET_DEFINITIONS.length} enabled on the company dashboard.
        At least one must stay on.
      </p>

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
        <AdminButton type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save charts & KPIs
        </AdminButton>
      </div>
    </form>
  );
}
