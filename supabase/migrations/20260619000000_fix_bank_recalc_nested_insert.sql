-- Nested INSERTs (e.g. receivable payment -> bank transaction) were skipped by
-- pg_trigger_depth() > 1, so current_balance never updated. Only skip nested UPDATEs
-- fired when recalculate_bank_account_balances writes running_balance.

CREATE OR REPLACE FUNCTION public.trg_recalculate_bank_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- Skip only nested UPDATEs from recalculate_bank_account_balances (prevents recursion).
  IF pg_trigger_depth() > 1 AND TG_OP = 'UPDATE' THEN
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

-- Belt-and-suspenders for payment-trigger inserts (harmless if recalc already ran).
CREATE OR REPLACE FUNCTION public.sync_receivable_payment_bank_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.company_receivables%ROWTYPE;
  v_description text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.company_bank_transactions
    WHERE reference_type = 'receivable'
      AND reference_id = OLD.id::text;
    IF OLD.bank_account_id IS NOT NULL THEN
      PERFORM public.recalculate_bank_account_balances(OLD.bank_account_id);
    END IF;
    RETURN OLD;
  END IF;

  DELETE FROM public.company_bank_transactions
  WHERE reference_type = 'receivable'
    AND reference_id = NEW.id::text;

  IF NEW.payment_method = 'Bank Transfer' AND NEW.bank_account_id IS NOT NULL THEN
    SELECT * INTO v_invoice
    FROM public.company_receivables
    WHERE id = NEW.invoice_id;

    v_description := format(
      'Cobro %s — %s',
      COALESCE(v_invoice.invoice_number, 'factura'),
      COALESCE(v_invoice.customer_name, 'cliente')
    );

    INSERT INTO public.company_bank_transactions (
      company_id,
      bank_account_id,
      transaction_date,
      description,
      amount,
      type,
      reference_type,
      reference_id
    ) VALUES (
      NEW.company_id,
      NEW.bank_account_id,
      NEW.payment_date,
      v_description,
      NEW.amount,
      'income',
      'receivable',
      NEW.id::text
    );

    PERFORM public.recalculate_bank_account_balances(NEW.bank_account_id);
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_bank_account_balances(uuid) TO authenticated;
