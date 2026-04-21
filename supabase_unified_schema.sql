-- Script de création de la table Unifiée PostGIS (Datatourisme OR OSM)

-- 1. Activation de PostGIS pour gérer les calculs de rayon de façon ultra performante
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Création de la table principale
CREATE TABLE public.unified_pois (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT UNIQUE NOT NULL, -- identifiant externe (ex: osm:node:1234, datatourisme:10/003)
    source TEXT NOT NULL,           -- 'OSM' ou 'DATATOURISME' ou 'MANUAL'
    categories TEXT[] NOT NULL,     -- ex: ['Commerce', 'Activité Touristique']
    title TEXT NOT NULL,
    type TEXT,                      -- Le type spécifique d'origine (ex: museum, pharmacy)
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    location geography(POINT) GENERATED ALWAYS AS (st_makepoint(lon::double precision, lat::double precision)) STORED,
    address TEXT,
    city TEXT,
    postcode TEXT,
    phone TEXT,
    description TEXT,
    opening_hours TEXT,
    start_date DATE,
    end_date DATE,
    metadata JSONB,                 -- Champs flexibles (ex: isDutyPharmacy, autres tags OSM)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Création des Index pour les Performances
-- Index géospatial pour la recherche par rayon ultra-rapide
CREATE INDEX IF NOT EXISTS idx_unified_pois_location ON public.unified_pois USING GIST (location);

-- Index sur les catégories (GIN) pour chercher "est-ce que category contient X" très vite
CREATE INDEX IF NOT EXISTS idx_unified_pois_categories ON public.unified_pois USING GIN (categories);

-- Index pour la source
CREATE INDEX IF NOT EXISTS idx_unified_pois_source ON public.unified_pois (source);

-- 4. RLS - Policies
ALTER TABLE public.unified_pois ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Lectures publiques autorisées"
    ON public.unified_pois
    FOR SELECT
    USING (true);

-- Ecriture uniquement par le serveur local/CRON via la Service Key
CREATE POLICY "Seul le serveur peut modifier"
    ON public.unified_pois
    FOR ALL
    USING (auth.role() = 'service_role');

-- 5. RPC Function : Recherche géospatiale par rayon avec filtrage
-- Cette fonction sera appelée par api/poi/route.ts
CREATE OR REPLACE FUNCTION get_pois_in_radius(
  p_lat double precision,
  p_lon double precision,
  p_radius_meters double precision,
  p_categories text[] DEFAULT NULL
)
RETURNS SETOF public.unified_pois AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.unified_pois
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
    p_radius_meters
  )
  AND (
    p_categories IS NULL 
    OR cardinality(p_categories) = 0 
    OR categories && p_categories -- intersection: si un des tags demandés est dans l'array du POI
  )
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  LIMIT 500;
END;
$$ LANGUAGE plpgsql STABLE;
