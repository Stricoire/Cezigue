const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('scratch_fiche.html', 'utf16le');
const $ = cheerio.load(html);

console.log("H1:", $('h1').text().trim());
console.log("Adresse elements:");
$('.adresse').each((i, el) => {
   console.log($(el).text().trim());
});

// Search for coordinates in script tags
let lat = null, lon = null;
$('script').each((i, el) => {
    const text = $(el).html() || "";
    const mLat = text.match(/lat:\s*([\d\.\-]+)/);
    const mLon = text.match(/lng:\s*([\d\.\-]+)/);
    if (mLat && mLon) {
       lat = mLat[1]; lon = mLon[1];
    }
});
console.log(`Coords: ${lat}, ${lon}`);

// Search for facilities
console.log("Facilities (pictos):");
$('.picto_service img').each((i, el) => {
    console.log($(el).attr('alt') || $(el).attr('src'));
});
