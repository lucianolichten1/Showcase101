const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when the record id comes from a Supabase `company_*` table (not import ids). */
export function isPersistedRecordId(id: string): boolean {
  return UUID_RE.test(id);
}
