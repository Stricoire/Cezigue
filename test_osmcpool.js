const query = encodeURIComponent('[out:json];node(around:5000, 43.604, 1.444)["amenity"="carpooling"];out 5;');
fetch('http://overpass-api.de/api/interpreter?data=' + query)
  .then(r=>r.json())
  .then(d=> console.log('Carpooling Toulouse:', d.elements.map(e => e.tags.name || 'Aire de Covoiturage')))
  .catch(console.error);

const query2 = encodeURIComponent('[out:json];node(around:25000, 43.815, 1.560)["amenity"="carpooling"];out 5;');
fetch('http://overpass-api.de/api/interpreter?data=' + query2)
  .then(r=>r.json())
  .then(d=> console.log('Carpooling (Mirepoix 25km):', d.elements.map(e => e.tags.name || 'Aire de Covoiturage')))
  .catch(console.error);
