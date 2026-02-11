import { google } from 'googleapis';

// Configure the Google Calendar API client
// We use a Service Account for server-to-server authentication
export const calendar = google.calendar({
    version: 'v3',
    auth: new google.auth.JWT({
        email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim(),
        key: (process.env.GOOGLE_PRIVATE_KEY || '')
            .replace(/\\n/g, '\n')
            .replace(/^"|"$/g, ''), // Remove surrounding quotes if present
        scopes: ['https://www.googleapis.com/auth/calendar'],
    }),
});

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
