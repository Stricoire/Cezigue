-- Script de création de la couche BRONZE pour OpenStreetMap
-- Cette table stocke les données brutes telles qu'elles proviennent d'Overpass API, sans altération.

CREATE TABLE IF NOT EXISTS public.raw_osm_nodes (
    id BIGINT PRIMARY KEY, -- OSM ID brut (ex: node/123456)
    type TEXT NOT NULL, -- 'node', 'way', 'relation'
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    tags JSONB NOT NULL DEFAULT '{}'::jsonb, -- Tous les tags OSM conservés intacts
    department_code TEXT, -- Département pour le suivi d'import
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les requêtes de synchronisation Bronze -> Silver
CREATE INDEX IF NOT EXISTS idx_raw_osm_tags ON public.raw_osm_nodes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_raw_osm_dept ON public.raw_osm_nodes (department_code);

-- RLS
ALTER TABLE public.raw_osm_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seul le service_role peut modifier la table Bronze OSM"
    ON public.raw_osm_nodes
    FOR ALL
    USING (auth.role() = 'service_role');
