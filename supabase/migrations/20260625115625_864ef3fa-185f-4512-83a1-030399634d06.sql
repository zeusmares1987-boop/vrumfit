
CREATE OR REPLACE FUNCTION public.expire_and_purge_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1) Marca como vencido o que passou da data e ainda estava ativo/trial
  UPDATE public.subscriptions
     SET status = 'vencido'
   WHERE status IN ('ativo','trial','pendente')
     AND expires_at IS NOT NULL
     AND expires_at < now();

  -- 2) Desativa ofertas dos vendedores sem plano de loja ativo
  UPDATE public.products p
     SET status = 'inativo'
   WHERE p.status = 'ativo'
     AND NOT EXISTS (
       SELECT 1 FROM public.subscriptions s
       JOIN public.plans pl ON pl.id = s.plan_id
       WHERE s.user_id = p.seller_id
         AND s.status IN ('ativo','trial')
         AND (s.expires_at IS NULL OR s.expires_at > now())
         AND pl.role_target = 'professor'
         AND COALESCE(pl.max_offers,0) > 0
     )
     AND NOT public.has_role(p.seller_id,'dono');

  -- 3) Após 90 dias vencido/cancelado, elimina a assinatura
  DELETE FROM public.subscriptions
   WHERE status IN ('vencido','cancelado')
     AND expires_at IS NOT NULL
     AND expires_at < now() - INTERVAL '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.expire_and_purge_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_and_purge_subscriptions() TO service_role;
