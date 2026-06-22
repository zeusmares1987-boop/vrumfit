CREATE POLICY "Personal can upload own student files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'personal')
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id::text = (storage.foldername(name))[1]
      AND s.personal_id = auth.uid()
      AND s.status = 'ativo'
  )
);

CREATE POLICY "Personal can delete own student files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'personal')
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id::text = (storage.foldername(name))[1]
      AND s.personal_id = auth.uid()
      AND s.status = 'ativo'
  )
);

REVOKE EXECUTE ON FUNCTION public.current_role_label() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_add_student(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_student_limit() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_plan(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.bump_wa_click(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_ownership() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_publish_offer(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_offer_limit() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_my_student(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_profile(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_invoice_personal_id() FROM anon, public;