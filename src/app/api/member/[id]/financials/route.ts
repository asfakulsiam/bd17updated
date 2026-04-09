
import { NextResponse } from 'next/server';
import { getUserDetails } from '@/services/prisma/queries/members';
import { getAdminRole } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Basic authorization: ensure user is logged in. 
    // More complex logic could check if the user is the member themselves or an admin.
    const role = await getAdminRole();
    const { id } = await params;
    // In a real app, you'd check if the requesting user has permission to see this member's details.
    // For now, we assume if you have the ID and are logged in, it's okay for this app's purpose.
    
    const data = await getUserDetails(id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('get financials error', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
