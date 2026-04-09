
import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from '@/lib/actions/admin';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        await updateSettings(formData);
        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
