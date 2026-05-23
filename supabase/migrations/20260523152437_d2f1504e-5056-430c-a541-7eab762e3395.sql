
-- Fix privilege escalation: remove self-activate beta policy
DROP POLICY IF EXISTS "Users can self-activate beta" ON public.user_subscriptions;

-- Restrict avatars bucket listing: only owner can list/select via API.
-- Direct public URL access still works because public buckets bypass RLS for object URLs.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can view their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
