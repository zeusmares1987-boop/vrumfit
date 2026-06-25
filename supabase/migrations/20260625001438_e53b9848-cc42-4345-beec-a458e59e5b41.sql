
ALTER TABLE public.anamneses
  ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('M','F')),
  ADD COLUMN IF NOT EXISTS activity_factor NUMERIC CHECK (activity_factor BETWEEN 1.0 AND 2.2),
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('iniciante','intermediario','avancado'));
