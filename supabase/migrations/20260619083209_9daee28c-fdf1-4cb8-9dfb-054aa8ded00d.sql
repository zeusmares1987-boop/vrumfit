CREATE OR REPLACE FUNCTION public.claim_ownership()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  uemail TEXT;
  has_owner BOOLEAN;
  MASTER_EMAIL CONSTANT TEXT := 'zeusmares1987@gmail.com';
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT lower(email) INTO uemail FROM auth.users WHERE id = uid;
  IF uemail IS DISTINCT FROM MASTER_EMAIL THEN
    RAISE EXCEPTION 'Apenas o e-mail mestre pode reivindicar a propriedade';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'dono') INTO has_owner;
  IF has_owner THEN
    -- Já existe dono. Se for o próprio mestre, ok; senão bloqueia.
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'dono' AND user_id = uid) THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'dono');
  RETURN TRUE;
END $$;