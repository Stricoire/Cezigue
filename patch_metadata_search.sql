CREATE OR REPLACE FUNCTION get_pois_in_radius(
  p_lat double precision,
  p_lon double precision,
  p_radius_meters double precision,
  p_categories text[] DEFAULT NULL,
  p_search_query text DEFAULT NULL
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
  AND (
    p_search_query IS NULL
    OR p_search_query = ''
    OR title ~* p_search_query
    OR description ~* p_search_query
    OR metadata::text ~* p_search_query
  )
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  LIMIT 2500;
END;
$$ LANGUAGE plpgsql STABLE;
