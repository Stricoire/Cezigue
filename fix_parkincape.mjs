import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log("Recherche des services avec 'PMR'...");
    const { data: services, error } = await supabase
        .from('user_microservices')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    let updated = 0;
    for (const s of services) {
        if (s.config_json && s.config_json.search_keyword === 'PMR') {
            s.config_json.search_keyword = 'PMR|adapté|handicap|stationnement';
            const { error: updateError } = await supabase
                .from('user_microservices')
                .update({ config_json: s.config_json })
                .eq('id', s.id);
            
            if (updateError) {
                console.error("Failed to update", s.id, updateError);
            } else {
                console.log(`Mise à jour du service ${s.title} (${s.id}) réussie !`);
                updated++;
            }
        }
    }
    console.log(`${updated} services mis à jour.`);
}

fix();
