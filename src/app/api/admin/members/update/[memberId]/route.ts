
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/helpers';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
    const role = await getAdminRole();
    if (role !== 'super' && role !== 'members') {
        return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    try {
        const { memberId } = await params;
        const formData = await req.formData();
        
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });
        if (!member) {
            return NextResponse.json({ error: "Member not found." }, { status: 404 });
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
                dataToUpdate[field] = formData.get(field);
            }
        });
        
        const photoFile = formData.get('photo') as File | null;
        const nidFile = formData.get('nidCopy') as File | null;
        const bankFile = formData.get('bankStatement') as File | null;

        if (photoFile && photoFile.size > 0) {
            await deleteFromCloudinary(member.photoPublicId!);
            const { secure_url, public_id } = await uploadToCloudinary(photoFile);
            dataToUpdate.photoUrl = secure_url;
            dataToUpdate.photoPublicId = public_id;
        }
        if (nidFile && nidFile.size > 0) {
            await deleteFromCloudinary(member.nidCopyPublicId!);
            const { secure_url, public_id } = await uploadToCloudinary(nidFile);
            dataToUpdate.nidCopyUrl = secure_url;
            dataToUpdate.nidCopyPublicId = public_id;
        }
        if (bankFile && bankFile.size > 0) {
            await deleteFromCloudinary(member.bankStatementPublicId!);
            const { secure_url, public_id } = await uploadToCloudinary(bankFile);
            dataToUpdate.bankStatementUrl = secure_url;
            dataToUpdate.bankStatementPublicId = public_id;
        }

        await prisma.member.update({ where: { id: memberId }, data: dataToUpdate });
        
        revalidatePath(`/admin/members/edit/${memberId}`);
        revalidatePath(`/admin/members/${memberId}`);
        revalidatePath('/admin/members');

        return NextResponse.json({ success: true, message: "Member updated successfully." });

    } catch (error: any) {
        console.error("Error updating member:", error);
        return NextResponse.json({ error: error.message || 'Failed to update member.' }, { status: 500 });
    }
}
