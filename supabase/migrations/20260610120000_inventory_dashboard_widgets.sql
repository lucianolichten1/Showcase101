-- Adds inventory dashboard KPI widgets to the per-company widget catalog.

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
    'receivables-table',
    'inventory-total-products',
    'inventory-stock-value',
    'inventory-low-stock',
    'inventory-open-pos'
  ];

UPDATE public.companies
SET enabled_dashboard_widgets = enabled_dashboard_widgets || (
  SELECT COALESCE(array_agg(key), '{}')
  FROM unnest(ARRAY[
    'inventory-total-products',
    'inventory-stock-value',
    'inventory-low-stock',
    'inventory-open-pos'
  ]) AS key
  WHERE NOT (key = ANY (enabled_dashboard_widgets))
);
