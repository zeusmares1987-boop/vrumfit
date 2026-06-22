
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.notices SET personal_id = created_by
WHERE personal_id IS NULL
  AND created_by IS NOT NULL
  AND public.has_role(created_by, 'personal'::app_role);

CREATE INDEX IF NOT EXISTS idx_notices_personal_id ON public.notices(personal_id);

DROP POLICY IF EXISTS "notice read" ON public.notices;
DROP POLICY IF EXISTS "notice write" ON public.notices;

CREATE POLICY "notice read" ON public.notices
FOR SELECT
USING (
  status = 'ativo'::publish_status AND (
    public.has_role(auth.uid(), 'dono'::app_role)
    OR (public.has_role(auth.uid(), 'personal'::app_role) AND personal_id = auth.uid())
    OR (
      public.has_role(auth.uid(), 'aluno'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.user_id = auth.uid()
          AND s.personal_id = public.notices.personal_id
      )
      AND (
        audience = 'todos'::audience_kind
        OR audience = 'alunos'::audience_kind
        OR (audience = 'aluno_especifico'::audience_kind AND target_user_id = auth.uid())
      )
    )
  )
);

CREATE POLICY "notice write" ON public.notices
FOR ALL
USING (
  public.has_role(auth.uid(), 'dono'::app_role)
  OR (public.has_role(auth.uid(), 'personal'::app_role) AND created_by = auth.uid() AND personal_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'dono'::app_role)
  OR (public.has_role(auth.uid(), 'personal'::app_role) AND created_by = auth.uid() AND personal_id = auth.uid())
);
