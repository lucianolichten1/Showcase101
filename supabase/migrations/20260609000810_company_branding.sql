-- Company branding columns
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#166534',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#15803d',
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#FBFBF9',
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on companies (idempotent — skip if policies already exist)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'companies_select_member_or_superadmin'
  ) THEN
    CREATE POLICY companies_select_member_or_superadmin ON public.companies
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
        OR EXISTS (
          SELECT 1 FROM public.company_members cm
          WHERE cm.company_id = companies.id AND cm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'companies_update_branding_superadmin'
  ) THEN
    CREATE POLICY companies_update_branding_superadmin ON public.companies
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- Storage policies for company-logos bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_public_read'
  ) THEN
    CREATE POLICY company_logos_public_read ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'company-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_superadmin_insert'
  ) THEN
    CREATE POLICY company_logos_superadmin_insert ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'company-logos'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_superadmin_update'
  ) THEN
    CREATE POLICY company_logos_superadmin_update ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'company-logos'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      )
      WITH CHECK (
        bucket_id = 'company-logos'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_superadmin_delete'
  ) THEN
    CREATE POLICY company_logos_superadmin_delete ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'company-logos'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'superadmin'
        )
      );
  END IF;
END $$;
