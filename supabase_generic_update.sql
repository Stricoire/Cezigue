-- supabase_generic_update.sql
CREATE OR REPLACE FUNCTION get_pois_in_radius(
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION,
  p_categories TEXT[] DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  type TEXT,
  categories TEXT[],
  metadata JSONB,
  distance_meters DOUBLE PRECISION
) AS $$
DECLARE
  target_point GEOGRAPHY;
BEGIN
  target_point := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::GEOGRAPHY;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.lat,
    p.lon,
    p.type,
    p.categories,
    p.metadata,
    ST_Distance(p.geom, target_point) AS distance_meters
  FROM unified_pois p
  WHERE 
    ST_DWithin(p.geom, target_point, p_radius_meters)
    AND (
      -- If search query is provided, we use it as the primary semantic filter and bypass the rigid taxonomy
      (p_search_query IS NOT NULL AND p_search_query != '' AND (
          p.title ~* p_search_query
          OR p.description ~* p_search_query
          OR p.type ~* p_search_query
          OR p.metadata::text ~* p_search_query
      ))
      OR 
      -- Otherwise, or in addition, we fall back to standard category filtering
      (
        (p_search_query IS NULL OR p_search_query = '') AND
        (
          p_categories IS NULL 
          OR array_length(p_categories, 1) = 0
          OR p.categories && p_categories
          OR p.type ~* ANY(p_categories)
        )
      )
    )
  ORDER BY distance_meters ASC
  LIMIT 1000;
END;
$$ LANGUAGE plpgsql;
