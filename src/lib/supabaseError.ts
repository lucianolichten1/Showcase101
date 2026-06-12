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
      if (/infinite recursion detected in policy/i.test(combined)) {
        return "Error de permisos en la base de datos (RLS). Aplica la migración fix_profiles_rls_recursion en Supabase.";
      }
      if (
        /companies/i.test(combined) &&
        /(row-level security|permission denied|policy)/i.test(combined)
      ) {
        return "No tienes permiso para crear o ver empresas. En Supabase SQL Editor, aplica las políticas RLS de companies (is_superadmin).";
      }
      if (
        /delete/i.test(combined) &&
        /companies/i.test(combined) &&
        /(row-level security|permission denied|policy)/i.test(combined)
      ) {
        return "No tienes permiso para eliminar empresas. En Supabase SQL Editor, aplica la política companies_delete_superadmin.";
      }
      return combined;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
