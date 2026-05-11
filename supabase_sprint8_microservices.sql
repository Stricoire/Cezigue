-- Migration Sprint 8 : Micro-services Utilisateurs (Chat-to-Build)

CREATE TABLE IF NOT EXISTS public.user_microservices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_microservices_user_id ON public.user_microservices(user_id);

-- Activation de la Row Level Security (RLS)
ALTER TABLE public.user_microservices ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres micro-services
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres micro-services" ON public.user_microservices;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres micro-services" 
ON public.user_microservices 
FOR SELECT 
USING (auth.uid() = user_id);

-- Seul le serveur (service_role) ou l'utilisateur peut insérer (on utilisera service_role dans l'API Gemini par sécurité)
DROP POLICY IF EXISTS "Insertion de micro-services" ON public.user_microservices;
CREATE POLICY "Insertion de micro-services" 
ON public.user_microservices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Mise à jour / Suppression
DROP POLICY IF EXISTS "Modification par le propriétaire" ON public.user_microservices;
CREATE POLICY "Modification par le propriétaire" 
ON public.user_microservices 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Suppression par le propriétaire" ON public.user_microservices;
CREATE POLICY "Suppression par le propriétaire" 
ON public.user_microservices 
FOR DELETE 
USING (auth.uid() = user_id);
