DROP POLICY IF EXISTS "subs insert self" ON public.subscriptions;

CREATE POLICY "subs insert dono only"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dono'));