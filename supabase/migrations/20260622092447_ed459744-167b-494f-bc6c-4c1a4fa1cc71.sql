CREATE POLICY "Dono can delete all vrumfit files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'dono')
);