const https = require('https');

https.get('https://www.relais-routiers.com/sitemap.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const matches = data.match(/ficherelais\.asp\?nrelais=([A-Z0-9]+)/g);
        console.log(`Found ${matches ? matches.length : 0} relais routiers in sitemap.`);
    });
});
