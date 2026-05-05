-- ==========================================
-- Trigger : Création de profil automatique
-- ==========================================
-- Ce script est à exécuter dans l'éditeur SQL de Supabase.
-- Il garantit que chaque fois qu'un utilisateur est créé 
-- (via Email/Password ou Google OAuth) dans auth.users,
-- une ligne est automatiquement insérée dans public.user_preferences.

-- 1. Fonction de création de profil
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (id, subscription_status)
  VALUES (new.id, 'NONE');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Création du Trigger (Suppression au préalable s'il existe déjà)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
