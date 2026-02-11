require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testAuth() {
    console.log('Testing credentials locally...');
    console.log('Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const key = process.env.GOOGLE_PRIVATE_KEY;
    console.log('Key length:', key ? key.length : 0);

    // The key in .env.local usually has literal \n characters if it was created by some tools,
    // or real newlines if it's a multiline string.
    // Let's try to normalize it.
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
        console.error('❌ GOOGLE_PRIVATE_KEY is missing from .env.local');
        return;
    }

    // If it's wrapped in quotes, dotenv might have handled it, but let's be safe.
    // The replace logic handles the case where newlines are escaped strings "\\n"
    privateKey = privateKey.replace(/\\n/g, '\n');
    console.log('Key preview:', privateKey.substring(0, 30) + '...');

    const jwtClient = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/calendar']
    });

    try {
        await jwtClient.authorize();
        console.log('✅ Auth successful! Token obtained.');

        const calendar = google.calendar({ version: 'v3', auth: jwtClient });
        const res = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            maxResults: 1
        });
        console.log('✅ Calendar access successful. Events found:', res.data.items ? res.data.items.length : 0);

    } catch (error) {
        console.error('❌ Auth Failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testAuth();
