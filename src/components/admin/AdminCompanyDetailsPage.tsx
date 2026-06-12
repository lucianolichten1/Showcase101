import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  CheckSquare,
  Clock,
  Database,
  ExternalLink,
  Grid3X3,
  Loader2,
  MessageSquare,
  Palette,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { deleteCompany, getCompanyById } from "@/domains/admin/companyService";
import type { CompanyOwnerInfo } from "@/domains/admin/companyOwnerService";
import {
  BASE_FINANCIAL_MODULE_DEFINITIONS,
  DASHBOARD_MODULE_KEY,
  DEFAULT_ENABLED_MODULES,
  isModuleEnabled,
} from "@/domains/admin/modules";
import {
  loadCompanyEnabledModules,
  removeCompanyEnabledModules,
  saveCompanyEnabledModules,
} from "@/domains/admin/moduleStorage";
import { getNicheDisplayName } from "@/domains/admin/niches";
import {
  buildChecklistSteps,
  buildInitialActivity,
  checklistDoneCount,
  companyCodeFromRecord,
  IMPORT_META,
  STATUS_META,
  toCompanyCardModel,
  type AdminActivityItem,
  type AdminChecklistStep,
  type AdminNoteItem,
} from "@/domains/admin/displayModel";
import type { CompanyRecord } from "@/domains/admin/types";
import { formatCreatedDate } from "@/domains/admin/utils";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { CompanyBrandingSection } from "./CompanyBrandingSection";
import { CompanyDashboardWidgetsSection } from "./CompanyDashboardWidgetsSection";
import { CompanyOwnerSection } from "./CompanyOwnerSection";
import { DeleteCompanyDialog } from "./DeleteCompanyDialog";
import { AdminButton } from "./ui/AdminButton";
import { AdminPanel } from "./ui/AdminPanel";
import { AdminPill } from "./ui/AdminPill";

