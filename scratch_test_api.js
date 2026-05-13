const fetch = require('node-fetch'); // or native fetch if Node 18+

async function run() {
  const reqBody = {
    startLocation: { lat: 43.8344, lon: 1.5439, address: "627 Route de Villemur 31340 Mirepoix-sur-Tarn" },
    destination: { lat: 43.6044, lon: 1.4439, address: "Place du Capitole 31000 Toulouse" },
    vehicleType: "thermique",
    fuelType: "SP95",
    tankCapacity: 50,
    initialFuelLevel: 100,
    tripType: "express",
    tastes: [],
    searchKeyword: "PMR|handicapé|adapté|fauteuil roulant|accessibilité|stationnement réservé|CMI|GIG|GIC|Personne à mobilité réduite|Prioritaire|Stationnement spécifique|Disabled parking",
    lockedCategories: ["parking"]
  };

  try {
    const res = await fetch('http://localhost:3000/api/travel-planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    try {
      const data = JSON.parse(text);
      console.log("POIs found:", data.corridor?.poisFound);
      console.log("First POI:", data.corridor?.pois?.[0]);
    } catch (e) {
      console.log("Response text:", text.substring(0, 500));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
