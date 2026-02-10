import { NextRequest, NextResponse } from 'next/server';
import { calendar, CALENDAR_ID } from '@/lib/google';
import { parse, addMinutes } from 'date-fns';

const SERVICE_DURATIONS = {
    consulta: 30,
    vacuna: 30,
    unas: 15,
    cirugia: 120
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ownerName, petName, mobile, notes, date, time, service, reason, vaccineType } = body;

        if (!ownerName || !petName || !mobile || !date || !time || !service) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // @ts-ignore
        const duration = SERVICE_DURATIONS[service] || 30;

        const startDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = addMinutes(startDateTime, duration);

        // Format: "Nombre Apellidos (Mascota) - Movil"
        const summary = `${ownerName} (${petName}) - ${mobile}`;

        let description = `Tipo: ${service}`;
        if (service === 'consulta' && reason) description += `\nMotivo: ${reason}`;
        if (service === 'vacuna' && vaccineType) description += `\nVacuna: ${vaccineType}`;
        if (notes) description += `\nNotas: ${notes}`;

        const event = {
            summary: summary,
            description: description,
            start: {
                dateTime: startDateTime.toISOString(),
            },
            end: {
                dateTime: endDateTime.toISOString(),
            },
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
        });

        return NextResponse.json({ success: true, eventId: response.data.id });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
    }
}
