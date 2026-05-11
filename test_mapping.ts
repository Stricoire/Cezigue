// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { getTaxonomyInfo, POI_TAXONOMY } from './src/config/poi_taxonomy';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: unifiedPois, error } = await supabase.rpc('get_pois_in_radius', {
      p_lat: 43.6045, p_lon: 1.444, p_radius_meters: 15000, p_categories: null
  });
  
  if (error) { console.error(error); return; }
  
  let mappedPois = (unifiedPois || []).map((poi) => {
      const rawType = poi.type ? poi.type.toLowerCase().split(';')[0] : '';
      const { metaKey, subKey } = getTaxonomyInfo(rawType, poi.categories || []);
      return { ...poi, metaCategory: metaKey, subKey };
  });
  
  let metaCounts = {};
  mappedPois.forEach(p => {
    metaCounts[p.metaCategory] = (metaCounts[p.metaCategory] || 0) + 1;
  });
  console.log('Real Meta Categories assigned:', metaCounts);
}
run();
