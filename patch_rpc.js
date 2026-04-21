require('dotenv').config({path: '.env.local'}); 
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
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
    OR categories && p_categories
  )
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  LIMIT 500;
END;
$$ LANGUAGE plpgsql STABLE;
`;

// supabase.rpc can only call functions, not execute raw SQL strings directly.
// To run raw SQL, we must have a method. Standard REST doesn't allow raw DDL.
