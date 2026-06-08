import type { CSSProperties, ReactNode } from "react";

interface AdminPanelProps {
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  bodyStyle?: CSSProperties;
}

export function AdminPanel({ title, icon, right, children, bodyStyle }: AdminPanelProps) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        {icon && <span className="text-[var(--admin-ink-3)] flex shrink-0">{icon}</span>}
        <span className="ph-title">{title}</span>
        {right && <span className="ph-right">{right}</span>}
      </div>
      <div className="admin-panel-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
