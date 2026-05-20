// ─── Core customer entity ─────────────────────────────────────────────────────

/**
 * A customer record in the customers domain.
 * totalInvoiced and totalPaid are NOT stored here — they are always computed
 * from receivable records at render time so they stay in sync with live data.
 */
export interface CustomerRecord {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  /** City or geographic location */
  city?: string;
  /** Industry or business category */
  industry?: string;
  status?: "Active" | "Inactive";
  /** ISO date string — when the customer was added */
  createdAt?: string;
}

// ─── Import record (from Excel) ───────────────────────────────────────────────

/** A customer row parsed directly from an Excel sheet before normalization */
export interface ImportCustomerRecord {
  id: string;           // generated import ID e.g. "import-customers-1"
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  industry?: string;
  status?: string;      // raw string; normalized to "Active"|"Inactive" on convert
}

// ─── Field key constants (for Excel mapping UI) ───────────────────────────────

export const CUSTOMER_FIELD_KEYS = [
  "name",
  "email",
  "phone",
  "city",
  "industry",
  "status",
] as const;

export type CustomerFieldKey = (typeof CUSTOMER_FIELD_KEYS)[number];

export const CUSTOMER_REQUIRED_FIELDS: CustomerFieldKey[] = ["name"];

export const CUSTOMER_FIELD_LABELS: Record<CustomerFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  city: "City / Location",
  industry: "Industry / Category",
  status: "Status",
};
