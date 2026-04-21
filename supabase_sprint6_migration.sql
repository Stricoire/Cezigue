-- Sauvegarder ce script dans la base de données Supabase "SQL Editor"
-- Il ajoute un rayon mémorisable pour régler dynamiquement le périmètre de recherche B2C.

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS default_radius INTEGER DEFAULT 15;
