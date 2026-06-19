
CREATE TABLE public.saved_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('workout','diet','elite')),
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_plans TO authenticated;
GRANT ALL ON public.saved_plans TO service_role;

ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plans" ON public.saved_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX saved_plans_user_kind_idx ON public.saved_plans (user_id, kind, created_at DESC);

CREATE TRIGGER saved_plans_updated_at BEFORE UPDATE ON public.saved_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
