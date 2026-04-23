import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function run() {
    const res = await fetch('https://www.relais-routiers.com/ficherelais.asp?nrelais=JANV29759', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $('h1').first().text().trim();
    console.log("H1:", name);
    
    console.log("Adresse:");
    const addressBlock = $('.adresse').first().html() || "";
    // address lines are separated by <br> usually
    const addressText = addressBlock.replace(/<br\s*\/?>/g, ', ').replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    console.log(addressText);

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

    console.log("Facilities:");
    const facilities = [];
    $('.picto_service img').each((i, el) => {
        const src = $(el).attr('src') || "";
        if (src.includes('PL')) facilities.push('parking_pl');
        if (src.includes('douche')) facilities.push('douche');
        if (src.includes('24h')) facilities.push('ouvert_24h');
    });
    console.log(facilities);
}

run().catch(console.error);
