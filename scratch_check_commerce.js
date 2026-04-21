require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.rpc('get_pois_in_radius', {p_lat: 43.799, p_lon: 1.554, p_radius_meters: 5000, p_categories: null})
  .then(d => {
    const pois = d.data || [];
    console.log(`Total pois in 5km: ${pois.length}`);
    const near = pois.filter(p => p.categories && p.categories.includes('Commerce'));
    console.log(`Total Commerces in 5km: ${near.length}`);
    if (near.length > 0) {
      console.log('Sample Commerces:', near.slice(0, 5).map(p => `${p.title} (${p.city || '?'}) dist=${p.location}`));
    }
  });
