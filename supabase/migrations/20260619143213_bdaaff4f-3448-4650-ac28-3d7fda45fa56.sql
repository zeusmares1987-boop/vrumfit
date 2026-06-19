
-- Loja modelo OLX (vitrine + WhatsApp). Sem gateway.
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;

-- products: virar tabela de ofertas
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offer_type TEXT NOT NULL DEFAULT 'digital',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS wa_clicks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_desc TEXT,
  ADD COLUMN IF NOT EXISTS for_whom TEXT,
  ADD COLUMN IF NOT EXISTS included TEXT,
  ADD COLUMN IF NOT EXISTS delivery_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- store settings por professor
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  logo_url TEXT,
  whatsapp TEXT,
  bio TEXT,
  specialty TEXT,
  slug TEXT UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_settings_read_all_auth" ON public.store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "store_settings_own_write" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "store_settings_own_update" ON public.store_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "store_settings_dono_all" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));

CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Função: pode publicar oferta?
CREATE OR REPLACE FUNCTION public.can_publish_offer(_seller UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pl public.plans; cnt INTEGER;
BEGIN
  IF public.has_role(_seller,'dono') THEN RETURN TRUE; END IF;
  IF NOT public.has_role(_seller,'personal') THEN RETURN FALSE; END IF;
  pl := public.current_plan(_seller);
  IF pl.id IS NULL OR pl.max_offers IS NULL OR pl.max_offers = 0 THEN RETURN FALSE; END IF;
  SELECT COUNT(*) INTO cnt FROM public.products
    WHERE seller_id = _seller AND status = 'ativo';
  RETURN cnt < pl.max_offers;
END $$;

-- Trigger: bloqueia publicar acima do limite/sem plano
CREATE OR REPLACE FUNCTION public.enforce_offer_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.seller_id IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(NEW.seller_id,'dono') THEN RETURN NEW; END IF;
  IF NEW.status = 'ativo' AND NOT public.can_publish_offer(NEW.seller_id) THEN
    RAISE EXCEPTION 'Limite de ofertas do plano atingido ou plano de ofertas inativo';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_offer_limit ON public.products;
CREATE TRIGGER trg_enforce_offer_limit BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_limit();

-- RLS produtos: refazer
DROP POLICY IF EXISTS "products_read" ON public.products;
DROP POLICY IF EXISTS "products_dono_all" ON public.products;
DROP POLICY IF EXISTS "products_seller_insert" ON public.products;
DROP POLICY IF EXISTS "products_seller_update" ON public.products;
DROP POLICY IF EXISTS "products_seller_delete" ON public.products;

CREATE POLICY "products_read" ON public.products FOR SELECT TO authenticated USING (
  status = 'ativo' OR seller_id = auth.uid() OR public.has_role(auth.uid(),'dono')
);
CREATE POLICY "products_dono_all" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono'))
  WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "products_seller_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid() AND public.has_role(auth.uid(),'personal'));
CREATE POLICY "products_seller_update" ON public.products FOR UPDATE TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE POLICY "products_seller_delete" ON public.products FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- RPC para incrementar cliques (qualquer logado)
CREATE OR REPLACE FUNCTION public.bump_wa_click(_product UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.products SET wa_clicks = wa_clicks + 1 WHERE id = _product AND status = 'ativo'
$$;
GRANT EXECUTE ON FUNCTION public.bump_wa_click(UUID) TO authenticated;

-- Seed do plano "Ofertas Professor"
INSERT INTO public.plans (slug, name, description, price_cents, period, role_target, max_offers, status)
SELECT 'ofertas-professor','Ofertas do Professor','Publique até 5 anúncios na vitrine.',1990,'mensal','professor',5,'ativo'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'ofertas-professor');
