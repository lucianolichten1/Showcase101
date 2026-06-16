CREATE TABLE IF NOT EXISTS public.bnb_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id bigint NOT NULL REFERENCES public.company_receivables(id) ON DELETE CASCADE,
  bnb_qr_id text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BOB',
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expiration_date timestamptz NOT NULL,
  voucher_id text,
  bank_account_id uuid REFERENCES public.company_bank_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bnb_qr_codes_company_qr_idx
  ON public.bnb_qr_codes(company_id, bnb_qr_id);

CREATE INDEX IF NOT EXISTS bnb_qr_codes_invoice_idx
  ON public.bnb_qr_codes(company_id, invoice_id, created_at DESC);

ALTER TABLE public.bnb_qr_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bnb_qr_codes_select_member_or_superadmin') THEN
    CREATE POLICY bnb_qr_codes_select_member_or_superadmin ON public.bnb_qr_codes
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = bnb_qr_codes.company_id AND cm.user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bnb_qr_codes_insert_member_or_superadmin') THEN
    CREATE POLICY bnb_qr_codes_insert_member_or_superadmin ON public.bnb_qr_codes
      FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = bnb_qr_codes.company_id AND cm.user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bnb_qr_codes_update_member_or_superadmin') THEN
    CREATE POLICY bnb_qr_codes_update_member_or_superadmin ON public.bnb_qr_codes
      FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = bnb_qr_codes.company_id AND cm.user_id = auth.uid())
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
        OR EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = bnb_qr_codes.company_id AND cm.user_id = auth.uid())
      );
  END IF;
END $$;
