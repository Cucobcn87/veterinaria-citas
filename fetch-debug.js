const https = require('https');

https.get('https://veterinaria-citas-gcpij0sth-bastets-projects-9ed59e76.vercel.app/api/test-auth', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (e) => {
    console.error(e);
});
