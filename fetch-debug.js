const https = require('https');

https.get('https://veterinaria-citas-gray.vercel.app/api/test-auth', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (e) => {
    console.error(e);
});
