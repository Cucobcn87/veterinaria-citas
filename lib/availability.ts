import { calendar, CALENDAR_ID } from '@/lib/google';
import { addMinutes, format, isBefore, startOfDay, endOfDay, setHours, setMinutes, getDay, parse, addHours } from 'date-fns';

const SERVICES = {
    consulta: { duration: 30 },
    vacuna: { duration: 30 },
    unas: { duration: 15 },
    cirugia: { duration: 120 }
};

export async function getSlotsForDate(date: Date, serviceType: string): Promise<string[]> {
    if (!SERVICES[serviceType as keyof typeof SERVICES]) return [];

    const dayOfWeek = getDay(date);
    const serviceDuration = SERVICES[serviceType as keyof typeof SERVICES].duration;

    // Buffer: Min time is now + 1 hour
    const now = new Date();
    const minTime = addHours(now, 1);

    // Define working intervals
    type Interval = { start: { h: number; m: number }; end: { h: number; m: number } };
    let ranges: Interval[] = [];

    // SPECIAL RULE: Surgery only Mon-Fri at 10:00
    if (serviceType === 'cirugia') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 12, m: 0 } });
        }
    }
    else {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 14, m: 0 } });
            ranges.push({ start: { h: 16, m: 30 }, end: { h: 20, m: 30 } });
        } else if (dayOfWeek === 6) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 14, m: 0 } });
        }
    }

    if (ranges.length === 0) return [];

    const queryStart = setMinutes(setHours(startOfDay(date), ranges[0].start.h), ranges[0].start.m);
    const lastRange = ranges[ranges.length - 1];
    const queryEnd = setMinutes(setHours(startOfDay(date), lastRange.end.h), lastRange.end.m);

    // Fetch events
    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: queryStart.toISOString(),
            timeMax: queryEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const busyEvents = response.data.items || [];
        const slots: string[] = [];

        for (const range of ranges) {
            let currentSlot = setMinutes(setHours(startOfDay(date), range.start.h), range.start.m);
            const rangeEnd = setMinutes(setHours(startOfDay(date), range.end.h), range.end.m);

            while (isBefore(currentSlot, rangeEnd)) {
                const slotEnd = addMinutes(currentSlot, serviceDuration);

                // Checks:
                // 1. Slot must be within range
                if (isBefore(rangeEnd, slotEnd)) break;

                // 2. Slot must be in the future (with 1h buffer)
                if (isBefore(currentSlot, minTime)) {
                    // CAREFUL: If we just continue, we might be stuck if we don't increment
                    const step = (serviceType === 'unas' || serviceType === 'vacuna') ? 15 : 30;
                    currentSlot = addMinutes(currentSlot, step);
                    continue;
                }

                const isBusy = busyEvents.some(event => {
                    if (!event.start?.dateTime || !event.end?.dateTime) return false;
                    const eventStart = new Date(event.start.dateTime);
                    const eventEnd = new Date(event.end.dateTime);
                    return (currentSlot < eventEnd && slotEnd > eventStart);
                });

                if (!isBusy) {
                    slots.push(format(currentSlot, 'HH:mm'));
                }

                if (serviceType === 'cirugia') break; // One slot max

                const step = (serviceType === 'unas' || serviceType === 'vacuna') ? 15 : 30;
                currentSlot = addMinutes(currentSlot, step);
            }
        }
        return slots;

    } catch (error) {
        console.error("Error fetching google calendar:", error);
        return [];
    }
}
