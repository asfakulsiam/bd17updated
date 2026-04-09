'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ArrowLeft, Loader2, Repeat, AlertTriangle, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import type { Share, ShareStatus } from '@/models';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateShare, useUpdateShare, useUpdateShareStatus } from '@/hooks/use-shares';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUserDetails } from '@/hooks/use-members';
import { useSession } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription as ShadcnAlertDescription, AlertTitle } from '@/components/ui/alert';


const pageText = {
  bn: {
    title: 'আমার অতিরিক্ত সদস্য',
    description: 'আপনার সকল অতিরিক্ত সদস্যদের দেখুন এবং ব্যবস্থাপনা করুন।',
    backToAccount: 'অ্যাকাউন্টে ফিরে যান',
    createMember: 'নতুন অতিরিক্ত সদস্য যোগ করুন',
    memberName: 'সদস্যের নাম',
    nid: 'NID নম্বর',
    phone: 'ফোন নম্বর',
    address: 'ঠিকানা',
    actions: 'কার্যকলাপ',
    edit: 'সম্পাদনা',
    delete: 'অপসারণ',
    noMembers: 'আপনার কোনো অতিরিক্ত সদস্য নেই।',
    loading: 'লোড হচ্ছে...',
    confirmDeleteTitle: 'আপনি কি নিশ্চিত?',
    confirmDeleteDesc: 'এই সদস্যকে অপসারণ করা হবে। এই শেয়ারের জন্য করা অতীতের সমস্ত অর্থপ্রদান আপনার ভবিষ্যতের মাসিক কিস্তির জন্য অগ্রিম হিসাবে জমা করা হবে।',
    confirmTransfer: 'আপনি কি এই সদস্যকে স্থানান্তরের জন্য অনুরোধ করতে চান?',
    confirmTransferDesc: 'এই অনুরোধটি অ্যাডমিনের কাছে অনুমোদনের জন্য যাবে। অনুমোদিত হলে, এই সদস্যকে অন্য সদস্যের কাছে স্থানান্তর করা যেতে পারে।',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ করুন',
    add: 'যোগ করুন',
    editMember: 'সদস্যের তথ্য সম্পাদনা করুন',
    newMember: 'নতুন অতিরিক্ত সদস্য',
    maxMembersReached: 'আপনি সর্বোচ্চ সংখ্যক অতিরিক্ত সদস্য নিয়েছেন।',
    status: 'অবস্থা',
    active: 'সক্রিয়',
    removed: 'অপসারিত',
    forTransfer: 'স্থানান্তরের জন্য অনুরোধ করা হয়েছে',
    removeShare: 'সদস্য অপসারণ',
    transferShare: 'সদস্য স্থানান্তর',
    chooseAction: "অপসারণের পদ্ধতি নির্বাচন করুন",
    convertToAdvance: "অ্যাডভান্সে রূপান্তর করুন",
    convertToAdvanceDesc: "অতীতের পেমেন্টগুলি ভবিষ্যতের জন্য অগ্রিম হিসাবে জমা হবে।",
    requestTransfer: "স্থানান্তরের জন্য অনুরোধ",
    requestTransferDesc: "অ্যাডমিন এই সদস্যকে অন্য কারো কাছে স্থানান্তর করতে পারবেন।",
    mustBeRegistered: "You must be a registered member to manage extra members.",
    completeRegistration: "Complete Registration",
    errorLoading: "প্রয়োজনীয় ডেটা লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
  },
  en: {
    title: 'My Extra Members',
    description: 'View and manage all your extra members.',
    backToAccount: 'Back to Account',
    createMember: 'Add New Extra Member',
    memberName: "Member's Name",
    nid: 'NID Number',
    phone: 'Phone Number',
    address: 'Address',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Remove',
    noMembers: 'You have no additional members.',
    loading: 'Loading...',
    confirmDeleteTitle: 'Are you sure?',
    confirmDeleteDesc: 'This member will be removed. All past payments made for this share will be credited as an advance for your future monthly installments.',
    confirmTransfer: 'Request transfer for this member?',
    confirmTransferDesc: 'This request will go to an admin for approval. Once approved, this share can be transferred to another member.',
    cancel: 'Cancel',
    save: 'Save Changes',
    add: 'Add Member',
    editMember: 'Edit Member',
    newMember: 'New Extra Member',
    maxMembersReached: 'You have reached the maximum number of extra members.',
    status: 'Status',
    active: 'Active',
    removed: 'Removed',
    forTransfer: 'Pending Transfer',
    removeShare: 'Remove Member',
    transferShare: 'Transfer Member',
    chooseAction: 'Choose Removal Method',
    convertToAdvance: 'Convert to Advance',
    convertToAdvanceDesc: 'Past payments will be credited as future advance.',
    requestTransfer: 'Request Transfer',
    requestTransferDesc: 'Admin can transfer this share to someone else.',
    mustBeRegistered: "You must be a registered member to manage extra members.",
    completeRegistration: "Complete Registration",
    errorLoading: "Could not load necessary data for this page. Please try again later."
  },
};


