const queryParams = encodeURIComponent('[out:json];node(around:5000, 43.604, 1.444)["amenity"="car_sharing"];out 5;');
fetch('http://overpass-api.de/api/interpreter?data=' + queryParams)
  .then(r=>r.json())
  .then(d=> console.log('Carsharing Toulouse:', d.elements.map(e => e.tags.name || e.tags.operator || 'Unknown')))
  .catch(console.error);
