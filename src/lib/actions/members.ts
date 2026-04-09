

'use server';

import { revalidatePath } from 'next/cache';
import type { MemberStatus, JoiningType } from '@/types';
import { notifyAdmins } from '../notifications';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getAdminRole } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { getAdmins } from '@/services/prisma/queries/admin';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/helpers';
import type { Member } from '@/types';
import prisma from '@/lib/prisma';
import { calculateFinancials } from '../financials.server';

function normalizeDate(dateStr?: string | null): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}


export async function registerMember(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error('You must be logged in to register.');

    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const existingMember = await prisma.member.findUnique({ where: { clerkId: userId } });

        const photoFile = formData.get('photo') as File | null;
        const nidFile = formData.get('nidCopy') as File | null;
        const bankFile = formData.get('bankStatement') as File | null;
        
        const memberData: Partial<Member> & { clerkId: string, status: MemberStatus, joiningType: JoiningType } = {
            clerkId: userId,
            status: 'Pending' as MemberStatus,
            rejectionReason: null,
            joiningDate: new Date().toISOString(),
            joiningType: formData.get('joiningType') as JoiningType,
            fullNameBn: formData.get('fullNameBn') as string,
            fullNameEn: formData.get('fullNameEn') as string,
            fatherName: formData.get('fatherName') as string,
            motherName: formData.get('motherName') as string,
            nid: formData.get('nid') as string,
            dob: normalizeDate(formData.get('dob') as string)?.toISOString() || null,
            bloodGroup: formData.get('bloodGroup') as string,
            maritalStatus: formData.get('maritalStatus') as string,
            religion: formData.get('religion') as string,
            mobilePrimary: formData.get('mobilePrimary') as string,
            mobileAlternate: formData.get('mobileAlternate') as string,
            email: formData.get('email') as string,
            currentAddress: formData.get('currentAddress') as string,
            permanentAddress: formData.get('permanentAddress') as string,
            sscBatch: formData.get('sscBatch') as string,
            otherEducation: formData.get('otherEducation') as string,
            profession: formData.get('profession') as string,
            workplace: formData.get('workplace') as string,
            bankName: formData.get('bankName') as string,
            branch: formData.get('branch') as string,
            accountNumber: formData.get('accountNumber') as string,
            accountType: formData.get('accountType') as string,
            bankingMethod: formData.get('bankingMethod') as string,
            nomineeName: formData.get('nomineeName') as string,
            nomineeRelation: formData.get('nomineeRelation') as string,
            nomineeMobile: formData.get('nomineeMobile') as string,
            nomineeAddress: formData.get('nomineeAddress') as string,
        };
        
        if (photoFile && photoFile.size > 0) {
            if (existingMember?.photoPublicId) await deleteFromCloudinary(existingMember.photoPublicId);
            const photoUpload = await uploadToCloudinary(photoFile);
            memberData.photoUrl = photoUpload.secure_url;
            memberData.photoPublicId = photoUpload.public_id;
        } else if (user.imageUrl && !existingMember?.photoUrl) {
             memberData.photoUrl = user.imageUrl;
        }

        if (nidFile && nidFile.size > 0) {
            if (existingMember?.nidCopyPublicId) await deleteFromCloudinary(existingMember.nidCopyPublicId);
            const nidUpload = await uploadToCloudinary(nidFile);
            memberData.nidCopyUrl = nidUpload.secure_url;
            memberData.nidCopyPublicId = nidUpload.public_id;
        }
        if (bankFile && bankFile.size > 0) {
            if (existingMember?.bankStatementPublicId) await deleteFromCloudinary(existingMember.bankStatementPublicId);
            const bankUpload = await uploadToCloudinary(bankFile);
            memberData.bankStatementUrl = bankUpload.secure_url;
            memberData.bankStatementPublicId = bankUpload.public_id;
        }

        const updatedMember = await prisma.member.upsert({
            where: { clerkId: userId },
            update: memberData as any,
            create: memberData as any,
        });

        // Trigger financial calculation immediately after registration
        await calculateFinancials(updatedMember.id);

        await notifyAdmins(
            `New Member Application: ${updatedMember.fullNameEn}`,
            `
                <h1>New Member Registration</h1>
                <p>A new member has applied for registration.</p>
                <ul>
                    <li><strong>Name:</strong> ${updatedMember.fullNameEn}</li>
                    <li><strong>Email:</strong> ${updatedMember.email}</li>
                    <li><strong>Phone:</strong> ${updatedMember.mobilePrimary}</li>
                </ul>
                <p>Please log in to the admin dashboard to review and approve the application.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/admin/members?status=pending">Review Application</a>
            `,
            ['members']
        );
        
    } catch (error) {
        console.error("Registration failed:", error);
        throw new Error("Registration failed. Please try again.");
    }
    
    revalidatePath('/account');
    revalidatePath('/admin/members');
    revalidatePath('/registration');
}

