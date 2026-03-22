
-- Fix overly permissive notifications INSERT policy
DROP POLICY "Service role can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
