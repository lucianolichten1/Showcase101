-- Bank accounts and transaction ledger with trigger-driven balance integrity.

CREATE TABLE IF NOT EXISTS public.company_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  account_type text NOT NULL,
  currency text NOT NULL DEFAULT 'Bs',
  current_balance numeric(14, 2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_bank_accounts_account_number_len CHECK (char_length(account_number) <= 4)
);

CREATE INDEX IF NOT EXISTS company_bank_accounts_company_id_idx
  ON public.company_bank_accounts(company_id);

CREATE TABLE IF NOT EXISTS public.company_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.company_bank_accounts(id) ON DELETE RESTRICT,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  reference_type text NOT NULL CHECK (
    reference_type IN ('expense', 'revenue', 'manual', 'transfer', 'opening')
  ),
  reference_id uuid,
  transfer_group_id uuid,
  running_balance numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_bank_transactions_account_idx
  ON public.company_bank_transactions(bank_account_id, transaction_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS company_bank_transactions_company_idx
  ON public.company_bank_transactions(company_id);

CREATE UNIQUE INDEX IF NOT EXISTS company_bank_transactions_expense_ref_idx
  ON public.company_bank_transactions(reference_id)
  WHERE reference_type = 'expense';

CREATE UNIQUE INDEX IF NOT EXISTS company_bank_transactions_revenue_ref_idx
  ON public.company_bank_transactions(reference_id)
  WHERE reference_type = 'revenue';

ALTER TABLE public.company_expenses
  ADD COLUMN IF NOT EXISTS bank_account_id uuid
  REFERENCES public.company_bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.company_revenue
  ADD COLUMN IF NOT EXISTS bank_account_id uuid
  REFERENCES public.company_bank_accounts(id) ON DELETE SET NULL;

-- Recalculate running balances and current_balance for one account.
CREATE OR REPLACE FUNCTION public.recalculate_bank_account_balances(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric(14, 2) := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, amount, type
    FROM public.company_bank_transactions
    WHERE bank_account_id = p_account_id
    ORDER BY transaction_date ASC, created_at ASC, id ASC
  LOOP
    IF r.type = 'expense' THEN
      v_balance := v_balance - r.amount;
    ELSE
      v_balance := v_balance + r.amount;
    END IF;

    UPDATE public.company_bank_transactions
    SET running_balance = v_balance
    WHERE id = r.id;
  END LOOP;

  UPDATE public.company_bank_accounts
  SET current_balance = v_balance,
      updated_at = now()
  WHERE id = p_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalculate_bank_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- Skip nested fires when recalculate_bank_account_balances updates running_balance.
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

DROP TRIGGER IF EXISTS company_bank_transactions_recalc ON public.company_bank_transactions;
CREATE TRIGGER company_bank_transactions_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.company_bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_bank_balances();

CREATE OR REPLACE FUNCTION public.sync_expense_bank_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_description text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.company_bank_transactions
    WHERE reference_type = 'expense' AND reference_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.company_bank_transactions
  WHERE reference_type = 'expense' AND reference_id = NEW.id;

  IF NEW.status = 'Paid'
     AND NEW.payment_method = 'Bank Transfer'
     AND NEW.bank_account_id IS NOT NULL THEN
    v_description := COALESCE(NULLIF(trim(NEW.description), ''), NEW.vendor);
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
      NEW.expense_date,
      v_description,
      NEW.amount,
      'expense',
      'expense',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_expenses_bank_sync ON public.company_expenses;
CREATE TRIGGER company_expenses_bank_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.company_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_expense_bank_transaction();

CREATE OR REPLACE FUNCTION public.sync_revenue_bank_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_description text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.company_bank_transactions
    WHERE reference_type = 'revenue' AND reference_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.company_bank_transactions
  WHERE reference_type = 'revenue' AND reference_id = NEW.id;

  IF NEW.status = 'Collected'
     AND NEW.payment_method = 'Bank Transfer'
     AND NEW.bank_account_id IS NOT NULL THEN
    v_description := COALESCE(
      NULLIF(trim(NEW.product_service), ''),
      NULLIF(trim(NEW.source_client), ''),
      'Ingreso'
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
      NEW.revenue_date,
      v_description,
      NEW.amount,
      'income',
      'revenue',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS company_revenue_bank_sync ON public.company_revenue;
CREATE TRIGGER company_revenue_bank_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.company_revenue
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_revenue_bank_transaction();

-- Atomic transfer between two accounts.
CREATE OR REPLACE FUNCTION public.create_bank_transfer(
  p_company_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_transaction_date date,
  p_description text DEFAULT 'Transferencia entre cuentas'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid := gen_random_uuid();
  v_desc text;
BEGIN
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Las cuentas de origen y destino deben ser distintas';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.company_bank_accounts
    WHERE id = p_from_account_id AND company_id = p_company_id AND active = true
  ) OR NOT EXISTS (
    SELECT 1 FROM public.company_bank_accounts
    WHERE id = p_to_account_id AND company_id = p_company_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Cuenta bancaria no válida';
  END IF;

  v_desc := COALESCE(NULLIF(trim(p_description), ''), 'Transferencia entre cuentas');

  INSERT INTO public.company_bank_transactions (
    company_id, bank_account_id, transaction_date, description,
    amount, type, reference_type, transfer_group_id
  ) VALUES (
    p_company_id, p_from_account_id, p_transaction_date, v_desc,
    p_amount, 'expense', 'transfer', v_group_id
  );

  INSERT INTO public.company_bank_transactions (
    company_id, bank_account_id, transaction_date, description,
    amount, type, reference_type, transfer_group_id
  ) VALUES (
    p_company_id, p_to_account_id, p_transaction_date, v_desc,
    p_amount, 'income', 'transfer', v_group_id
  );

  RETURN v_group_id;
END;
$$;

-- Prevent hard delete when transaction history exists.
CREATE OR REPLACE FUNCTION public.prevent_bank_account_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.company_bank_transactions
    WHERE bank_account_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar una cuenta con movimientos. Márquela como inactiva.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS company_bank_accounts_prevent_delete ON public.company_bank_accounts;
CREATE TRIGGER company_bank_accounts_prevent_delete
  BEFORE DELETE ON public.company_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_bank_account_hard_delete();

-- RLS: company_bank_accounts
ALTER TABLE public.company_bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_accounts'
      AND policyname = 'company_bank_accounts_select_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_accounts_select_member_or_superadmin ON public.company_bank_accounts
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_accounts.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_accounts'
      AND policyname = 'company_bank_accounts_insert_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_accounts_insert_member_or_superadmin ON public.company_bank_accounts
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_accounts.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_accounts'
      AND policyname = 'company_bank_accounts_update_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_accounts_update_member_or_superadmin ON public.company_bank_accounts
      FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_accounts.company_id AND cm.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_accounts.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_accounts'
      AND policyname = 'company_bank_accounts_delete_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_accounts_delete_member_or_superadmin ON public.company_bank_accounts
      FOR DELETE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_accounts.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS: company_bank_transactions
ALTER TABLE public.company_bank_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_transactions'
      AND policyname = 'company_bank_transactions_select_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_transactions_select_member_or_superadmin ON public.company_bank_transactions
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_transactions.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_transactions'
      AND policyname = 'company_bank_transactions_insert_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_transactions_insert_member_or_superadmin ON public.company_bank_transactions
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_transactions.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_transactions'
      AND policyname = 'company_bank_transactions_update_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_transactions_update_member_or_superadmin ON public.company_bank_transactions
      FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_transactions.company_id AND cm.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_transactions.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_bank_transactions'
      AND policyname = 'company_bank_transactions_delete_member_or_superadmin'
  ) THEN
    CREATE POLICY company_bank_transactions_delete_member_or_superadmin ON public.company_bank_transactions
      FOR DELETE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_bank_transactions.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
