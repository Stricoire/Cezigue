const fs = require('fs');
const html = fs.readFileSync('scratch_fiche.html', 'utf16le');

// Extract name, address, latitude, longitude
const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
const latMatch = html.match(/lat:\s*([\d\.]+)/);
const lonMatch = html.match(/lng:\s*([\d\.]+)/);

console.log("Name:", nameMatch ? nameMatch[1].trim().replace(/<[^>]+>/g, '') : "Not found");
console.log("Lat:", latMatch ? latMatch[1] : "Not found");
console.log("Lon:", lonMatch ? lonMatch[1] : "Not found");

// print out address section roughly
const addressMatch = html.match(/class="adresse"[^>]*>([\s\S]*?)<\/div>/);
console.log("Address:", addressMatch ? addressMatch[1].replace(/<[^>]+>/g, ' ').trim() : "Not found");
