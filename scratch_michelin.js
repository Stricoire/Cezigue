const https = require('https');

https.get('https://raw.githubusercontent.com/ngshiheng/michelin-my-maps/main/data/michelin_my_maps.csv', (res) => {
    let data = '';
    res.on('data', chunk => {
       data += chunk;
       if (data.length > 5000) res.destroy(); // Only need a snippet
    });
    res.on('close', () => console.log(data));
});
