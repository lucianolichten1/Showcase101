-- Per-company expense records (native app entry; imports remain in client storage for migration).
CREATE TABLE IF NOT EXISTS public.company_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  expense_date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  vendor text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'Bs',
  status text NOT NULL,
  payment_method text NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_expenses_company_id_idx
  ON public.company_expenses(company_id);

CREATE INDEX IF NOT EXISTS company_expenses_expense_date_idx
  ON public.company_expenses(company_id, expense_date DESC);

ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_expenses'
      AND policyname = 'company_expenses_select_member_or_superadmin'
  ) THEN
    CREATE POLICY company_expenses_select_member_or_superadmin ON public.company_expenses
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_expenses.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_expenses'
      AND policyname = 'company_expenses_insert_member_or_superadmin'
  ) THEN
    CREATE POLICY company_expenses_insert_member_or_superadmin ON public.company_expenses
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_expenses.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_expenses'
      AND policyname = 'company_expenses_update_member_or_superadmin'
  ) THEN
    CREATE POLICY company_expenses_update_member_or_superadmin ON public.company_expenses
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_expenses.company_id AND cm.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_expenses.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_expenses'
      AND policyname = 'company_expenses_delete_member_or_superadmin'
  ) THEN
    CREATE POLICY company_expenses_delete_member_or_superadmin ON public.company_expenses
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_expenses.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
