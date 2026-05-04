const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('id, subscription_status, stripe_customer_id, stripe_subscription_id');

  if (error) {
    console.error("Error fetching preferences:", error);
    return;
  }

  const activeUsers = data.filter(u => u.subscription_status === 'ACTIVE' || u.subscription_status === 'LIFETIME');
  
  if (activeUsers.length === 0) {
    console.log("0 abonnements actifs ou à vie.");
    return;
  }

  console.log(`Trouvé ${activeUsers.length} abonnements actifs ou à vie :`);
  for (const user of activeUsers) {
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(user.id);
    const email = authData?.user?.email || 'Email introuvable';
    console.log(`- Email: ${email} | Statut: ${user.subscription_status} | ID Stripe: ${user.stripe_customer_id || 'Aucun'}`);
  }
}

main();
