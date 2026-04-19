const originLat = 43.815;
const originLng = 1.560;
const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux/records?where=within_distance(geom, geom'POINT(${originLng} ${originLat})', 15km)&limit=5`;
console.log('Fetching', url);
fetch(url).then(r=>r.json()).then(d => {
  if (d.results && d.results.length > 0) {
    const station = d.results[0];
    console.log('Fuel Station Found:', station.adresse, station.ville);
    const prixArr = typeof station.prix === 'string' ? JSON.parse(station.prix) : station.prix;
    const sp95 = prixArr?.find(p => p['@nom'].includes('SP95') || p['@nom'].includes('E10'));
    const gazole = prixArr?.find(p => p['@nom'].includes('Gazole'));
    console.log('SP95/E10:', sp95 ? sp95['@valeur'] : 'N/A', 'Gazole:', gazole ? gazole['@valeur'] : 'N/A');
  } else { console.log('No fuel station found'); }
}).catch(console.error);
