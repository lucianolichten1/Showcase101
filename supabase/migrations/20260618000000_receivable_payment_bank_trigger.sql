-- Mirror receivable payment bank sync in the database (like expense/revenue triggers).

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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_receivable_payments_bank_sync ON public.company_receivable_payments;
CREATE TRIGGER company_receivable_payments_bank_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.company_receivable_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_receivable_payment_bank_transaction();
