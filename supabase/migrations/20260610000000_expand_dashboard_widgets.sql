-- Expands the dashboard widget catalog with 5 new KPIs and 5 new charts.
-- New widgets are enabled by default for new and existing companies;
-- admins can deselect them per company.

ALTER TABLE public.companies
  ALTER COLUMN enabled_dashboard_widgets SET DEFAULT ARRAY[
    'total-revenue',
    'total-costs',
    'net-profit',
    'accounts-receivable',
    'gross-profit',
    'profit-margin',
    'collected-revenue',
    'overdue-receivables',
    'outstanding-expenses',
    'financial-overview',
    'profit-trend',
    'cash-flow',
    'revenue-by-category',
    'top-customers',
    'expense-breakdown',
    'receivables-aging',
    'receivables-table'
  ];

UPDATE public.companies
SET enabled_dashboard_widgets = enabled_dashboard_widgets || (
  SELECT COALESCE(array_agg(key), '{}')
  FROM unnest(ARRAY[
    'gross-profit',
    'profit-margin',
    'collected-revenue',
    'overdue-receivables',
    'outstanding-expenses',
    'profit-trend',
    'cash-flow',
    'revenue-by-category',
    'top-customers',
    'receivables-aging'
  ]) AS key
  WHERE NOT (key = ANY (enabled_dashboard_widgets))
);
