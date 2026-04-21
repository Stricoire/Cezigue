
const q = `[out:json][timeout:25]; area[name="Bessières"][admin_level=8]->.searchArea; (node[shop](area.searchArea); node[amenity](area.searchArea); node[leisure](area.searchArea);); out center;`;

fetch('https://overpass-api.de/api/interpreter', {method:'POST', body:q})
  .then(r => r.json())
  .then(d => console.log(d.elements.map(e => ({ name: e.tags.name, type: e.tags.amenity || e.tags.shop || e.tags.leisure }))));
