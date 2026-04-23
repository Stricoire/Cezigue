require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to create function, but anon might work if not protected, wait I don't have service role key in local env? Let me check .env.local

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
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
    OR categories && p_categories -- intersection
    OR type = ANY(p_categories)   -- match specific type (ex: 'restaurant')
  )
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  LIMIT 500;
END;
$$ LANGUAGE plpgsql STABLE;
  `;
  
  // Exécuter l'update via la REST API Supabase (car .rpc ne permet pas d'exécuter de SQL arbitraire)
  // ou utiliser pg si nécessaire. Wait, Supabase js doesn't have an execute_sql method by default unless we use a rpc...
  console.log("SQL to execute manually or via psql if no rpc for eval exists");
}
run();
