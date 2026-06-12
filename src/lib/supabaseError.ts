/** Extract a user-visible message from Supabase/PostgREST errors (not always `instanceof Error`). */
export function getSupabaseErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : "";
    const details = typeof record.details === "string" ? record.details : "";
    const combined = [message, details].filter(Boolean).join(" — ");

    if (combined) {
      if (
        /company_bank_accounts|company_bank_transactions/i.test(combined) &&
        /(schema cache|does not exist|relation)/i.test(combined)
      ) {
        return "Las tablas de cuentas bancarias aún no están en la base de datos. Un administrador debe aplicar la migración más reciente en Supabase.";
      }
      if (/stack depth limit exceeded/i.test(combined)) {
        return "Error de base de datos al calcular saldos. Un administrador debe aplicar la migración fix_bank_balance_trigger_recursion en Supabase.";
      }
      return combined;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
