import { ALL_BASE_MODULE_KEYS } from "./modules";

// TODO: Connect niche config to central platform Supabase.
// TODO: Store niche Supabase credentials securely in environment variables or server-side config.
// TODO: Route company data requests to the correct niche Supabase project.
// TODO: Load niche-specific modules after base financial flow is stable.

export type NicheStatus = "active" | "inactive" | "coming_soon";

export interface NicheConfig {
  key: string;
  name: string;
  description: string;
  status: NicheStatus;
  /** Logical Supabase project identifier — not a URL or secret. */
  supabaseProjectKey: string;
  baseModules: string[];
  futureModulesPlaceholder?: string;
}

export const NICHE_REGISTRY = {
  agro: {
    key: "agro",
    name: "Agro",
    description:
      "For agriculture, livestock, dairy, breeding, and related businesses.",
    status: "active",
    supabaseProjectKey: "agro",
    baseModules: [...ALL_BASE_MODULE_KEYS],
    futureModulesPlaceholder:
      "Operational modules for crops, livestock, and herd management will appear here.",
  },
} as const satisfies Record<string, NicheConfig>;

export type NicheKey = keyof typeof NICHE_REGISTRY;

export const DEFAULT_NICHE_KEY: NicheKey = "agro";

/** Niches available when creating a company (active only). */
export function getActiveNiches(): NicheConfig[] {
  return Object.values(NICHE_REGISTRY).filter((n) => n.status === "active");
}

export function getNicheByKey(key: string): NicheConfig | undefined {
  return NICHE_REGISTRY[key as NicheKey];
}

export function getNicheDisplayName(key: string): string {
  return getNicheByKey(key)?.name ?? key;
}

export function nicheStatusLabel(status: NicheStatus): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  return "Coming soon";
}
