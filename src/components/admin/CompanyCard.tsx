import type { FC, ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { AdminCompanyCardModel } from "@/domains/admin/displayModel";
import { AdminButton } from "./ui/AdminButton";
import { AdminPill } from "./ui/AdminPill";
import { OnboardingRing } from "./ui/OnboardingRing";

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-fact-row">
      <span className="lbl">{label}</span>
      <div className="val">{children}</div>
    </div>
  );
}

interface CompanyCardProps {
  model: AdminCompanyCardModel;
  justAdded?: boolean;
  onOpen: (id: string) => void;
}

export const CompanyCard: FC<CompanyCardProps> = ({ model, justAdded, onOpen }) => {
  return (
    <div
      className={`admin-co-card${justAdded ? " justadded" : ""}`}
      onClick={() => onOpen(model.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(model.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="admin-co-head">
        <div className="admin-co-namewrap">
          <div className="admin-co-name" title={model.name}>
            {model.name}
          </div>
          <span className="admin-tag">{model.niche}</span>
        </div>
        <AdminPill tone={model.statusMeta.tone} label={model.statusMeta.label} />
      </div>

      <div className="admin-co-facts">
        <FactRow label="Owner">
          {model.ownerEmail ? (
            <span
              className="mono block max-w-full truncate text-xs"
              title={model.ownerEmail}
            >
              {model.ownerEmail}
            </span>
          ) : (
            <span className="text-[13px] italic text-[var(--admin-ink-3)]">Not assigned</span>
          )}
        </FactRow>
        <FactRow label="Data import">
          <span className="inline-flex items-center gap-[7px] text-[13px] font-medium">
            <span className={`admin-dot ${model.importMeta.tone}`} />
            {model.importLabel}
          </span>
        </FactRow>
        <FactRow label="Onboarding">
          <span className="inline-flex items-center gap-2">
            <OnboardingRing done={model.checklistDone} total={model.checklistTotal} />
            <span className="mono text-[12.5px] text-[var(--admin-ink-2)]">
              {model.checklistDone}/{model.checklistTotal}
            </span>
          </span>
        </FactRow>
        <FactRow label="Modules">
          <span className="mono text-[12.5px] text-[var(--admin-ink-2)]">
            {model.moduleCount}{" "}
            <span className="text-[var(--admin-ink-4)]">/ {model.moduleTotal}</span>
          </span>
        </FactRow>
      </div>

      <div className="admin-co-actions" onClick={(e) => e.stopPropagation()}>
        <AdminButton
          variant="primary"
          size="sm"
          className="flex-1 justify-center"
          onClick={() => onOpen(model.id)}
        >
          View details <ArrowRight className="h-3.5 w-3.5" />
        </AdminButton>
        <Link
          to={`/company/${model.id}/dashboard`}
          className="admin-btn admin-btn-ghost admin-btn-sm px-[11px]"
          title="Open workspace"
        >
          <ExternalLink className="h-[15px] w-[15px]" />
        </Link>
      </div>
    </div>
  );
}
