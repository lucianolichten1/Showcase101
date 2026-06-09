ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enabled_dashboard_widgets text[] NOT NULL
  DEFAULT ARRAY[
    'total-revenue',
    'total-costs',
    'net-profit',
    'accounts-receivable',
    'financial-overview',
    'expense-breakdown',
    'receivables-table'
  ];
