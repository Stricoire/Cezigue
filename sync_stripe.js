const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
});

async function main() {
  console.log("Fetching all Supabase users...");
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  const users = authData.users;
  console.log(`Found ${users.length} users in Supabase Auth.`);
  
  const { data: prefs, error: prefsError } = await supabase.from('user_preferences').select('*');
  console.log(`Found ${prefs.length} records in user_preferences.`);

  console.log("\n--- Checking Stripe Subscriptions ---");
  let stripeSubscriptions = [];
  try {
    const subs = await stripe.subscriptions.list({ limit: 100 });
    stripeSubscriptions = subs.data;
    console.log(`Found ${stripeSubscriptions.length} subscriptions in Stripe.`);
  } catch(e) {
    console.error("Stripe Error:", e.message);
    return;
  }

  for (const sub of stripeSubscriptions) {
    const customer = await stripe.customers.retrieve(sub.customer);
    const email = customer.email;
    console.log(`Stripe Sub: ${sub.id} | Customer: ${sub.customer} | Email: ${email} | Status: ${sub.status}`);
    
    // Find user by email in Supabase
    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`  => Found corresponding Supabase Auth user: ${user.id}`);
      
      const userPref = prefs.find(p => p.id === user.id);
      if (userPref) {
        console.log(`  => Current DB Status: ${userPref.subscription_status}, CustomerID: ${userPref.stripe_customer_id}`);
        
        // Sync if there is a delta
        if (userPref.subscription_status !== 'ACTIVE' || !userPref.stripe_customer_id) {
          console.log(`  => Delta found! Updating user_preferences...`);
          const { error: updateError } = await supabase
            .from('user_preferences')
            .update({
              stripe_customer_id: customer.id,
              stripe_subscription_id: sub.id,
              subscription_status: sub.status === 'active' || sub.status === 'trialing' ? 'ACTIVE' : 'NONE'
            })
            .eq('id', user.id);
            
          if (updateError) console.error(`  => Update Failed:`, updateError);
          else console.log(`  => Successfully synced!`);
        } else {
          console.log(`  => Status is already synchronized.`);
        }
      } else {
        console.log(`  => Warning: No user_preferences found for this user ID.`);
      }
    } else {
      console.log(`  => Warning: No Supabase Auth user found for email ${email}.`);
    }
  }
}

main();
