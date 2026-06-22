CREATE OR REPLACE FUNCTION public.is_my_student(_student_id uuid, _personal_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = _student_id
      AND s.personal_id = _personal_id
      AND s.status = 'ativo'
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _profile_id = auth.uid()
    OR public.has_role(auth.uid(), 'dono')
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id = _profile_id
        AND s.personal_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.personal_id = _profile_id
    )
$$;

GRANT EXECUTE ON FUNCTION public.is_my_student(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "profiles read self or dono" ON public.profiles;
CREATE POLICY "profiles visible by relationship"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS personal_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.invoices i
SET personal_id = s.personal_id
FROM public.students s
WHERE i.student_id = s.user_id
  AND i.personal_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_personal_id ON public.invoices(personal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);

CREATE OR REPLACE FUNCTION public.set_invoice_personal_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  linked_personal uuid;
BEGIN
  SELECT s.personal_id INTO linked_personal
  FROM public.students s
  WHERE s.user_id = NEW.student_id;

  IF public.has_role(auth.uid(), 'personal') THEN
    IF linked_personal IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Personal só pode cobrar os próprios alunos';
    END IF;
    NEW.personal_id := auth.uid();
  ELSIF NEW.personal_id IS NULL THEN
    NEW.personal_id := linked_personal;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_set_invoice_personal_id ON public.invoices;
CREATE TRIGGER trg_set_invoice_personal_id
BEFORE INSERT OR UPDATE OF student_id, personal_id ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_personal_id();

DROP POLICY IF EXISTS "inv personal read" ON public.invoices;
CREATE POLICY "inv personal manage own students"
ON public.invoices
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'personal')
  AND (
    personal_id = auth.uid()
    OR public.is_my_student(student_id, auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
);

ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS personal_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.files f
SET personal_id = f.uploaded_by
WHERE f.personal_id IS NULL
  AND public.has_role(f.uploaded_by, 'personal');

CREATE INDEX IF NOT EXISTS idx_files_personal_id ON public.files(personal_id);
CREATE INDEX IF NOT EXISTS idx_files_target_user_id ON public.files(target_user_id);

DROP POLICY IF EXISTS "files read" ON public.files;
DROP POLICY IF EXISTS "files write" ON public.files;
CREATE POLICY "files relationship read"
ON public.files
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'dono')
  OR uploaded_by = auth.uid()
  OR target_user_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'personal')
    AND personal_id = auth.uid()
  )
  OR (
    audience IN ('todos', 'alunos')
    AND EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.personal_id = files.personal_id
    )
  )
);

CREATE POLICY "files relationship write"
ON public.files
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'dono')
  OR uploaded_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'dono')
  OR (
    uploaded_by = auth.uid()
    AND (
      personal_id IS NULL
      OR personal_id = auth.uid()
      OR public.is_my_student(target_user_id, auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Owners and trainers can read all vrumfit-files" ON storage.objects;
CREATE POLICY "Dono can read all vrumfit files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'dono')
);

CREATE POLICY "Personal can read own student files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vrumfit-files'
  AND public.has_role(auth.uid(), 'personal')
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.user_id::text = (storage.foldername(name))[1]
        AND s.personal_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "delete own sent" ON public.messages;
DROP POLICY IF EXISTS "read own messages" ON public.messages;
DROP POLICY IF EXISTS "send messages" ON public.messages;
DROP POLICY IF EXISTS "update own read state" ON public.messages;
CREATE POLICY "messages disabled"
ON public.messages
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);