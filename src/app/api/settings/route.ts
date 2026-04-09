
import { getSettings } from '@/services/prisma/queries/admin';
import { NextResponse } from 'next/server';

export const revalidate = 60; // Revalidate at most every 60 seconds

export async function GET() {
    try {
        const settings = await getSettings();
        if (!settings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
