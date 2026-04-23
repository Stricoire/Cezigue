const https = require('https');

function queryOverpass(query) {
    return new Promise((resolve, reject) => {
        const req = https.request('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(`data=${encodeURIComponent(query)}`);
        req.end();
    });
}

async function run() {
    console.log("Checking Michelin stars...");
    // bbox around Toulouse/South-West roughly: 43.0, 1.0, 44.0, 2.0
    const michelinQuery = `
    [out:json][timeout:25];
    (
      node["award:michelin"](43.0, 1.0, 44.0, 2.0);
      node["guide:michelin"](43.0, 1.0, 44.0, 2.0);
    );
    out body;
    `;
    
    try {
        const res = await queryOverpass(michelinQuery);
        console.log(`Michelin restaurants found: ${res.elements.length}`);
        if(res.elements.length > 0) {
            console.log(res.elements[0].tags);
        }
    } catch(e) {
        console.error(e);
    }

    console.log("Checking Relais Routiers...");
    const routierQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"]["brand"~"Relais Routiers",i](43.0, 1.0, 44.0, 2.0);
      node["truck_stop"="yes"](43.0, 1.0, 44.0, 2.0);
    );
    out body;
    `;
    
    try {
        const res2 = await queryOverpass(routierQuery);
        console.log(`Relais routiers found: ${res2.elements.length}`);
        if(res2.elements.length > 0) {
            console.log(res2.elements[0].tags);
        }
    } catch(e) {
        console.error(e);
    }
}

run();
