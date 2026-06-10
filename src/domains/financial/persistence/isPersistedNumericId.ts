/** Native DB ids start at 1_000_000 to avoid collision with import-generated small ids. */
export const NATIVE_NUMERIC_ID_START = 1_000_000;

export function isPersistedNumericId(id: number): boolean {
  return Number.isFinite(id) && id >= NATIVE_NUMERIC_ID_START;
}
