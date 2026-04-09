
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';
import { calculateFinancials } from '@/lib/financials.server';

export async function POST(req: NextRequest) {
  try {
    const adminRole = await getAdminRole();

    if (adminRole !== 'super' && adminRole !== 'members') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
      
    const { clerkId, joiningType } = await req.json();

    if (!clerkId || typeof clerkId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid Clerk ID' }, { status: 400 });
    }
    
    const trimmedUserId = clerkId.trim();
    if (!trimmedUserId) {
        return NextResponse.json({ error: 'Clerk ID cannot be empty.' }, { status: 400 });
    }
    
    const client = await clerkClient();
    const authUser = await client.users.getUser(trimmedUserId);
    if (!authUser) {
        return NextResponse.json({ error: 'User not found with this Clerk ID.' }, { status: 404 });
    }
    
    const email = authUser.emailAddresses[0]?.emailAddress;
    
    const existingMember = await prisma.member.findUnique({
        where: { clerkId: trimmedUserId }
    });
        
    if (existingMember) {
        return NextResponse.json({ error: 'A member with this Clerk ID already exists.' }, { status: 409 });
    }
    
    if (email) {
        const existingByEmail = await prisma.member.findFirst({
            where: { email: email }
        });
        if (existingByEmail) {
            return NextResponse.json({ error: 'A member with this email address already exists.' }, { status: 409 });
        }
    }

    if (email && email === process.env.SUPER_ADMIN_EMAIL) {
        const client = await clerkClient();
        await client.users.updateUser(authUser.id, {
            publicMetadata: { role: 'super' }
        });
    }
    
    const newMember = await prisma.member.create({
        data: {
            clerkId: trimmedUserId,
            email: email,
            fullNameEn: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || email || 'New Member',
            photoUrl: authUser.imageUrl,
            status: 'AwaitingRegistration',
            joiningType: joiningType || 'New',
            joiningDate: new Date(),
            
            // Pre-fill with temporary data
            nid: `TEMP_NID_${Date.now()}`,
            mobilePrimary: `01000000000`,
            dob: new Date('2000-12-30T00:00:00.000Z'),

            // Set other required fields to empty strings or defaults to avoid DB null issues
            fullNameBn: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'নতুন সদস্য',
            fatherName: 'N/A',
            motherName: 'N/A',
            bloodGroup: 'N/A',
            maritalStatus: 'unmarried',
            religion: 'N/A',
            currentAddress: 'N/A',
            permanentAddress: 'N/A',
            sscBatch: 'N/A',
            profession: 'N/A',
            bankName: 'N/A',
            branch: 'N/A',
            accountNumber: 'N/A',
            accountType: 'savings',
            nomineeName: 'N/A',
            nomineeRelation: 'N/A',
            nomineeMobile: 'N/A',
            nomineeAddress: 'N/A',
        }
    });

    // Immediately calculate financials for the new member
    await calculateFinancials(newMember.id);
    
    revalidatePath('/admin/members');
    return NextResponse.json({ success: true, member: newMember });

  } catch (err: any) {
    console.error("Create Member API Error:", err);
    if (err.message.includes('A member with this Clerk ID already exists.')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err.message.includes('A member with this email address already exists.')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create member due to a server error.' }, { status: 500 });
  }
}
