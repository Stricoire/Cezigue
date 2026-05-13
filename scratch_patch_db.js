const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function patch() {
    const sql = `
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
`;

    // Supabase JS doesn't have a direct raw SQL query method in the client api unless via RPC.
    // However, I can use the standard REST endpoint or I will just write it to a .sql file and run via psql if I had it.
    // Since I don't have psql, I can't execute DDL via the supabase-js client directly (only select/insert/rpc).
    // Wait, let's check if there is an rpc to execute raw sql, usually not.
    console.log("SQL to execute:\\n", sql);
}

patch();
