
-- RLS policies for vrumfit-files bucket
-- Files are organized as: {user_id}/{filename}
CREATE POLICY "Users can read own files in vrumfit-files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vrumfit-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files to vrumfit-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vrumfit-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files in vrumfit-files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vrumfit-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners and trainers can read all vrumfit-files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND (public.has_role(auth.uid(), 'dono') OR public.has_role(auth.uid(), 'personal'))
);
