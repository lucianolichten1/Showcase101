interface OnboardingRingProps {
  done: number;
  total: number;
}

export function OnboardingRing({ done, total }: OnboardingRingProps) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const stroke = done === total ? "var(--admin-green-600)" : "var(--admin-amber)";

  return (
    <span className="inline-block h-6 w-6 shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--admin-sunken)" strokeWidth="3" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
