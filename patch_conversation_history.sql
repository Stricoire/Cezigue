-- Ajout de la colonne pour stocker la mémoire de l'Agent IA du Studio
ALTER TABLE public.user_microservices 
ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]'::jsonb;
