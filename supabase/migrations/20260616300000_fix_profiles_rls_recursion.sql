-- Fix infinite RLS recursion: policies on `profiles` queried `profiles` again.
-- Use a SECURITY DEFINER helper so role checks bypass RLS.

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

DROP POLICY IF EXISTS profiles_select_own_or_superadmin ON public.profiles;
CREATE POLICY profiles_select_own_or_superadmin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS profiles_update_superadmin ON public.profiles;
CREATE POLICY profiles_update_superadmin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS company_members_select_own_or_superadmin ON public.company_members;
CREATE POLICY company_members_select_own_or_superadmin ON public.company_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS company_members_insert_superadmin ON public.company_members;
CREATE POLICY company_members_insert_superadmin ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS companies_insert_superadmin ON public.companies;
CREATE POLICY companies_insert_superadmin ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS companies_select_member_or_superadmin ON public.companies;
CREATE POLICY companies_select_member_or_superadmin ON public.companies
  FOR SELECT TO authenticated
  USING (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = companies.id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS companies_update_branding_superadmin ON public.companies;
CREATE POLICY companies_update_branding_superadmin ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS company_logos_superadmin_insert ON storage.objects;
CREATE POLICY company_logos_superadmin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND public.is_superadmin());

DROP POLICY IF EXISTS company_logos_superadmin_update ON storage.objects;
CREATE POLICY company_logos_superadmin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND public.is_superadmin())
  WITH CHECK (bucket_id = 'company-logos' AND public.is_superadmin());

DROP POLICY IF EXISTS company_logos_superadmin_delete ON storage.objects;
CREATE POLICY company_logos_superadmin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND public.is_superadmin());
