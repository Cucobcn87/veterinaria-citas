const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    try {
        console.log('Testing authentication...');
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        console.log('Listing calendars...');
        const res = await calendar.calendarList.list();
        console.log('Calendars found:', res.data.items?.length);

        console.log('Trying to insert event in:', process.env.GOOGLE_CALENDAR_ID);
        const event = {
            summary: 'Test Event from Bot',
            description: 'Auto-generated test event to verify write permissions.',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
        };

        console.log('Inserting test event...');
        try {
            const insertRes = await calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID,
                requestBody: event,
            });
            console.log('SUCCESS: Event created with ID:', insertRes.data.id);

            console.log('Deleting test event...');
            await calendar.events.delete({
                calendarId: process.env.GOOGLE_CALENDAR_ID,
                eventId: insertRes.data.id
            });
            console.log('SUCCESS: Event deleted.');

        } catch (insertError) {
            console.error('INSERT FAILED:', insertError.message);
            if (insertError.response) {
                console.error('Response data:', JSON.stringify(insertError.response.data, null, 2));
            }
        }

    } catch (error) {
        console.error('GENERAL FAILURE:', error.message);
    }
}

testConnection();
