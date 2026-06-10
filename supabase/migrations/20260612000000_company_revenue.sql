-- Per-company revenue records (native app entry; imports remain in client storage for migration).
CREATE TABLE IF NOT EXISTS public.company_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  revenue_date date NOT NULL,
  source_client text NOT NULL,
  product_service text NOT NULL,
  category text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'Bs',
  status text NOT NULL,
  payment_method text NOT NULL,
  invoice_number text NOT NULL,
  notes text NOT NULL DEFAULT '',
  cost numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_revenue_company_id_idx
  ON public.company_revenue(company_id);

CREATE INDEX IF NOT EXISTS company_revenue_revenue_date_idx
  ON public.company_revenue(company_id, revenue_date DESC);

ALTER TABLE public.company_revenue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_revenue'
      AND policyname = 'company_revenue_select_member_or_superadmin'
  ) THEN
    CREATE POLICY company_revenue_select_member_or_superadmin ON public.company_revenue
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_revenue.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_revenue'
      AND policyname = 'company_revenue_insert_member_or_superadmin'
  ) THEN
    CREATE POLICY company_revenue_insert_member_or_superadmin ON public.company_revenue
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_revenue.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_revenue'
      AND policyname = 'company_revenue_update_member_or_superadmin'
  ) THEN
    CREATE POLICY company_revenue_update_member_or_superadmin ON public.company_revenue
      FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_revenue.company_id AND cm.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_revenue.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_revenue'
      AND policyname = 'company_revenue_delete_member_or_superadmin'
  ) THEN
    CREATE POLICY company_revenue_delete_member_or_superadmin ON public.company_revenue
      FOR DELETE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = company_revenue.company_id AND cm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
