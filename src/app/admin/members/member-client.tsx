

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from "@/hooks/use-mobile";
import { useUpdateMemberStatus, useDeleteMember, useMembersList } from '@/hooks/use-members';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, UserCheck, UserX, Trash2, Loader2, Eye, Flag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Member, MemberStatus } from '@/types';

const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500/80 hover:bg-green-500">Approved</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500">Pending</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'Flagged':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Flagged</Badge>;
      case 'AwaitingRegistration':
        return <Badge variant="outline">Awaiting Submission</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
};

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
                    <Button variant="destructive" onClick={() => onReject(reason)}>Confirm Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const MemberRow = ({ member }: { member: Member }) => {
    const router = useRouter();
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const updateStatusMutation = useUpdateMemberStatus();
    const deleteMemberMutation = useDeleteMember();

    const handleUpdateStatus = (id: string, status: MemberStatus, reason?: string) => {
      updateStatusMutation.mutate({ memberId: id, status, reason });
    };

    const handleRejectConfirm = (reason: string) => {
        handleUpdateStatus(member.id, 'Rejected', reason);
        setShowRejectionDialog(false);
    }
  
    const deleteMember = (id: string) => {
        deleteMemberMutation.mutate(id);
    };

    const joinDate = member.joiningDate ? new Date(member.joiningDate) : null;
    const isPending = updateStatusMutation.isPending || deleteMemberMutation.isPending;

    return (
        <>
            <TableRow>
                <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar>
                    <AvatarImage src={member.photoUrl || undefined} alt={member.fullNameEn || ''} />
                    <AvatarFallback>{member.fullNameEn?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.fullNameEn}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                </div>
                </TableCell>
                <TableCell>{member.id}</TableCell>
                <TableCell>{getStatusBadge(member.status as MemberStatus)}</TableCell>
                <TableCell>{joinDate ? joinDate.toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-right">
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" /> 
                ) : (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/members/${member.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />

                        {member.status !== 'Approved' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(member.id, 'Approved')}>
                                <UserCheck className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                        )}
                        {member.status !== 'Rejected' && (
                             <DropdownMenuItem onClick={() => setShowRejectionDialog(true)}>
                                <UserX className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                        )}
                         {member.status !== 'Flagged' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(member.id, 'Flagged')}>
                                <Flag className="mr-2 h-4 w-4" /> Flag
                            </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-100 focus:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the member&apos;s account and remove their data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMember(member.id)} className="bg-red-600 hover:bg-red-700">
                                        Yes, delete member
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                )}
                </TableCell>
            </TableRow>
            <RejectionDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog} onReject={handleRejectConfirm} />
        </>
    )
}

const MembersTable = ({ members }: { members: Member[] }) => {
    if (members.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No members found for this status.</p>
    }
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </TableBody>
        </Table>
    );
};

export function MemberClient({ defaultTab }: { defaultTab: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [currentStatus, setCurrentStatus] = useState<MemberStatus | undefined>(defaultTab as MemberStatus);

  const { data: allMembers, isLoading } = useMembersList();
  
  const statusCounts = (allMembers || []).reduce((acc, member) => {
    const status = member.status;
    acc[status as MemberStatus] = (acc[status as MemberStatus] || 0) + 1;
    return acc;
  }, {} as Record<MemberStatus, number>);
  
  const tabs = [
      { value: 'Pending', label: `Pending (${statusCounts.Pending || 0})` },
      { value: 'Approved', label: `Approved (${statusCounts.Approved || 0})` },
      { value: 'Rejected', label: `Rejected (${statusCounts.Rejected || 0})` },
      { value: 'Flagged', label: `Flagged (${statusCounts.Flagged || 0})` },
      { value: 'AwaitingRegistration', label: `Awaiting Submission (${statusCounts.AwaitingRegistration || 0})` },
  ];

  const handleFilterChange = (value: string) => {
    setCurrentStatus(value as MemberStatus);
    const newUrl = `/admin/members?status=${value.toLowerCase()}`;
    router.push(newUrl, { scroll: false });
  };
  
  const filteredMembers = allMembers?.filter(m => m.status.toLowerCase() === (currentStatus || 'pending').toLowerCase()) || [];

  const FilterControl = () => {
    if (isMobile) {
      return (
        <div className="space-y-2 mb-4">
            <Label htmlFor="status-filter">Filter by status</Label>
            <Select defaultValue={currentStatus} onValueChange={handleFilterChange}>
                <SelectTrigger id="status-filter">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {tabs.map(tab => (
                        <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )
    }
    return (
        <Tabs defaultValue={currentStatus} onValueChange={handleFilterChange}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
  };

  return (
    <>
      <FilterControl />
      <div className="mt-4">
        {isLoading ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> : <MembersTable members={filteredMembers} />}
      </div>
    </>
  )
}
