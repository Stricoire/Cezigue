// Use the key injected into env
const API_KEY = "b059e194-5304-4bb5-b23e-e30fecedab7c";

const query = `
query {
  poi(
    filters: [
      {
        isLocatedAt: {
          schema_geo: {
            _geo_distance: {
              lng: 1.5503,
              lat: 43.8166,
              distance: "15km"
            }
          }
        }
      }
    ],
    size: 5
  ) {
    results {
      dc_title
    }
  }
}
`;

async function run() {
  const res = await fetch(`https://api.datatourisme.fr/api/queries?apikey=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  
  if (!res.ok) {
    console.error("HTTP error:", res.status, res.statusText);
    const text = await res.text();
    console.error(text);
    return;
  }
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