export async function requestProfileUpdate(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authorized');

    const member = await prisma.member.findUnique({
        where: { clerkId: userId },
        select: { id: true, fullNameEn: true }
    });
    if (!member) throw new Error("Member not found.");

    const updateData: { [key: string]: any } = {};
    const photoFile = formData.get('photo') as File | null;
    const nidFile = formData.get('nidCopy') as File | null;
    const bankFile = formData.get('bankStatement') as File | null;
    
    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            if (key === 'dob') {
                updateData[key] = normalizeDate(value as string);
            } else {
                updateData[key] = value;
            }
        }
    });

    if (photoFile && photoFile.size > 0) {
        const { secure_url, public_id } = await uploadToCloudinary(photoFile);
        updateData.photoUrl = secure_url;
        updateData.photoPublicId = public_id;
    }
    if (nidFile && nidFile.size > 0) {
        const { secure_url, public_id } = await uploadToCloudinary(nidFile);
        updateData.nidCopyUrl = secure_url;
        updateData.nidCopyPublicId = public_id;
    }
    if (bankFile && bankFile.size > 0) {
        const { secure_url, public_id } = await uploadToCloudinary(bankFile);
        updateData.bankStatementUrl = secure_url;
        updateData.bankStatementPublicId = public_id;
    }

    const existingUpdate = await prisma.profileUpdate.findFirst({
        where: { memberId: member.id, status: 'Pending' }
    });

    const finalUpdateData = JSON.stringify(updateData);

    if (existingUpdate) {
        await prisma.profileUpdate.update({
             where: { id: existingUpdate.id },
             data: { updateData: finalUpdateData }
        });
    } else {
        await prisma.profileUpdate.create({
            data: { memberId: member.id, status: 'Pending', updateData: finalUpdateData }
        });
    }

    await notifyAdmins(
        `Profile Update Request - ${member.fullNameEn}`,
        `
            <h1>Profile Update Request</h1>
            <p>A member has requested changes to their profile information.</p>
            <ul>
                <li><strong>Name:</strong> ${member.fullNameEn}</li>
                <li><strong>Member ID:</strong> ${member.id}</li>
            </ul>
            <p>Please log in to the admin dashboard to review and approve the changes.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/admin/dashboard">Review Request</a>
        `,
        ['members']
    );

    revalidatePath('/account/edit');
    revalidatePath('/admin/dashboard');
}

