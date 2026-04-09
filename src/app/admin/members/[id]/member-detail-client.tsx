

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Flag, Search, User, FileText, Heart, Phone, Mail, GraduationCap, Briefcase, MapPin, Landmark, UserCheck, AlertTriangle, Loader2, UserX, Image as ImageIcon, Edit, PlusCircle, PiggyBank, HandCoins, Users2, Trash2, Repeat } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loan, Member, MemberStatus, Share, Settings, ShareStatus } from '@/models';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUpdateMemberStatus, useAdminAddShare, useAdminUpdateShare, useAdminDeleteShare, useAdminTransferShare } from '@/hooks/use-members';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getValidImageSrc } from '@/lib/utils';
import { MemberDetailsData } from './types';


const RejectionDialog = ({ open, onOpenChange, onReject }: { open: boolean, onOpenChange: (open: boolean) => void, onReject: (reason: string) => void }) => {
    const [reason, setReason] = useState('');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Member Application</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting this application. The member will see this message.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rejection-reason" className="text-right">
                            Reason
                        </Label>
                        <Textarea
                            id="rejection-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Missing information, invalid NID..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => onReject(reason)} disabled={!reason}>Confirm Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ShareDialog = ({ memberId, share, children }: { memberId: string, share?: Share, children: React.ReactNode }) => {
    const addShareMutation = useAdminAddShare();
    const updateShareMutation = useAdminUpdateShare();
    const isPending = addShareMutation.isPending || updateShareMutation.isPending;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (share?.id) {
            updateShareMutation.mutate({ shareId: share.id, formData });
        } else {
            addShareMutation.mutate({ memberId, formData });
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{share ? "Edit Extra Member" : "Add Extra Member"}</DialogTitle>
                    <DialogDescription>
                        {share ? "Update the details for this extra member." : "Create a new extra member entry for this primary member."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <fieldset disabled={isPending} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sharerName">Member&apos;s Name</Label>
                            <Input id="sharerName" name="sharerName" placeholder="Enter member's full name" defaultValue={share?.sharerName} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sharerNid">Member&apos;s NID</Label>
                            <Input id="sharerNid" name="sharerNid" placeholder="Enter NID number" defaultValue={share?.sharerNid} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sharerPhone">Member&apos;s Phone</Label>
                            <Input id="sharerPhone" name="sharerPhone" placeholder="Enter phone number" defaultValue={share?.sharerPhone} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sharerAddress">Member&apos;s Address</Label>
                            <Textarea id="sharerAddress" name="sharerAddress" placeholder="Enter full address" defaultValue={share?.sharerAddress} required />
                        </div>
                    </fieldset>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button id={`close-share-dialog-${share?.id || 'new'}`} type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {share ? "Save Changes" : "Add Member"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const TransferShareDialog = ({ share, allMembers, settings }: { share: Share, allMembers: Member[], settings: Settings }) => {
    const adminTransferShareMutation = useAdminTransferShare();
    const [toMemberId, setToMemberId] = useState('');

    const handleTransfer = () => {
        adminTransferShareMutation.mutate({ shareId: share.id, toMemberId });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200" disabled={share.status !== 'Active' && share.status !== 'ForTransfer'}>
                    <Repeat className="mr-2 h-4 w-4"/> Transfer
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer Share</DialogTitle>
                    <DialogDescription>Transfer {share.sharerName}&apos;s share to another active member.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="toMemberId">Select New Owner</Label>
                    <Select onValueChange={setToMemberId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a member..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allMembers.filter(m => m.id !== share.memberId && m.status === 'Approved').map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.fullNameEn} ({m.id})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleTransfer} disabled={adminTransferShareMutation.isPending || !toMemberId}>
                        {adminTransferShareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


const StatCard = ({ title, value, currency = true, className }: { title: string, value: number, currency?: boolean, className?: string }) => (
    <div className={cn("p-4 border rounded-lg text-center", className)}>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{currency && '৳'}{value.toLocaleString()}</p>
    </div>
);

const InfoRow = ({ label, value, icon }: { label: string, value: string | undefined | null, icon?: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row items-start py-3">
        <div className="flex items-center w-full md:w-56 text-muted-foreground mb-1 md:mb-0">
            {icon && <span className="mr-2 min-w-4">{icon}</span>}
            <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex-1 font-semibold text-base md:text-sm break-words">{value || 'N/A'}</div>
    </div>
);

export function MemberDetailClient({ memberData: initialMemberData, allMembers }: { memberData: MemberDetailsData, allMembers: Member[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const updateStatusMutation = useUpdateMemberStatus();
  const deleteShareMutation = useAdminDeleteShare();

  const handleVerification = (status: MemberStatus, reason?: string) => {
    updateStatusMutation.mutate({ memberId: initialMemberData.details.id, status, reason });
  };
  
  const handleRejectConfirm = (reason: string) => {
      handleVerification('Rejected', reason);
      setShowRejectionDialog(false);
  }

  const handleDeleteShare = (shareId: string) => {
    deleteShareMutation.mutate(shareId);
  }

  const filteredTransactions = initialMemberData.transactions.filter(tx => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = tx.id.toLowerCase().includes(term) || tx.type.toLowerCase().includes(term);
    const matchesDate = filterDate ? new Date(tx.date).toISOString().startsWith(filterDate) : true;
    return matchesTerm && matchesDate;
  });

  const getLoanStatusBadge = (status: Loan['loanStatus']) => {
    switch (status) {
      case 'Active':
        return <Badge variant="secondary" className="bg-blue-500/80 text-white">Active</Badge>;
      case 'Repaid':
        return <Badge variant="default" className="bg-gray-500/80">Repaid</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };
  
  const getStatusBadge = (status?: MemberStatus) => {
    if (!status) return null;
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500/80 hover:bg-green-500">Approved</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500">Pending</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'Flagged':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Flagged</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const isApprovedMember = initialMemberData.details.status === 'Approved';
  const isLoanSystemEnabled = initialMemberData.settings.loanSystemEnabled;
  const canAddShare = (initialMemberData.details.shares || []).filter(s => s.status === 'Active').length < initialMemberData.settings.maxSharesPerMember;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
           <Button asChild variant="outline" className="mb-4">
              <Link href="/admin/members">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members List
              </Link>
            </Button>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border">
                    <AvatarImage src={getValidImageSrc(initialMemberData.details.photoUrl)} alt={initialMemberData.details.fullNameEn || ''} />
                    <AvatarFallback>{initialMemberData.details.fullNameEn?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold font-headline">{initialMemberData.details.fullNameEn}</h1>
                    <p className="text-muted-foreground">{initialMemberData.details.id} | {initialMemberData.details.email}</p>
                    {getStatusBadge(initialMemberData.details.status as MemberStatus)}
                </div>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 self-start pt-2">
            <Button asChild variant="outline">
                <Link href={`/admin/members/edit/${initialMemberData.details.id}`}>
                    <Edit className="mr-2 h-4 w-4"/> Edit Member
                </Link>
            </Button>
            {initialMemberData.details.status === 'Pending' && (
                <>
                    <Button variant="outline" className="bg-green-100 dark:bg-green-900/50 hover:bg-green-200" onClick={() => handleVerification('Approved')} disabled={updateStatusMutation.isPending}>
                        {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />} Approve Member
                    </Button>
                    <Button variant="outline" className="bg-red-100 dark:bg-red-900/50 hover:bg-red-200" onClick={() => setShowRejectionDialog(true)} disabled={updateStatusMutation.isPending}>
                        {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserX className="mr-2 h-4 w-4" />} Reject
                    </Button>
                </>
            )}
             {initialMemberData.details.status !== 'Pending' && (
                <Button variant="outline" className="bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200" onClick={() => handleVerification('Flagged')} disabled={initialMemberData.details.status === 'Flagged' || updateStatusMutation.isPending}>
                    {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Flag className="mr-2 h-4 w-4" />} Flag for Review
                </Button>
            )}
        </div>
      </div>

       {initialMemberData.details.status === 'Pending' && (
        <Alert variant="default" className="bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-500/50">
            <UserCheck className="h-4 w-4 !text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">New Member Application</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                This member is awaiting approval. Review their details below and choose an action.
            </AlertDescription>
        </Alert>
       )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>Financial Summary</CardTitle>
                    <CardDescription>A summary of the member&apos;s financial status.</CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button asChild variant="outline" className="w-full sm:w-auto" disabled={!isApprovedMember}>
                        <Link href={`/admin/members/${initialMemberData.details.id}/make-payment`}>
                            <HandCoins className="mr-2 h-4 w-4"/> Make Payment
                        </Link>
                    </Button>
                    <Button asChild className="w-full sm:w-auto" disabled={!isLoanSystemEnabled || !isApprovedMember}>
                         <Link href={`/admin/members/${initialMemberData.details.id}/assign-loan`}>
                            <PiggyBank className="mr-2 h-4 w-4"/> Assign Loan
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="Total Savings" value={initialMemberData.financials.totalSavings} />
                <StatCard title="Active Loan Amount" value={initialMemberData.financials.activeLoan} />
                <StatCard title="Other Payments" value={initialMemberData.financials.otherPayments} />
                <StatCard title="Past Dues" value={initialMemberData.financials.totalDue} className="bg-red-100/50 dark:bg-red-900/20" />
                <StatCard title="Advance Balance" value={initialMemberData.financials.advanceBalance} className="bg-green-100/50 dark:bg-green-900/20" />
            </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All recorded transactions for this member.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 space-y-2">
                    <Label htmlFor='search-tx'>Search TxID or Type</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="search-tx" placeholder="e.g., txn-01 or savings" className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                     <Label htmlFor='filter-date'>Filter by Date</Label>
                    <Input id="filter-date" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <div className="capitalize">{tx.type.replace('_', ' ')}</div>
                        {tx.reason && <div className="text-xs text-muted-foreground">{tx.reason}</div>}
                    </TableCell>
                    <TableCell className={tx.amount < 0 ? 'text-destructive' : ''}>৳{tx.amount.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={tx.status === 'Completed' ? 'default' : 'secondary'} className={tx.status === 'Completed' ? 'bg-green-500/80' : ''}>
                            {tx.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Loan History</CardTitle>
            <CardDescription>All loan applications from this member.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialMemberData.loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{new Date(loan.applicationDate).toLocaleDateString()}</TableCell>
                    <TableCell>৳{loan.amount.toLocaleString()}</TableCell>
                    <TableCell>
                        {getLoanStatusBadge(loan.loanStatus)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><Users2 /> Member&apos;s Extra Members</CardTitle>
              <CardDescription>A list of all extra members held by this primary member.</CardDescription>
            </div>
            <ShareDialog memberId={initialMemberData.details.id}>
                <Button variant="outline" disabled={!canAddShare || !isApprovedMember}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Extra Member
                </Button>
            </ShareDialog>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>NID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Acquired</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(initialMemberData.details.shares || []).map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>{share.sharerName}</TableCell>
                    <TableCell>{share.sharerNid}</TableCell>
                    <TableCell><Badge variant={share.status === 'Active' ? 'default' : 'secondary'} className={share.status === 'Active' ? 'bg-green-500/80' : ''}>{share.status}</Badge></TableCell>
                    <TableCell>{new Date(share.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <TransferShareDialog share={share} allMembers={allMembers} settings={initialMemberData.settings} />
                            <ShareDialog memberId={initialMemberData.details.id} share={share}>
                                <Button variant="ghost" size="icon" disabled={share.status !== 'Active'}><Edit className="h-4 w-4" /></Button>
                            </ShareDialog>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={share.status !== 'Active'}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently remove this extra member and credit its value to the member&apos;s advance balance. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteShare(share.id)} className="bg-destructive hover:bg-destructive/90">
                                            Yes, remove
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {!canAddShare && (
                <p className="text-sm text-center text-yellow-600 bg-yellow-100/50 p-2 rounded-md mt-4">
                    This member has reached the maximum of {initialMemberData.settings.maxSharesPerMember} additional members.
                </p>
             )}
          </CardContent>
        </Card>

       <Card>
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
            <CardDescription>Full profile information submitted during registration.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><User className="mr-2 text-primary" />Personal Information</h3>
                    <InfoRow label="Full Name (Bangla)" value={initialMemberData.details.fullNameBn} />
                    <InfoRow label="Full Name (English)" value={initialMemberData.details.fullNameEn} />
                    <InfoRow label="Father's Name" value={initialMemberData.details.fatherName} />
                    <InfoRow label="Mother's Name" value={initialMemberData.details.motherName} />
                    <InfoRow label="NID/Birth Certificate" value={initialMemberData.details.nid} icon={<FileText className="w-4 h-4"/>} />
                    <InfoRow label="Date of Birth" value={new Date(initialMemberData.details.dob!).toLocaleDateString()} />
                    <InfoRow label="Blood Group" value={initialMemberData.details.bloodGroup} icon={<Heart className="w-4 h-4"/>} />
                    <InfoRow label="Marital Status" value={initialMemberData.details.maritalStatus} />
                    <InfoRow label="Religion" value={initialMemberData.details.religion} />
                    <InfoRow label="Member ID" value={initialMemberData.details.id} />
                    <InfoRow label="Joining Date" value={initialMemberData.details.joiningDate ? new Date(initialMemberData.details.joiningDate).toLocaleDateString() : 'N/A'} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><MapPin className="mr-2 text-primary" />Address</h3>
                    <InfoRow label="Current Address" value={initialMemberData.details.currentAddress} />
                    <InfoRow label="Permanent Address" value={initialMemberData.details.permanentAddress} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><Phone className="mr-2 text-primary" />Contact & Education</h3>
                    <InfoRow label="Mobile (Primary)" value={initialMemberData.details.mobilePrimary} />
                    <InfoRow label="Mobile (Alternate)" value={initialMemberData.details.mobileAlternate} />
                    <InfoRow label="Email" value={initialMemberData.details.email} icon={<Mail className="w-4 h-4"/>} />
                    <InfoRow label="SSC Batch" value={initialMemberData.details.sscBatch} icon={<GraduationCap className="w-4 h-4"/>} />
                    <InfoRow label="Other Qualifications" value={initialMemberData.details.otherEducation} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-xl font-semibold mb-2 flex items-center"><Briefcase className="mr-2 text-primary" />Professional Information</h3>
                    <InfoRow label="Profession" value={initialMemberData.details.profession} />
                    <InfoRow label="Workplace" value={initialMemberData.details.workplace} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-xl font-semibold mb-2 flex items-center"><Landmark className="mr-2 text-primary" />Bank Information</h3>
                    <InfoRow label="Bank Name" value={initialMemberData.details.bankName} />
                    <InfoRow label="Branch" value={initialMemberData.details.branch} />
                    <InfoRow label="Account Number" value={initialMemberData.details.accountNumber} />
                    <InfoRow label="Account Type" value={initialMemberData.details.accountType} />
                    <InfoRow label="Banking Method" value={initialMemberData.details.bankingMethod} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-xl font-semibold mb-2 flex items-center"><UserCheck className="mr-2 text-primary" />Nominee Information</h3>
                    <InfoRow label="Nominee's Name" value={initialMemberData.details.nomineeName} />
                    <InfoRow label="Relation" value={initialMemberData.details.nomineeRelation} />
                    <InfoRow label="Mobile Number" value={initialMemberData.details.nomineeMobile} />
                    <InfoRow label="Address" value={initialMemberData.details.nomineeAddress} />
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg font-semibold flex items-center">
              <ImageIcon className="mr-2 text-primary" />
              Attachments
            </CardTitle>
            <CardDescription>
              Documents submitted by the member.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 pt-2">
            <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">NID/Birth Certificate Copy</h4>
                <Image 
                    src={getValidImageSrc(initialMemberData.details.nidCopyUrl)}
                    alt="NID/Birth Certificate" 
                    width={600} 
                    height={400} 
                    className="rounded-lg object-contain w-full border"
                    data-ai-hint="document certificate"
                />
            </div>
            <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Bank Account Statement</h4>
                <Image 
                    src={getValidImageSrc(initialMemberData.details.bankStatementUrl)}
                    alt="Bank Statement" 
                    width={600} 
                    height={400} 
                    className="rounded-lg object-contain w-full border"
                    data-ai-hint="document bank statement"
                />
            </div>
          </CardContent>
        </Card>
      <RejectionDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog} onReject={handleRejectConfirm} />
    </div>
  );
}
