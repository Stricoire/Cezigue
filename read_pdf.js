const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('D:\\Antigravity\\Cezigue\\Antchouski\\Inputs\\Sales material\\Cezigue mobility Portfolio - FR.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
