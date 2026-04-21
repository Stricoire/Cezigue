const lat = "43.8333";
const lon = "1.5500";
const radiusMeters = 15000;

async function testOSM() {
    console.log("Testing OSM...");
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["shop"~"supermarket|bakery|butcher|farm|greengrocer"](around:${radiusMeters},${lat},${lon});
        node["amenity"~"pharmacy|doctors|hospital|post_office"](around:${radiusMeters},${lat},${lon});
      );
      out center;
    `;
    const overpassRes = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(overpassQuery), {
      method: "GET",
      headers: {
        "User-Agent": "CezigueMobilityApp/1.0",
        "Accept": "application/json"
      }
    });
    console.log("OSM status:", overpassRes.status);
    if (!overpassRes.ok) {
        console.error(await overpassRes.text());
    } else {
        const osmData = await overpassRes.json();
        console.log("OSM results:", osmData.elements?.length);
    }
}

async function testDT() {
    console.log("Testing DT...");
    const API_KEY = "b059e194-5304-4bb5-b23e-e30fecedab7c";
    const insee = "31346";
    const dtQuery = `
          query {
            poi(
              filters: [
                { allowedTypes: ["EntertainmentAndEvent"] },
                { isLocatedAt: { schema_address: { hasAddressCity: { insee: { _eq: "${insee}" } } } } }
              ]
              size: 20
            ) {
              results {
                dc_title
              }
            }
          }
        `;
        const dtRes = await fetch(`https://api.datatourisme.fr/graphql?apikey=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: dtQuery })
        });
        console.log("DT status:", dtRes.status);
        if (!dtRes.ok) {
            console.error(await dtRes.text());
        } else {
            const data = await dtRes.json();
            console.log("DT results:", JSON.stringify(data));
        }

}

testOSM();
testDT();
