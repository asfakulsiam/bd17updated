
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MoreVertical, Eye, Landmark, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoanWithDetails, LoanApplicationStatus, LoanStatus } from '@/types';
import { useUpdateLoanStatus, useMarkLoanAsRepaid, useLoanApplications } from '@/hooks/use-loans';


const InfoRow = ({ label, value }: { label: string, value: string | number | null | undefined}) => (
    <div className="flex justify-between py-1">
        <span className="text-muted-foreground">{label}:</span> 
        <span className="text-right font-medium">{value || 'N/A'}</span>
    </div>
);


const LoanDetailsDialog = ({ loan }: { loan: LoanWithDetails }) => (
    <DialogContent className="max-w-lg">
        <DialogHeader>
            <DialogTitle>Loan Application Details</DialogTitle>
            <DialogDescription>
                Application ID: {loan.id}
            </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
             <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/50">
                    <h3 className="font-semibold mb-2">Applicant Info</h3>
                    <InfoRow label="Name" value={loan.member.fullNameEn} />
                    <InfoRow label="Member ID" value={loan.memberId} />
                </div>
                <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Loan Details</h3>
                    <InfoRow label="Amount" value={`৳${loan.amount.toLocaleString()}`} />
                    <InfoRow label="Application Date" value={new Date(loan.applicationDate).toLocaleDateString()} />
                    <InfoRow label="Repayment Period" value={`${loan.repaymentPeriod} months`} />
                    <InfoRow label="Application Status" value={loan.applicationStatus} />
                    <InfoRow label="Loan Status" value={loan.loanStatus} />

                    <div>
                        <h4 className="font-medium mt-2">Reason for Loan:</h4>
                        <p className="text-muted-foreground p-2 bg-background rounded-md">{loan.reason}</p>
                    </div>
                </div>
             </div>
            <div className="space-y-4">
                 {loan.guarantor && (
                    <div className="p-4 rounded-lg border">
                        <h3 className="font-semibold mb-2">Guarantor Info</h3>
                        <InfoRow label="Name" value={loan.guarantor.name} />
                        <InfoRow label="Phone" value={loan.guarantor.phone} />
                        <InfoRow label="NID" value={loan.guarantor.nidNumber} />
                        <div className="pt-2">
                             <h4 className="font-medium mt-2">Address:</h4>
                            <p className="text-muted-foreground p-2 bg-background rounded-md">{loan.guarantor.address}</p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    </DialogContent>
);

const LoanRow = ({ loan }: { loan: LoanWithDetails }) => {
    const updateLoanStatusMutation = useUpdateLoanStatus();
    const markLoanAsRepaidMutation = useMarkLoanAsRepaid();

    const handleUpdateStatus = (id: string, newStatus: LoanApplicationStatus) => {
        updateLoanStatusMutation.mutate({ loanId: id, status: newStatus });
    };

    const handleMarkAsRepaid = (id: string) => {
        markLoanAsRepaidMutation.mutate(id);
    };

      const getStatusBadge = (status: LoanApplicationStatus) => {
        switch (status) {
          case 'Pending':
            return <Badge variant="secondary" className="bg-yellow-500/80">Pending</Badge>;
          case 'Approved':
            return <Badge variant="default" className="bg-green-500/80">Approved</Badge>;
          case 'Rejected':
            return <Badge variant="destructive">Rejected</Badge>;
          default:
            return <Badge>{status}</Badge>;
        }
      };
      
      const getLoanStatusBadge = (status: LoanStatus) => {
        switch (status) {
          case 'Active':
            return <Badge variant="secondary" className="bg-blue-500/80 text-white">Active</Badge>;
          case 'Repaid':
            return <Badge variant="default" className="bg-gray-500/80">Repaid</Badge>;
          default:
            return <Badge variant="outline">N/A</Badge>;
        }
      };

    const isPending = updateLoanStatusMutation.isPending || markLoanAsRepaidMutation.isPending;

    return (
         <Dialog>
            <TableRow>
                <TableCell>
                <div className="font-medium">{loan.member.fullNameEn}</div>
                <div className="text-sm text-muted-foreground">{loan.memberId}</div>
                </TableCell>
                <TableCell>৳{loan.amount.toLocaleString()}</TableCell>
                <TableCell>{new Date(loan.applicationDate).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(loan.applicationStatus as LoanApplicationStatus)}</TableCell>
                <TableCell>{getLoanStatusBadge(loan.loanStatus as LoanStatus)}</TableCell>
                <TableCell className="text-right">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                    <div className="flex gap-2 justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DialogTrigger asChild>
                                    <DropdownMenuItem>
                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem 
                                    disabled={loan.applicationStatus !== 'Pending'}
                                    onClick={() => handleUpdateStatus(loan.id, 'Approved')}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                 <DropdownMenuItem 
                                    disabled={loan.applicationStatus !== 'Pending'}
                                    onClick={() => handleUpdateStatus(loan.id, 'Rejected')}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={loan.loanStatus !== 'Active'} onClick={() => handleMarkAsRepaid(loan.id)}>
                                    <Landmark className="mr-2 h-4 w-4" /> Mark as Repaid
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                </TableCell>
            </TableRow>
            <LoanDetailsDialog loan={loan} />
        </Dialog>
    )
}

export function LoanClient() {
  const { data: loans, isLoading, isError } = useLoanApplications();

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }
  if (isError || !loans) {
    return <div className="text-center p-8 text-destructive">Could not load loan applications.</div>;
  }
  if (loans.length === 0) {
    return <div className="text-center p-8">No loan applications found.</div>;
  }

  return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>App. Status</TableHead>
              <TableHead>Loan Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
                <LoanRow key={loan.id} loan={loan} />
            ))}
          </TableBody>
        </Table>
  );
}
