-- BNB (Banco Nacional de Bolivia) live balance sync linkage.

ALTER TABLE public.company_bank_accounts
  ADD COLUMN IF NOT EXISTS bnb_account_number text,
  ADD COLUMN IF NOT EXISTS bnb_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bnb_last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS company_bank_accounts_bnb_number_company_idx
  ON public.company_bank_accounts(company_id, bnb_account_number)
  WHERE bnb_account_number IS NOT NULL;
