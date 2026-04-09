
'use server';

import { sendEmail } from "./email";
import { getAdmins } from "@/services/prisma/queries/admin";

export async function notifyAdmins(
    subject: string,
    html: string,
    relevantRoles: Array<string>
) {
    const allAdmins = await getAdmins();
    const emailsToSend = new Set<string>();

    const superAdmin = allAdmins.find(admin => admin.role === 'super');
    if (superAdmin) {
        emailsToSend.add(superAdmin.email);
    } else {
        const fallbackEmail = process.env.SUPER_ADMIN_EMAIL;
        if (fallbackEmail) {
            emailsToSend.add(fallbackEmail);
            console.warn("No super admin found. Falling back to SUPER_ADMIN_EMAIL env var for notification.");
        } else {
            console.error("CRITICAL: No super admin found and SUPER_ADMIN_EMAIL is not set. No notifications can be sent.");
            return;
        }
    }
    
    const relevantAdmins = allAdmins.filter(admin => 
        relevantRoles.includes(admin.role)
    );
    
    relevantAdmins.forEach(admin => emailsToSend.add(admin.email));

    for (const email of emailsToSend) {
        await sendEmail({ to: email, subject, html });
    }
}