export async function approveProfileUpdate(updateId: string) {
    const { userId } = await auth();
    const role = await getAdminRole();
    if (!userId || (role !== 'super' && role !== 'members')) {
        throw new Error("Not authorized for this action.");
    }
    
    const updateRequest = await prisma.profileUpdate.findUnique({
        where: { id: updateId },
        include: { member: true }
    });


    if (!updateRequest) throw new Error("Profile update request not found or already processed.");
    if (updateRequest.status !== 'Pending') throw new Error("Request already processed.");

    const memberId = updateRequest.memberId;
    const dataToUpdate = JSON.parse(updateRequest.updateData as string);
    
    // Normalize date field before updating
    if (dataToUpdate.dob) {
        dataToUpdate.dob = normalizeDate(dataToUpdate.dob);
    }
    
    const oldMemberData = updateRequest.member;
    if (dataToUpdate.photoPublicId && oldMemberData.photoPublicId && dataToUpdate.photoPublicId !== oldMemberData.photoPublicId) {
        await deleteFromCloudinary(oldMemberData.photoPublicId);
    }
    if (dataToUpdate.nidCopyPublicId && oldMemberData.nidCopyPublicId && dataToUpdate.nidCopyPublicId !== oldMemberData.nidCopyPublicId) {
        await deleteFromCloudinary(oldMemberData.nidCopyPublicId);
    }
    if (dataToUpdate.bankStatementPublicId && oldMemberData.bankStatementPublicId && dataToUpdate.bankStatementPublicId !== oldMemberData.bankStatementPublicId) {
        await deleteFromCloudinary(oldMemberData.bankStatementPublicId);
    }

    await prisma.member.update({ where: { id: memberId }, data: dataToUpdate });
    
    await prisma.profileUpdate.update({ where: { id: updateId }, data: { status: 'Approved' }});


    if(updateRequest.member.email) {
        const admins = await getAdmins();
        const approver = admins.find(a => a.id === userId);
        
        let approverName = 'Admin';
        if (approver) {
            approverName = `${approver.name}`;
        }
        
        await sendEmail({
            to: updateRequest.member.email,
            subject: `Your profile update has been approved`,
            html: `
                <h1>Profile Update Approved</h1>
                <p>Dear ${updateRequest.member.fullNameEn},</p>
                <p>Your request to change your profile information has been reviewed and approved.</p>
                <p><strong>Approved by:</strong> ${approverName}</p>
                <p>You can view your updated profile by logging into your account.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/account">View Profile</a>
            `
        });
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/members');
    revalidatePath(`/admin/members/${memberId}`);
}

export async function rejectProfileUpdate(updateId: string) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        throw new Error("Not authorized for this action.");
    }
    
    const updateRequest = await prisma.profileUpdate.findUnique({
        where: { id: updateId },
        include: { member: { select: { email: true, fullNameEn: true } } }
    });
    if (!updateRequest) throw new Error("Update request not found.");

    await prisma.profileUpdate.update({ where: { id: updateId }, data: { status: 'Rejected' }});
    
    if (updateRequest.member.email) {
        await sendEmail({
            to: updateRequest.member.email,
            subject: `Your profile update request status`,
            html: `
                <h1>Profile Update Rejected</h1>
                <p>Dear ${updateRequest.member.fullNameEn},</p>
                <p>Unfortunately, your recent request to update your profile information could not be approved at this time.</p>
                <p>If you believe this is a mistake, please contact an admin.</p>
            `
        });
    }
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/members');
}

export async function updateMember(memberId: string, formData: FormData) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        throw new Error("Not authorized for this action.");
    }

    const member = await prisma.member.findUnique({
        where: { id: memberId }
    });
    if (!member) {
        throw new Error("Member not found.");
    }

    const dataToUpdate: { [key: string]: any } = {};
    const fields = [
        'fullNameBn', 'fullNameEn', 'fatherName', 'motherName', 'nid', 'dob', 'bloodGroup', 'maritalStatus', 'religion',
        'mobilePrimary', 'mobileAlternate', 'email', 'currentAddress', 'permanentAddress', 'sscBatch', 'otherEducation',
        'profession', 'workplace', 'bankName', 'branch', 'accountNumber', 'accountType', 'bankingMethod',
        'nomineeName', 'nomineeRelation', 'nomineeMobile', 'nomineeAddress'
    ];

    fields.forEach(field => {
        if (formData.has(field)) {
            const value = formData.get(field);
            if (field === 'dob') {
                 dataToUpdate[field] = normalizeDate(value as string);
            } else {
                dataToUpdate[field] = value;
            }
        }
    });

    const photoFile = formData.get('photo') as File | null;
    const nidFile = formData.get('nidCopy') as File | null;
    const bankFile = formData.get('bankStatement') as File | null;

    if (photoFile && photoFile.size > 0) {
        if (member.photoPublicId) await deleteFromCloudinary(member.photoPublicId);
        const { secure_url, public_id } = await uploadToCloudinary(photoFile);
        dataToUpdate.photoUrl = secure_url;
        dataToUpdate.photoPublicId = public_id;
    }
    if (nidFile && nidFile.size > 0) {
        if (member.nidCopyPublicId) await deleteFromCloudinary(member.nidCopyPublicId);
        const { secure_url, public_id } = await uploadToCloudinary(nidFile);
        dataToUpdate.nidCopyUrl = secure_url;
        dataToUpdate.nidCopyPublicId = public_id;
    }
    if (bankFile && bankFile.size > 0) {
        if (member.bankStatementPublicId) await deleteFromCloudinary(member.bankStatementPublicId);
        const { secure_url, public_id } = await uploadToCloudinary(bankFile);
        dataToUpdate.bankStatementUrl = secure_url;
        dataToUpdate.bankStatementPublicId = public_id;
    }

    await prisma.member.update({ where: { id: memberId }, data: dataToUpdate });
    
    revalidatePath(`/admin/members/edit/${memberId}`);
    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath('/admin/members');
}

    