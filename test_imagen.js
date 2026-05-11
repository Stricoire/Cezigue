require('dotenv').config({ path: '.env.local' });

async function testImagen() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  
  const payload = {
    instances: [
      {
        prompt: "A beautiful 3D isometric illustration of a small futuristic coffee shop. Cartoony style, angular shapes, pure white background."
      }
    ],
    parameters: {
      sampleCount: 1
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Success! Image base64 received. Length:", data.predictions[0].bytesBase64Encoded.length);
    } else {
      console.error("API Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Network Error:", err);
  }
}

testImagen();