const getStatusBadge = (status: ShareStatus, text: typeof pageText['en']) => {
    switch (status) {
        case 'Active':
            return <Badge variant="default" className="bg-green-500/80">{text.active}</Badge>;
        case 'Removed':
            return <Badge variant="secondary">{text.removed}</Badge>;
        case 'ForTransfer':
            return <Badge variant="outline" className="text-blue-600 border-blue-600">{text.forTransfer}</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
}


const RemoveShareDialog = ({ share, text, onRemove, onTransferRequest }: { share: Share, text: any, onRemove: (id: string) => void, onTransferRequest: (id: string) => void }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full" disabled={share.status !== 'Active'}>
                <Trash2 className="mr-2 h-4 w-4" /> {text.delete}
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{text.chooseAction}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
                            <Repeat className="mr-2 h-4 w-4 flex-shrink-0" />
                            <div>
                                <p>{text.convertToAdvance}</p>
                                <p className="text-xs text-muted-foreground">{text.convertToAdvanceDesc}</p>
                            </div>
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{text.confirmDeleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{text.confirmDeleteDesc}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemove(share.id)} className="bg-destructive hover:bg-destructive/90">{text.delete}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
                            <Repeat className="mr-2 h-4 w-4 flex-shrink-0" />
                            <div>
                                <p>{text.requestTransfer}</p>
                                <p className="text-xs text-muted-foreground">{text.requestTransferDesc}</p>
                            </div>
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{text.confirmTransfer}</AlertDialogTitle>
                            <AlertDialogDescription>{text.confirmTransferDesc}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onTransferRequest(share.id)}>{text.requestTransfer}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DialogContent>
    </Dialog>
);


const MemberDialog = ({
  member,
  children,
}: {
  member?: Partial<Share>;
  children: React.ReactNode;
}) => {
  const { language } = useLanguage();
  const text = pageText[language];
  const createShareMutation = useCreateShare();
  const updateShareMutation = useUpdateShare();
  const isPending = createShareMutation.isPending || updateShareMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    if (member?.id) {
        updateShareMutation.mutate({ shareId: member.id, formData });
    } else {
        createShareMutation.mutate(formData);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {member?.id ? text.editMember : text.newMember}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <fieldset disabled={isPending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sharerName">{text.memberName}</Label>
              <Input id="sharerName" name="sharerName" defaultValue={member?.sharerName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sharerNid">{text.nid}</Label>
              <Input id="sharerNid" name="sharerNid" defaultValue={member?.sharerNid} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sharerPhone">{text.phone}</Label>
              <Input id="sharerPhone" name="sharerPhone" defaultValue={member?.sharerPhone} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sharerAddress">{text.address}</Label>
              <Textarea id="sharerAddress" name="sharerAddress" defaultValue={member?.sharerAddress} required />
            </div>
          </fieldset>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" id={`close-dialog-${member?.id || 'new'}`}>
                {text.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member?.id ? text.save : text.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SharesPageSkeleton = () => (
     <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(2)].map((_, i) => (
                   <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                       <div className="space-y-2">
                           <Skeleton className="h-6 w-40" />
                           <Skeleton className="h-4 w-60" />
                       </div>
                       <Skeleton className="h-10 w-24" />
                   </div>
                ))}
            </CardContent>
        </Card>
    </div>
);

export default function MySharesPage() {
  const { user, isLoading: authLoading } = useSession();
  const { data: userDetails, isLoading: memberLoading, isError: memberError } = useUserDetails(user?.id);

  const { language } = useLanguage();
  const text = pageText[language];
  const updateShareStatusMutation = useUpdateShareStatus();

  const handleRemoveShare = (id: string) => {
    updateShareStatusMutation.mutate({ shareId: id, status: 'Removed' });
  };

  const handleRequestTransfer = (id: string) => {
    updateShareStatusMutation.mutate({ shareId: id, status: 'ForTransfer' });
  };

  const isLoading = authLoading || memberLoading;
  
    if (isLoading) {
        return <SharesPageSkeleton />;
    }

    if (memberError) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <ShadcnAlertDescription>{text.errorLoading}</ShadcnAlertDescription>
            </Alert>
        )
    }

    if (!userDetails?.details || userDetails.details.status === 'AwaitingRegistration') {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[50vh]">
                <div className="bg-primary/10 p-6 rounded-full">
                    <UserPlus className="w-16 h-16 text-primary" />
                </div>
                <h1 className="font-headline text-3xl font-bold">{text.mustBeRegistered}</h1>
                <p className="text-muted-foreground max-w-md">
                    To view or add extra members, please complete your registration first.
                </p>
                <Button asChild size="lg">
                    <Link href="/registration">
                    {text.completeRegistration}
                    </Link>
                </Button>
            </div>
        )
    }

  const settings = userDetails.settings;
  const canCreateShare = (userDetails.details.shares || []).filter(s => s.status === 'Active').length < (settings?.maxSharesPerMember ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link href="/account">
              <ArrowLeft className="mr-2 h-4 w-4" /> {text.backToAccount}
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-bold">{text.title}</h1>
          <p className="text-muted-foreground">{text.description}</p>
        </div>
        <MemberDialog>
            <Button disabled={!canCreateShare} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> {text.createMember}
            </Button>
        </MemberDialog>
      </div>
      {!canCreateShare && settings && (
          <p className="text-sm text-center text-yellow-600 bg-yellow-100/50 p-2 rounded-md">{text.maxMembersReached}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userDetails.details.shares && userDetails.details.shares.length > 0 ? (
              userDetails.details.shares.map((share) => (
                <div
                  key={share.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className='flex-1'>
                    <p className="font-bold">{share.sharerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {text.nid}: {share.sharerNid} | {text.phone}: {share.sharerPhone}
                    </p>
                    <p className="text-sm mt-1">
                        {text.status}: {getStatusBadge(share.status, text)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0 w-full sm:w-auto">
                    <MemberDialog member={share}>
                      <Button variant="outline" size="sm" className="w-full" disabled={share.status !== 'Active'}>
                        <Edit className="mr-2 h-4 w-4" /> {text.edit}
                      </Button>
                    </MemberDialog>
                    <RemoveShareDialog share={share} text={text} onRemove={handleRemoveShare} onTransferRequest={handleRequestTransfer} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {text.noMembers}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
