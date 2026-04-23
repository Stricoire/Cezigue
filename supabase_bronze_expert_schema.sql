-- ==========================================
-- COUCHE BRONZE : Données Expertes Brutes
-- ==========================================

-- Table pour les données brutes Michelin
CREATE TABLE IF NOT EXISTS public.raw_michelin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT UNIQUE NOT NULL, -- On génèrera un hash ou on utilisera le nom+ville
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    price TEXT,
    cuisine TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    award TEXT,
    url TEXT,
    description TEXT,
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les données brutes Relais Routiers
CREATE TABLE IF NOT EXISTS public.raw_relais_routiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    facilities JSONB DEFAULT '{}'::jsonb, -- ex: {"douche": true, "parking_pl": true}
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.raw_michelin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_relais_routiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seul service_role peut modifier raw_michelin" ON public.raw_michelin;
CREATE POLICY "Seul service_role peut modifier raw_michelin"
    ON public.raw_michelin FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Seul service_role peut modifier raw_relais_routiers" ON public.raw_relais_routiers;
CREATE POLICY "Seul service_role peut modifier raw_relais_routiers"
    ON public.raw_relais_routiers FOR ALL
    USING (auth.role() = 'service_role');

-- ==========================================
-- COUCHE SILVER -> GOLD : Synchronisation
-- ==========================================

CREATE OR REPLACE FUNCTION sync_expert_pois_to_unified()
RETURNS void AS $$
BEGIN
    -- 1. Synchronisation des Michelin vers unified_pois
    INSERT INTO public.unified_pois (
        source_id, source, categories, title, type, lat, lon, address, city, description, metadata
    )
    SELECT 
        'michelin:' || source_id, 
        'MICHELIN', 
        ARRAY['Restauration'], 
        name, 
        CASE 
            WHEN award ILIKE '%Etoile%' OR award ILIKE '%Étoile%' OR award ILIKE '%Star%' THEN 'michelin_starred'
            WHEN award ILIKE '%Bib%' THEN 'michelin_bib'
            ELSE 'restaurant'
        END, 
        lat, 
        lon, 
        address, 
        city, 
        description, 
        jsonb_build_object('award', award, 'cuisine', cuisine, 'price', price, 'url', url)
    FROM public.raw_michelin
    WHERE lat IS NOT NULL AND lon IS NOT NULL
    ON CONFLICT (source_id) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    -- 2. Synchronisation des Relais Routiers vers unified_pois
    INSERT INTO public.unified_pois (
        source_id, source, categories, title, type, lat, lon, address, city, metadata
    )
    SELECT 
        'relais_routier:' || source_id, 
        'RELAIS_ROUTIER', 
        ARRAY['Restauration'], 
        name, 
        'relais_routier', 
        lat, 
        lon, 
        address, 
        city, 
        facilities
    FROM public.raw_relais_routiers
    WHERE lat IS NOT NULL AND lon IS NOT NULL
    ON CONFLICT (source_id) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
