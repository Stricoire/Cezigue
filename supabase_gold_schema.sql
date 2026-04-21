-- Script de création de la couche GOLD (UGC & Vue Métier) pour Cézigue

-- 1. Table d'enrichissement propriétaire (UGC, Scripts Google/Yelp)
CREATE TABLE IF NOT EXISTS public.cezigue_enrichments (
    poi_id UUID PRIMARY KEY REFERENCES public.unified_pois(id) ON DELETE CASCADE,
    google_rating NUMERIC(3, 2),
    google_reviews_count INTEGER DEFAULT 0,
    yelp_rating NUMERIC(3, 2),
    cezigue_score NUMERIC(3, 2), -- Score interne calculé ou donné par les utilisateurs
    ai_summary TEXT, -- Résumé généré par l'IA sur l'ambiance du lieu
    user_comments JSONB DEFAULT '[]'::jsonb, -- Tableau des commentaires locaux
    last_enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cezigue_enrichments_poi_id ON public.cezigue_enrichments(poi_id);

-- RLS
ALTER TABLE public.cezigue_enrichments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture libre des enrichissements" ON public.cezigue_enrichments FOR SELECT USING (true);
CREATE POLICY "Le serveur peut enrichir" ON public.cezigue_enrichments FOR ALL USING (auth.role() = 'service_role');


-- 2. La Vue GOLD (La seule chose que le Front-End ou notre API devrait consommer)
-- On utilise LEFT JOIN car un lieu n'a pas forcement d'enrichissement
CREATE OR REPLACE VIEW public.gold_pois_view AS
SELECT 
    u.*,
    e.google_rating,
    e.google_reviews_count,
    e.yelp_rating,
    e.cezigue_score,
    e.ai_summary,
    e.user_comments
FROM 
    public.unified_pois u
LEFT JOIN 
    public.cezigue_enrichments e ON u.id = e.poi_id;


-- 3. Mise à jour de la fonction PostGIS pour taper directement sur la Data GOLD
DROP FUNCTION IF EXISTS public.get_pois_in_radius(double precision, double precision, double precision, text[]);

CREATE OR REPLACE FUNCTION get_pois_in_radius(
  p_lat double precision,
  p_lon double precision,
  p_radius_meters double precision,
  p_categories text[] DEFAULT NULL
)
RETURNS SETOF public.gold_pois_view AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.gold_pois_view
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
    p_radius_meters
  )
  AND (
    p_categories IS NULL 
    OR cardinality(p_categories) = 0 
    OR categories && p_categories
  )
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  LIMIT 500;
END;
$$ LANGUAGE plpgsql STABLE;
