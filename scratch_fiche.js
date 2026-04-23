const https = require('https');

https.get('https://www.relais-routiers.com/ficherelais.asp?nrelais=JANV29759', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
