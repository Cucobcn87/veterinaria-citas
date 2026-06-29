import { calendar, CALENDAR_ID } from '@/lib/google';
import { addMinutes, format, isBefore, addHours } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const SERVICES = {
    consulta: { duration: 30 },
    vacuna: { duration: 30 },
    unas: { duration: 15 },
    cirugia: { duration: 120 },
    domicilio: { duration: 30 }
};

const TIME_ZONE = 'Europe/Madrid';

export async function getSlotsForDate(date: Date, serviceType: string): Promise<string[]> {
    if (!SERVICES[serviceType as keyof typeof SERVICES]) return [];

    // 1. Trust the date string part only (YYYY-MM-DD)
    const dateStr = format(date, 'yyyy-MM-dd');

    // 2. Determine Day of Week in Madrid
    // Create a date object at 12:00 Madrid time to strictly check the day of week
    const noonMadrid = fromZonedTime(`${dateStr} 12:00`, TIME_ZONE);
    const dayOfWeek = parseInt(format(noonMadrid, 'i')); // 1 (Mon) - 7 (Sun)

    const serviceDuration = SERVICES[serviceType as keyof typeof SERVICES].duration;

    // Buffer: Min time is Now (in Madrid) + 1 hour
    const nowUtc = new Date();
    const nowMadrid = toZonedTime(nowUtc, TIME_ZONE);
    const minTimeMadrid = addHours(nowMadrid, 1);

    // Define working intervals (Local Madrid Hours)
    type Interval = { start: { h: number; m: number }; end: { h: number; m: number } };
    let ranges: Interval[] = [];

    // RULES (Same logic, but dayOfWeek is ISO 1-7 now? format 'i' returns 1-7)
    // Javascript getDay() returns 0-6 (Sun-Sat). 
    // Let's stick to standard getDay() logic if possible, or mapping.
    // format 'i' returns '1' (Mon) to '7' (Sun).
    // Logic below:
    // Mon-Fri: 1-5. Sat: 6. Sun: 7.

    if (serviceType === 'cirugia') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 12, m: 0 } });
        }
    }
    else if (serviceType === 'domicilio') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            ranges.push({ start: { h: 14, m: 15 }, end: { h: 14, m: 45 } });
        }
    }
    else {
        // General
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 14, m: 0 } });
            ranges.push({ start: { h: 16, m: 0 }, end: { h: 20, m: 0 } });
        } else if (dayOfWeek === 6) {
            ranges.push({ start: { h: 10, m: 0 }, end: { h: 14, m: 0 } });
        }
    }

    if (ranges.length === 0) return [];

    // Calculate Query Range in UTC to fetch from Google
    // We fetch from Start of first range to End of last range (converted to UTC)
    const firstRangeStartLocal = `${dateStr} ${ranges[0].start.h.toString().padStart(2, '0')}:${ranges[0].start.m.toString().padStart(2, '0')}`;
    const lastRangeEndLocal = `${dateStr} ${ranges[ranges.length - 1].end.h.toString().padStart(2, '0')}:${ranges[ranges.length - 1].end.m.toString().padStart(2, '0')}`;

    const queryStartUtc = fromZonedTime(firstRangeStartLocal, TIME_ZONE);
    const queryEndUtc = fromZonedTime(lastRangeEndLocal, TIME_ZONE);

    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: queryStartUtc.toISOString(),
            timeMax: queryEndUtc.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const busyEvents = response.data.items || [];
        const slots: string[] = [];

        for (const range of ranges) {
            // Construct current slot start in Local Madrid Time
            // We use simple integer math or strings to iterate to avoid Date object shift confusion
            // actually, iterating with Date objects in Madrid Time (Date-fns-tz) is safer?
            // Let's use string construction -> fromZonedTime for checking.

            let currentH = range.start.h;
            let currentM = range.start.m;

            // Loop until we reach end
            // We can convert start/end to minutes for easier loop
            let currentMinutes = currentH * 60 + currentM;
            const endMinutes = range.end.h * 60 + range.end.m;

            while (currentMinutes < endMinutes) {
                // Construct Slot Time
                const h = Math.floor(currentMinutes / 60);
                const m = currentMinutes % 60;
                const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const slotIsoString = `${dateStr} ${timeString}`;

                const slotStartUtc = fromZonedTime(slotIsoString, TIME_ZONE);
                const slotEndUtc = addMinutes(slotStartUtc, serviceDuration);

                // 1. Check Range Boundaries
                // (Loop condition handles start < end, but we must ensure slotEnd <= rangeEnd)
                // Actually easier to just check if slotStart + duration > rangeEnd
                const rangeEndUtc = fromZonedTime(`${dateStr} ${ranges.find(r => r === range)?.end.h}:${ranges.find(r => r === range)?.end.m}`, TIME_ZONE);
                if (isBefore(rangeEndUtc, slotEndUtc)) {
                    // Break loop for this range
                    break;
                }

                // 2. Check Future Buffer
                // Compare slotStartUtc (as Madrid) vs minTimeMadrid? 
                // No, compare timestamps. 
                // slotStartUtc is a Date object (UTC timestamp)
                // minTimeMadrid is a Date object (Madrid timestamp... wait).
                // toZonedTime returns a Date object that represents the local time components... 
                // actually toZonedTime returns a Date which if printed in system timezone looks like the target timezone.
                // BUT comparisons should be done on timestamps (getTime()).
                // Let's stick to UTC for comparisons.
                // minTimeUtc = addHours(nowUtc, 1).
                // if (isBefore(slotStartUtc, minTimeUtc)) ...
                const minTimeUtc = addHours(nowUtc, 1);

                if (isBefore(slotStartUtc, minTimeUtc)) {
                    // Increment and continue
                    const step = (serviceType === 'unas' || serviceType === 'vacuna') ? 15 : 30;
                    currentMinutes += step;
                    continue;
                }

                // 3. Check Overlaps
                const isBusy = busyEvents.some(event => {
                    if (!event.start?.dateTime || !event.end?.dateTime) return false;
                    const eventStart = new Date(event.start.dateTime); // Automatically understands ISO with offset
                    const eventEnd = new Date(event.end.dateTime);

                    // Simple logic: Busy if (SlotStart < EventEnd) AND (SlotEnd > EventStart)
                    return (slotStartUtc.getTime() < eventEnd.getTime()) && (slotEndUtc.getTime() > eventStart.getTime());
                });

                if (!isBusy) {
                    slots.push(timeString);
                }

                if (serviceType === 'cirugia') break; // One slot max

                const step = (serviceType === 'unas' || serviceType === 'vacuna') ? 15 : 30;
                currentMinutes += step;
            }
        }
        return slots;

    } catch (error) {
        console.error("Error fetching google calendar:", error);
        return [];
    }
}
