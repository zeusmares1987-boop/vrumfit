
CREATE OR REPLACE FUNCTION public.claim_ownership()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  has_owner BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'dono') INTO has_owner;
  IF has_owner THEN
    RETURN FALSE;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = uid;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'dono');
  RETURN TRUE;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_ownership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_ownership() TO authenticated;
