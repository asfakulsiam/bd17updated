
import { getMemberDetails, getMembersList } from '@/services/prisma/queries/members';
import { MemberDetailClient } from './member-detail-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let memberData;
  let allMembers;
  let error = null;

  try {
    [memberData, allMembers] = await Promise.all([
      getMemberDetails(id),
      getMembersList()
    ]);
    if (!memberData) {
        throw new Error("A member with this ID could not be found.");
    }
  } catch (e) {
    error = (e as Error).message;
    console.error(e);
  }

  if (error || !memberData) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
        <Alert variant="destructive" className='max-w-lg'>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Member</AlertTitle>
          <AlertDescription>{error || 'The requested member data could not be loaded.'}</AlertDescription>
        </Alert>
        <Button asChild variant="link" className='mt-4'>
          <Link href="/admin/members">Back to members list</Link>
        </Button>
      </div>
    );
  }

  return (
    <MemberDetailClient memberData={memberData} allMembers={allMembers} />
  );
}
