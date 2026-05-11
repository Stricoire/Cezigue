-- Script de création de la table pour les actualités Marlowe (Articles de Veille)

CREATE TABLE IF NOT EXISTS public.articles_veille (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre TEXT NOT NULL,
    contenu TEXT,
    source_nom TEXT,
    source_url TEXT UNIQUE NOT NULL,
    tags TEXT[],
    marlowe_insight TEXT,
    marlowe_insight_premium TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches sur la source (pour éviter les doublons lors du scraping)
CREATE INDEX IF NOT EXISTS idx_articles_veille_source_url ON public.articles_veille (source_url);

-- RLS - Policies
ALTER TABLE public.articles_veille ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "Lectures publiques articles" ON public.articles_veille;
CREATE POLICY "Lectures publiques articles"
    ON public.articles_veille
    FOR SELECT
    USING (true);

-- Ecriture uniquement par le serveur local/CRON via la Service Key
DROP POLICY IF EXISTS "Seul le serveur peut modifier articles" ON public.articles_veille;
CREATE POLICY "Seul le serveur peut modifier articles"
    ON public.articles_veille
    FOR ALL
    USING (auth.role() = 'service_role');
