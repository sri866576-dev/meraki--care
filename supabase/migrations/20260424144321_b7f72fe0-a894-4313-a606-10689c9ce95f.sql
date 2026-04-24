-- Clear app data tied to users first
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Delete all auth users
DELETE FROM auth.users;

-- Reset signup lock so the next signup becomes admin
UPDATE public.signup_lock SET locked = FALSE WHERE id = 1;