require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { getTaxonomyInfo } = require('./src/config/poi_taxonomy.ts'); // Wait, require won't work on TS file
