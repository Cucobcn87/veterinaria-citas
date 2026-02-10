const fetch = require('node-fetch'); // You might need to install this if not available, or use built-in fetch in newer node

async function testApi() {
    try {
        console.log('Testing API booking...');
        const response = await fetch('http://localhost:3000/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test API User',
                email: 'test@example.com',
                notes: 'Test note from script',
                date: '2026-02-12', // Use a future date
                time: '10:00'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
