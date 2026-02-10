import { NextRequest, NextResponse } from 'next/server';
import { parse, addDays, format } from 'date-fns';
import { getSlotsForDate } from '@/lib/availability';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('startDate'); // YYYY-MM-DD
    const daysParam = searchParams.get('days');
    const serviceType = searchParams.get('service');

    if (!dateParam || !serviceType) {
        return NextResponse.json({ error: 'Start date and service required' }, { status: 400 });
    }

    const startDate = parse(dateParam, 'yyyy-MM-dd', new Date());
    const days = parseInt(daysParam || '14', 10);

    // Limit max days to avoid rate limits
    if (days > 60) return NextResponse.json({ error: 'Max 60 days' }, { status: 400 });

    const availabilityMap: Record<string, boolean> = {};

    try {
        // Parallelize requests? Google might rate limit. 
        // Better: sequential or batched.
        // For 14 days, sequential is fine for MVP.
        const promises = [];
        for (let i = 0; i < days; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            // Optimization: If it's Sunday (or Sat for Surgery), we know it's empty without API call
            // We can delegate this optimization to getSlotsForDate, but it still makes an API call for "busy events" currently.
            // Let's just call it.
            promises.push(
                getSlotsForDate(date, serviceType)
                    .then(slots => ({ date: dateStr, hasSlots: slots.length > 0 }))
            );
        }

        const results = await Promise.all(promises);
        results.forEach(r => {
            availabilityMap[r.date] = r.hasSlots;
        });

        return NextResponse.json({ availability: availabilityMap });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}
