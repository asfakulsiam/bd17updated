
import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import { exportData, importData } from '@/lib/actions/data-management';

async function verifySuperAdmin() {
    const adminRole = await getAdminRole();
    if (adminRole !== 'super') {
        throw new Error("Not authorized for this action.");
    }
}

export async function GET(req: NextRequest) {
    try {
        await verifySuperAdmin();
        const content = await exportData();
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="bondhon17_export_${new Date().toISOString().split('T')[0]}.zip"`
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await verifySuperAdmin();
        const importedData = await req.json();

        if (!importedData) {
             return NextResponse.json({ error: 'No data provided for import.' }, { status: 400 });
        }
        
        await importData(importedData);

        return NextResponse.json({ message: 'Import successful' });

    } catch (error: any) {
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
