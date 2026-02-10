const http = require('http');

const data = JSON.stringify({
    name: 'Test Native',
    email: 'test@example.com',
    notes: 'Native http test',
    date: '2026-02-12',
    time: '10:00'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/book',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
