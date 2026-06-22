CREATE POLICY "Authenticated can read visible profile avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.can_view_profile(((storage.foldername(name))[1])::uuid)
);