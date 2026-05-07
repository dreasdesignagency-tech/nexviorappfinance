CREATE POLICY "Users can self-activate beta"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND subscription_status = 'inactive')
WITH CHECK (auth.uid() = user_id AND subscription_status = 'beta' AND plan_type = 'beta');