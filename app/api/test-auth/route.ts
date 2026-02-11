import { NextResponse } from 'next/server';
import { calendar, CALENDAR_ID } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Check Env Vars availability (Don't reveal values, just length)
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY;
        const calId = process.env.GOOGLE_CALENDAR_ID;

        const debugInfo = {
            emailLength: email ? email.length : 0,
            emailPreview: email ? `${email.substring(0, 5)}...${email.substring(email.length - 5)}` : 'N/A',
            keyLength: key ? key.length : 0,
            calId: calId,
            keyHasBegin: key?.includes('BEGIN PRIVATE KEY'),
            keyHasEnd: key?.includes('END PRIVATE KEY'),
        };

        // 2. Attempt Connection
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            maxResults: 1,
            singleEvents: true,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Connected to Google Calendar successfully!',
            calendarId: CALENDAR_ID,
            firstEvent: response.data.items?.[0] || 'No events found (but connection worked)',
            debug: debugInfo
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            debug: {
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing',
                key: process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing',
                calendarId: process.env.GOOGLE_CALENDAR_ID ? 'Present' : 'Missing',
                envKeyPreview: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 20) + '...' : 'N/A'
            }
        }, { status: 500 });
    }
}
