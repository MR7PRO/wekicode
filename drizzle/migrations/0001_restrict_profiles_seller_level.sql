DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public or own profiles are viewable" ON public.profiles FOR SELECT
USING (is_public = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "seller level readable" ON public.seller_level_status;
CREATE POLICY "own seller level readable" ON public.seller_level_status FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_seller_level(p_user_id uuid)
RETURNS TABLE(user_id uuid, current_level text, has_enough_data boolean, completed_orders_count integer, average_rating numeric, reviews_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, s.current_level::text, s.has_enough_data, s.completed_orders_count::int, s.average_rating::numeric, s.reviews_count::int
  FROM public.seller_level_status s WHERE s.user_id = p_user_id
$$;
GRANT EXECUTE ON FUNCTION public.get_public_seller_level(uuid) TO anon, authenticated;