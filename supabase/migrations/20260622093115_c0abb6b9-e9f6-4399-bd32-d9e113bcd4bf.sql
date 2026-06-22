CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'aluno')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END $$;

DROP POLICY IF EXISTS "w personal own" ON public.workouts;
CREATE POLICY "w personal own"
ON public.workouts
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
);

DROP POLICY IF EXISTS "d personal" ON public.diets;
CREATE POLICY "d personal"
ON public.diets
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
);

DROP POLICY IF EXISTS "asm personal" ON public.assessments;
CREATE POLICY "asm personal"
ON public.assessments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'personal')
  AND personal_id = auth.uid()
  AND public.is_my_student(student_id, auth.uid())
);

DROP POLICY IF EXISTS "notice read" ON public.notices;
CREATE POLICY "notice read"
ON public.notices
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'dono')
  OR (
    status = 'ativo'
    AND (
      (
        public.has_role(auth.uid(), 'personal')
        AND personal_id = auth.uid()
      )
      OR (
        public.has_role(auth.uid(), 'aluno')
        AND EXISTS (
          SELECT 1
          FROM public.students s
          WHERE s.user_id = auth.uid()
            AND s.personal_id = notices.personal_id
        )
        AND (
          audience IN ('todos', 'alunos')
          OR (audience = 'aluno_especifico' AND target_user_id = auth.uid())
        )
      )
    )
  )
);