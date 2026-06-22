CREATE POLICY "Dono can upload all vrumfit files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'dono')
);

CREATE POLICY "Dono can update all vrumfit files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'dono')
)
WITH CHECK (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'dono')
);

CREATE POLICY "Authenticated can read library exercise photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND (storage.foldername(name))[1] = 'library'
);

CREATE POLICY "Users can update own files in vrumfit-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'vrumfit-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);