import { useEffect, useRef } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * Subscribes to postgres changes for a company-scoped table and calls `refresh`.
 * Uses a per-effect channel id so React StrictMode remounts do not reuse a
 * channel that is already subscribed (which crashes the app).
 */
export function useSupabaseRealtimeRefresh(
  companyId: string | null,
  channelPrefix: string,
  table: string,
  refresh: () => void | Promise<void>
): void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!companyId || !isSupabaseConfigured) return;

    const channel = supabase.channel(`${channelPrefix}-${companyId}-${crypto.randomUUID()}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `company_id=eq.${companyId}`,
      },
      () => {
        void refreshRef.current();
      }
    );
    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, channelPrefix, table]);
}
