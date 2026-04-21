-- Script de création de la table Datatourisme Events pour le Radar Cezigue

CREATE TABLE public.datatourisme_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dt_id TEXT UNIQUE NOT NULL, -- L'ID unique Datatourisme (ex: 10/0037c361-...)
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    description TEXT,
    city TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la recherche géospatiale (B-Tree basique sur lat/lon, ou PostGIS si activé plus tard)
CREATE INDEX IF NOT EXISTS idx_datatourisme_lat_lon ON public.datatourisme_events (lat, lon);
CREATE INDEX IF NOT EXISTS idx_datatourisme_dates ON public.datatourisme_events (start_date, end_date);

-- RLS (Row Level Security) - Lecture publique, écriture restreinte (uniquement le serveur / service role)
ALTER TABLE public.datatourisme_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectures publiques autorisées"
    ON public.datatourisme_events
    FOR SELECT
    USING (true);

-- Seul le rôle authentifié ou le service_role du Cron Vercel a le droit d'écrire/updater
CREATE POLICY "Seul le serveur peut modifier"
    ON public.datatourisme_events
    FOR ALL
    USING (auth.role() = 'service_role');