export function AdminCompanyDetailsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [owner, setOwner] = useState<CompanyOwnerInfo | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([
    ...DEFAULT_ENABLED_MODULES,
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checklist, setChecklist] = useState<AdminChecklistStep[]>([]);
  const [notes, setNotes] = useState<AdminNoteItem[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [importLabel, setImportLabel] = useState("Queued");
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [showOwnerAssignForm, setShowOwnerAssignForm] = useState(false);
  const [showDeleteCompany, setShowDeleteCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [deleteCompanyError, setDeleteCompanyError] = useState<string | null>(null);
  const ownerSectionRef = useRef<HTMLDivElement>(null);

  const openOwnerAssignForm = useCallback(() => {
    setShowOwnerAssignForm(true);
    window.requestAnimationFrame(() => {
      ownerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const handleDeleteCompany = useCallback(async () => {
    if (!company) return;

    setDeletingCompany(true);
    setDeleteCompanyError(null);
    try {
      await deleteCompany(company.id);
      removeCompanyEnabledModules(company.id);
      setShowDeleteCompany(false);
      navigate("/admin/companies", { replace: true });
    } catch (err) {
      setDeleteCompanyError(getSupabaseErrorMessage(err, "Failed to delete company."));
    } finally {
      setDeletingCompany(false);
    }
  }, [company, navigate]);

  const loadCompany = useCallback(async () => {
    if (!companyId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const record = await getCompanyById(companyId);
      setCompany(record);
      if (record) {
        setEnabledModules(
          loadCompanyEnabledModules(record.id, record.enabledModules)
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company.");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  const initializedCompanyId = useRef<string | null>(null);

  useEffect(() => {
    if (!company) return;
    if (initializedCompanyId.current === company.id) return;

    initializedCompanyId.current = company.id;
    setOwner(null);
    setEnabledModules(
      loadCompanyEnabledModules(company.id, company.enabledModules)
    );
    setChecklist(
      buildChecklistSteps(company, null, company.enabledModules.length > 0)
    );
    setActivity(buildInitialActivity(company, null));
    setNotes([]);
    setNoteDraft("");
    setImportProgress(null);
    setImportLabel(toCompanyCardModel(company, null).importLabel);
  }, [company]);

  useEffect(() => {
    initializedCompanyId.current = null;
  }, [companyId]);

  const handleOwnerLoaded = useCallback((nextOwner: CompanyOwnerInfo | null) => {
    setOwner(nextOwner);
  }, []);

  const handleOwnerAssigned = useCallback((nextOwner: CompanyOwnerInfo) => {
    setOwner(nextOwner);
    setActivity((prev) => [
      {
        tone: "amber",
        when: "just now",
        text: `Owner ${nextOwner.email} assigned`,
      },
      ...prev,
    ]);
  }, []);

  const cardModel = useMemo(
    () => (company ? toCompanyCardModel(company, owner) : null),
    [company, owner]
  );

  const checklistDone = checklistDoneCount(checklist);
  const modCount = BASE_FINANCIAL_MODULE_DEFINITIONS.filter((m) =>
    isModuleEnabled(enabledModules, m.key)
  ).length;

  const handleToggleStep = (index: number) => {
    setChecklist((prev) =>
      prev.map((step, i) => (i === index ? { ...step, done: !step.done } : step))
    );
  };

  const handleToggleModule = (moduleKey: string, required?: boolean) => {
    if (required || moduleKey === DASHBOARD_MODULE_KEY) return;
    const currentlyEnabled = isModuleEnabled(enabledModules, moduleKey);
    const nextModules = currentlyEnabled
      ? enabledModules.filter((k) => k !== moduleKey)
      : [...enabledModules, moduleKey];
    const normalized = nextModules.includes(DASHBOARD_MODULE_KEY)
      ? nextModules
      : [...nextModules, DASHBOARD_MODULE_KEY];
    setEnabledModules(normalized);
    if (companyId) {
      saveCompanyEnabledModules(companyId, normalized);
    }
    const mod = BASE_FINANCIAL_MODULE_DEFINITIONS.find((m) => m.key === moduleKey);
    if (mod) {
      setActivity((prev) => [
        {
          tone: "green",
          when: "just now",
          text: `${mod.name} module ${currentlyEnabled ? "disabled" : "enabled"}`,
        },
        ...prev,
      ]);
    }
  };

  const addNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    setNotes((prev) => [{ author: "You", when: "just now", text }, ...prev]);
    setNoteDraft("");
    setActivity((prev) => [
      { tone: "sky", when: "just now", text: "Internal note added" },
      ...prev,
    ]);
  };

  const runImport = () => {
    if (importProgress !== null || !company) return;
    setImportLabel("Importing…");
    setImportProgress(0);
    let p = 0;
    const timer = window.setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        window.clearInterval(timer);
        setImportProgress(100);
        window.setTimeout(() => {
          setImportProgress(null);
          setImportLabel("Synced");
          setChecklist((prev) =>
            prev.map((s) => (s.key === "imported" ? { ...s, done: true } : s))
          );
          setActivity((prev) => [
            {
              tone: "green",
              when: "just now",
              text: "Data import completed (simulated)",
            },
            ...prev,
          ]);
        }, 500);
      } else {
        setImportProgress(Math.round(p));
      }
    }, 260);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-[var(--admin-ink-3)]">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm">Loading company…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="admin-panel max-w-sm p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-[var(--admin-rust)]" />
          <h1 className="text-sm font-bold">Could not load company</h1>
          <p className="mt-1.5 text-xs text-[var(--admin-ink-3)]">{error}</p>
          <div className="mt-4 flex flex-col gap-2">
            <AdminButton variant="primary" size="sm" onClick={() => void loadCompany()}>
              Try again
            </AdminButton>
            <Link to="/admin/companies" className="admin-btn admin-btn-ghost admin-btn-sm justify-center">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!company || !cardModel) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="admin-panel max-w-sm p-8 text-center">
          <Building2 className="mx-auto mb-3 h-7 w-7 text-[var(--admin-ink-4)]" />
          <h1 className="text-sm font-bold">Company not found</h1>
          <Link
            to="/admin/companies"
            className="admin-btn admin-btn-primary admin-btn-sm mt-4 inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const importMeta = IMPORT_META[cardModel.importState];

  return (
    <>
      <button
        type="button"
        className="admin-back-link"
        onClick={() => navigate("/admin/companies")}
      >
        <ArrowLeft className="h-4 w-4" />
        All companies
      </button>

      <div className="admin-detail-head">
        <div>
          <div className="admin-detail-title">
            <h1>{company.name}</h1>
            <AdminPill tone={cardModel.statusMeta.tone} label={cardModel.statusMeta.label} />
          </div>
          <div className="admin-detail-meta">
            <span className="admin-tag">{getNicheDisplayName(company.niche)}</span>
            <span className="sep" />
            <span className="mono">{companyCodeFromRecord(company)}</span>
            <span className="sep" />
            <span>—</span>
            <span className="sep" />
            <span>Created {formatCreatedDate(company.createdAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <AdminButton size="sm" type="button" onClick={openOwnerAssignForm}>
            {owner ? "Manage access" : "Assign owner"}
          </AdminButton>
          <AdminButton size="sm" onClick={runImport} disabled={importProgress !== null}>
            <RefreshCw className="h-[15px] w-[15px]" />
            Import data
          </AdminButton>
          <Link
            to={`/dashboard?companyId=${encodeURIComponent(company.id)}`}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            <ExternalLink className="h-[15px] w-[15px]" />
            Open dashboard
          </Link>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div>
          <AdminPanel
            title="Setup checklist"
            icon={<CheckSquare className="h-4 w-4" />}
            right={
              <span
                className="mono text-[13px] font-semibold"
                style={{
                  color:
                    checklistDone === 5 ? "var(--admin-green-ink)" : "var(--admin-amber)",
                }}
              >
                {checklistDone}/5 complete
              </span>
            }
          >
            <div className="admin-progress-track mb-1.5">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${(checklistDone / 5) * 100}%`,
                  background:
                    checklistDone === 5 ? "var(--admin-green-600)" : "var(--admin-amber)",
                }}
              />
            </div>
            <div>
              {checklist.map((step, i) => (
                <div
                  key={step.key}
                  className={`admin-check-item${step.done ? " on" : ""}`}
                  onClick={() => handleToggleStep(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleStep(i);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="admin-check-box">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="admin-ci-label">{step.label}</div>
                    <div className="admin-ci-hint">{step.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Data migration"
            icon={<Database className="h-4 w-4" />}
            right={<AdminPill tone={importMeta.tone} label={importLabel} />}
          >
            <div className="admin-import-stat">
              <div className="is">
                <span className="k">Source</span>
                <span className="v">CSV upload</span>
              </div>
              <div className="is">
                <span className="k">Records</span>
                <span className="v mono">—</span>
              </div>
              <div className="is">
                <span className="k">Last import</span>
                <span className="v">—</span>
              </div>
              <div className="is">
                <span className="k">Database</span>
                <span className="v" style={{ color: "var(--admin-amber)" }}>
                  Not connected
                </span>
              </div>
            </div>

            {importProgress !== null && (
              <div className="mt-[18px]">
                <div className="mb-[7px] flex justify-between text-[12.5px] text-[var(--admin-ink-2)]">
                  <span>Importing from CSV upload…</span>
                  <span className="mono">{importProgress}%</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-[18px] flex gap-2">
              <AdminButton
                variant="primary"
                size="sm"
                onClick={runImport}
                disabled={importProgress !== null}
              >
                <RefreshCw className="h-[15px] w-[15px]" />
                {importLabel === "Synced" ? "Re-run import" : "Start import"}
              </AdminButton>
              <AdminButton size="sm">View import log</AdminButton>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Enabled modules"
            icon={<Grid3X3 className="h-4 w-4" />}
            right={
              <span className="mono text-[13px] text-[var(--admin-ink-3)]">
                {modCount}/{BASE_FINANCIAL_MODULE_DEFINITIONS.length} on
              </span>
            }
          >
            <div className="admin-mod-grid">
              {BASE_FINANCIAL_MODULE_DEFINITIONS.map((module) => {
                const on = isModuleEnabled(enabledModules, module.key);
                const isRequired = module.key === DASHBOARD_MODULE_KEY;
                return (
                  <div
                    key={module.key}
                    className={`admin-mod${on ? " on" : ""}`}
                    onClick={() => handleToggleModule(module.key, isRequired)}
                    onKeyDown={(e) => {
                      if (!isRequired && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleToggleModule(module.key, isRequired);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="admin-mod-name">{module.name}</span>
                    <span className="admin-toggle" />
                  </div>
                );
              })}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Enabled charts & KPIs"
            icon={<BarChart3 className="h-4 w-4" />}
          >
            <CompanyDashboardWidgetsSection
              company={company}
              onUpdated={(updated) => setCompany(updated)}
            />
          </AdminPanel>
        </div>

        <div>
          <AdminPanel title="Appearance" icon={<Palette className="h-4 w-4" />}>
            <CompanyBrandingSection
              company={company}
              onUpdated={(updated) => setCompany(updated)}
            />
          </AdminPanel>

          <AdminPanel title="Company overview" icon={<Building2 className="h-4 w-4" />}>
            <div className="admin-kv">
              <span className="k">Company ID</span>
              <span className="v mono">{companyCodeFromRecord(company)}</span>
            </div>
            <div className="admin-kv">
              <span className="k">Niche</span>
              <span className="v">{getNicheDisplayName(company.niche)}</span>
            </div>
            <div className="admin-kv">
              <span className="k">Region</span>
              <span className="v">—</span>
            </div>
            <div className="admin-kv">
              <span className="k">Plan</span>
              <span className="v">—</span>
            </div>
            <div className="admin-kv">
              <span className="k">Created</span>
              <span className="v">{formatCreatedDate(company.createdAt)}</span>
            </div>
            <div className="admin-kv">
              <span className="k">Status</span>
              <span className="v">{STATUS_META[cardModel.status].label}</span>
            </div>
          </AdminPanel>

          <AdminPanel title="Owner & access">
            <div ref={ownerSectionRef}>
              <CompanyOwnerSection
                companyId={company.id}
                showAssignForm={showOwnerAssignForm}
                onShowAssignFormChange={setShowOwnerAssignForm}
                onOwnerLoaded={handleOwnerLoaded}
                onOwnerAssigned={handleOwnerAssigned}
              />
            </div>
          </AdminPanel>

          <AdminPanel
            title="Internal notes"
            icon={<MessageSquare className="h-4 w-4" />}
            right={
              <span className="mono text-[12.5px] text-[var(--admin-ink-3)]">
                {notes.length}
              </span>
            }
          >
            <textarea
              className="admin-note-input"
              rows={2}
              placeholder="Add an internal note for the team…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <div className="mt-2 mb-4 flex justify-end">
              <AdminButton
                variant="primary"
                size="sm"
                onClick={addNote}
                disabled={!noteDraft.trim()}
              >
                Add note
              </AdminButton>
            </div>
            {notes.length === 0 ? (
              <div className="admin-empty">No notes yet.</div>
            ) : (
              notes.map((n, i) => (
                <div className="admin-note" key={i}>
                  <div className="admin-note-meta">
                    <strong className="font-semibold text-[var(--admin-ink-2)]">
                      {n.author}
                    </strong>
                    · {n.when}
                  </div>
                  <div className="admin-note-text">{n.text}</div>
                </div>
              ))
            )}
          </AdminPanel>

          <AdminPanel title="Recent activity" icon={<Clock className="h-4 w-4" />}>
            <div className="admin-timeline">
              {activity.map((a, i) => (
                <div className="admin-tl-item" key={i}>
                  <div className="admin-tl-rail">
                    <span
                      className="admin-tl-dot"
                      style={{
                        background:
                          a.tone === "green"
                            ? "var(--admin-green-600)"
                            : a.tone === "amber"
                              ? "var(--admin-amber)"
                              : a.tone === "sky"
                                ? "var(--admin-sky)"
                                : "var(--admin-slate)",
                      }}
                    />
                    <span className="admin-tl-line" />
                  </div>
                  <div>
                    <div className="admin-tl-text">{a.text}</div>
                    <div className="admin-tl-when mono">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Danger zone" icon={<Trash2 className="h-4 w-4" />}>
            <p className="mb-4 text-[13px] leading-relaxed text-[var(--admin-ink-2)]">
              Permanently delete this company and all associated financial data. Owner
              accounts are not deleted — only their link to this company.
            </p>
            <AdminButton
              size="sm"
              type="button"
              className="!border-[#eed8cd] !text-[var(--admin-rust)] hover:!bg-[var(--admin-rust-tint)]"
              onClick={() => {
                setDeleteCompanyError(null);
                setShowDeleteCompany(true);
              }}
            >
              <Trash2 className="h-[15px] w-[15px]" />
              Delete company
            </AdminButton>
          </AdminPanel>
        </div>
      </div>

      <DeleteCompanyDialog
        open={showDeleteCompany}
        companyName={company.name}
        deleting={deletingCompany}
        deleteError={deleteCompanyError}
        onClose={() => {
          if (!deletingCompany) setShowDeleteCompany(false);
        }}
        onConfirm={() => void handleDeleteCompany()}
      />
    </>
  );
}
