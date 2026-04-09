

'use server';

import prisma from '@/lib/prisma';
import { getAdminRole } from '@/lib/auth';
import JSZip from 'jszip';

async function verifySuperAdmin() {
    const adminRole = await getAdminRole();
    if (adminRole !== 'super') {
        throw new Error("Not authorized for this action.");
    }
}

export async function exportData(): Promise<Buffer> {
    await verifySuperAdmin();
    const zip = new JSZip();
    
    const tables = [
        'Settings', 'Event', 'PaymentAccount', 'Member', 'Post', 'Share', 
        'Loan', 'Guarantor', 'Transaction', 'Message', 'ProfileUpdate', 'ShareTransfer',
        'ApprovedPayment', 'MonthlyPayment', 'LoanInstallment', 'EventPayment'
    ];

    for (const table of tables) {
        const model = (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)];
        const data = await model.findMany();
        zip.file(`${table}.json`, JSON.stringify(data, null, 2));
    }
    
    return await zip.generateAsync({ type: "nodebuffer" });
}

function parseDates(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
        return obj.map(parseDates);
    }
    if (typeof obj === 'object') {
        for (const key in obj) {
            if (typeof obj[key] === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z?/.test(obj[key])) {
                const date = new Date(obj[key]);
                if (!isNaN(date.getTime())) {
                    obj[key] = date;
                }
            } else if (typeof obj[key] === 'object') {
                parseDates(obj[key]); // Recurse
            }
        }
    }
    return obj;
}


export async function importData(importedData: Record<string, any[]>) {
    await verifySuperAdmin();
    
    const importOrder = [
        'Settings', 'Event', 'PaymentAccount', 'Member', 'Post', 'Share', 
        'Loan', 'Guarantor', 'Transaction', 'Message', 'ProfileUpdate', 'ShareTransfer',
        'ApprovedPayment', 'MonthlyPayment', 'LoanInstallment', 'EventPayment'
    ];

    await prisma.$transaction(async (tx) => {
        // Delete in reverse order to respect foreign key constraints
        for (const table of importOrder.slice().reverse()) {
             const model = (tx as any)[table.charAt(0).toLowerCase() + table.slice(1)];
             await model.deleteMany({});
        }
        
        // Create in the specified order
        for (const table of importOrder) {
            const model = (tx as any)[table.charAt(0).toLowerCase() + table.slice(1)];
            if (importedData[table] && importedData[table].length > 0) {
                const dataWithDates = parseDates(importedData[table]);
                await model.createMany({ data: dataWithDates });
            }
        }
    }, {
        maxWait: 30000, // 30 seconds
        timeout: 60000, // 60 seconds
    });

    return { message: 'Import successful' };
}
