-- ==========================================
-- Création de la table de Feedback Utilisateur
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_retour TEXT NOT NULL,
    message TEXT NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation du Row Level Security (RLS)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut insérer un feedback (anonyme ou non)
CREATE POLICY "Allow public insert to user_feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (true);

-- Politique : Seuls les administrateurs peuvent voir les feedbacks
-- (En supposant que les admins ont accès direct à la console Supabase, pas de policy select publique)
CREATE POLICY "Allow read for admins only"
ON public.user_feedback
FOR SELECT
USING (auth.role() = 'service_role');
