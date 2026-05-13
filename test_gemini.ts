import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: "Test" });

const allMessages = [
  { role: 'assistant', content: 'Bonjour ! Décrivez-moi le service métier que vous souhaitez créer.' },
  { role: 'user', content: 'je veux un service pour trouver des points deau' },
  { role: 'assistant', content: 'D\'accord.' },
  { role: 'user', content: 'ouais alors je sais pas est-ce que toi tu as d\'autres idées à répéter après me soumettre par exemple sur les points en plus à chercher que ce qu\'on vient de dire' }
];

const contents: { role: string, parts: { text: string }[] }[] = [];
let lastRole = null;

for (const msg of allMessages) {
  const role = msg.role === 'user' ? 'user' : 'model';
  if (role === lastRole) {
     contents[contents.length - 1].parts[0].text += "\n\n" + msg.content;
  } else {
     contents.push({ role, parts: [{ text: msg.content }] });
     lastRole = role;
  }
}

if (contents.length > 0 && contents[0].role === 'model') {
   contents.shift();
}

console.dir(contents, {depth: null});

async function run() {
  try {
    const result = await model.generateContent({ contents });
    console.log(result.response.text());
  } catch (err) {
    console.error("API Error:", err);
  }
}

run();
