-- Fix infinite trigger recursion: recalculate_bank_account_balances UPDATEs
-- company_bank_transactions, which re-fired trg_recalculate_bank_balances until
-- PostgreSQL hit "stack depth limit exceeded".

CREATE OR REPLACE FUNCTION public.trg_recalculate_bank_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- Nested UPDATEs from recalculate_bank_account_balances must not recurse.
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_account_id := OLD.bank_account_id;
  ELSE
    v_account_id := NEW.bank_account_id;
    IF TG_OP = 'UPDATE' AND OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id THEN
      PERFORM public.recalculate_bank_account_balances(OLD.bank_account_id);
    END IF;
  END IF;

  PERFORM public.recalculate_bank_account_balances(v_account_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;
