import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'date-fns';
import { getSlotsForDate } from '@/lib/availability';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const serviceType = searchParams.get('service');

    if (!dateParam || !serviceType) {
        return NextResponse.json({ error: 'Date and service required' }, { status: 400 });
    }

    try {
        const selectedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        const slots = await getSlotsForDate(selectedDate, serviceType);
        return NextResponse.json({ slots });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    }
}
