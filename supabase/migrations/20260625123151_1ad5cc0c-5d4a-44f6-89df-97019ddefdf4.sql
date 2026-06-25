DROP POLICY IF EXISTS store_settings_read_all_auth ON public.store_settings;

CREATE POLICY store_settings_read_scoped
ON public.store_settings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'dono')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.personal_id = store_settings.user_id
      AND s.user_id = auth.uid()
  )
);