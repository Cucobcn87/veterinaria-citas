import { NextRequest, NextResponse } from 'next/server';
import { calendar, CALENDAR_ID } from '@/lib/google';
import { parse, addMinutes, format } from 'date-fns';

const SERVICE_DURATIONS = {
    consulta: 30,
    vacuna: 30,
    unas: 15,
    cirugia: 120,
    domicilio: 30
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ownerName, petName, mobile, notes, date, time, service, reason, vaccineType, address } = body;

        if (!ownerName || !petName || !mobile || !date || !time || !service) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (service === 'domicilio' && !address) {
            return NextResponse.json({ error: 'Address is required for home visits' }, { status: 400 });
        }

        // @ts-ignore
        const duration = SERVICE_DURATIONS[service] || 30;

        const startDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = addMinutes(startDateTime, duration);

        // Format: "Nombre Apellidos (Mascota) - Movil"
        const summary = `${ownerName} (${petName}) - ${mobile}`;

        let description = `Tipo: ${service}`;
        if (service === 'consulta' && reason) description += `\nMotivo: ${reason}`;
        if (service === 'domicilio' && reason) description += `\nMotivo: ${reason}`;
        if (service === 'domicilio' && address) description += `\nDirección: ${address}`;
        if (service === 'vacuna' && vaccineType) description += `\nVacuna: ${vaccineType}`;
        if (notes) description += `\nNotas: ${notes}`;

        const event = {
            summary: summary,
            description: description,
            location: address || '',
            start: {
                dateTime: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"), // Send local time
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
                timeZone: 'Europe/Madrid',
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
