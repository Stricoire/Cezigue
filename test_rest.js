require('dotenv').config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const flashModels = data.models.map(m => m.name).filter(n => n.includes('flash'));
  console.log(flashModels);
}
test();
