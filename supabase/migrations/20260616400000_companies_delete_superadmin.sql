-- Allow platform superadmins to delete companies (cascades to company_members and financial data).

DROP POLICY IF EXISTS companies_delete_superadmin ON public.companies;
CREATE POLICY companies_delete_superadmin ON public.companies
  FOR DELETE TO authenticated
  USING (public.is_superadmin());
