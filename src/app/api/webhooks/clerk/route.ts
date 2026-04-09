
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: Request) {

  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;
    
    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
        where: { clerkId: id }
    });
    
    if (existingMember) {
        console.log(`Member with clerkId ${id} already exists. Skipping creation.`);
        return NextResponse.json({ status: 'ok', message: 'User already exists' });
    }
    
    try {
        // Automatically assign super admin role if the email matches the env variable
        if (primaryEmail && primaryEmail === process.env.SUPER_ADMIN_EMAIL) {
            const client = await clerkClient();
            await client.users.updateUser(id, {
                publicMetadata: { role: 'super' }
            });
        }

        await prisma.member.create({
          data: {
            clerkId: id,
            email: primaryEmail,
            fullNameEn: `${first_name || ''} ${last_name || ''}`.trim() || primaryEmail || 'New Member',
            photoUrl: image_url,
            status: 'AwaitingRegistration',
          }
        });
    } catch (error) {
      console.error("Error creating member from webhook:", error);
      return new Response(`Error creating member`, { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkId, deleted } = evt.data;
    if (deleted && clerkId) {
        try {
            await prisma.member.delete({ where: { clerkId: clerkId } });
        } catch (error) {
            console.error(`Webhook: Failed to delete member with Clerk ID ${clerkId}`, error);
            // Don't return an error to Clerk, as it might retry.
            // The user is deleted in Clerk, so we just log the failure to delete from our DB.
        }
    }
  }

  return new Response('', { status: 200 })
}
