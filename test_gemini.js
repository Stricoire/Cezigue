const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Bonjour, es-tu là?");
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();
