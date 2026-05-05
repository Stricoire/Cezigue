
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const ADMIN_SECRET = envConfig.MARLOWE_SECRET_KEY;
// Change localhost:3000 to your production URL when testing on prod (e.g. https://cezigue.io)
const TARGET_URL = 'https://cezigue.io/api/admin/sync-stripe'; 

async function syncStripe() {
  console.log(`Triggering Stripe Sync at ${TARGET_URL}...`);
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Synchronization Successful!');
      console.log('Results:', JSON.stringify(data.results, null, 2));
    } else {
      console.error('❌ Synchronization Failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Error executing request:', err.message);
  }
}

syncStripe();
