
'use client';

import { useMemo, useState } from 'react';
import { useAllTransactions, usePendingPayments, useApprovePayment, useRejectPayment } from '@/hooks/use-transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, Loader2, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Payment, TransactionStatus, ApprovedPayment } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const pageText = {
  paymentTypes: {
    'MONTHLY_SAVINGS': "Monthly Savings",
    'LOAN_REPAYMENT': "Loan Repayment",
    'OTHER': "Other Payment",
    'LOAN_DISBURSEMENT': "Loan Disbursement"
  }
}

const getStatusBadge = (status: TransactionStatus | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-500/80">Pending</Badge>;
      case 'Completed':
      case 'Approved':
        return <Badge variant="default" className="bg-green-500/80">Completed</Badge>;
      case 'Failed':
      case 'Rejected':
        return <Badge variant="destructive">Failed</Badge>;
    }
};

const TransactionDetailsDialog = ({ transaction, statusBadge }: { transaction: Payment | ApprovedPayment, statusBadge: React.ReactNode }) => {
    const locale = 'en-US';
    
    const getPaymentDescription = () => {
        const typeKey = transaction.type as keyof typeof pageText.paymentTypes;
        const type = pageText.paymentTypes[typeKey];
        
        let details = '';
        if ('reason' in transaction && transaction.reason) {
            details = `(${transaction.reason})`;
        } else if ('paymentForMonth' in transaction && transaction.paymentForMonth) {
             const date = new Date(transaction.paymentForMonth);
             if (!isNaN(date.getTime())) {
                details = `(${date.toLocaleString(locale, { month: 'long', year: 'numeric' })})`;
             }
        }
        return `${type} ${details}`;
    }

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>
                    Full details for transaction ID: {transaction.transactionId}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
                 <div className="p-4 rounded-lg border bg-muted/50">
                    <h3 className="font-semibold mb-2">Member Info</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">Name:</span> <span>{transaction.name}</span>
                        <span className="text-muted-foreground">Member ID:</span> <span>{transaction.memberId}</span>
                        <span className="text-muted-foreground">Phone:</span> <span>{transaction.phone}</span>
                    </div>
                </div>
                 <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Payment Info</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">Amount:</span> <span className="font-bold">৳{transaction.amount.toLocaleString(locale)}</span>
                        <span className="text-muted-foreground">Payment Type:</span> <span>{getPaymentDescription()}</span>
                        <span className="text-muted-foreground">Method:</span> <span>{transaction.paymentMethod}</span>
                         {'senderNumber' in transaction && transaction.senderNumber && <>
                            <span className="text-muted-foreground">Sender No:</span> 
                            <span>{transaction.senderNumber}</span>
                         </>}
                    </div>
                </div>
                 <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Transaction Status</h3>
                     <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                         <span className="text-muted-foreground">Date:</span> <span>{new Date('date' in transaction ? transaction.date : transaction.createdAt).toLocaleDateString(locale)}</span>
                         <span className="text-muted-foreground">Time:</span> <span>{new Date('date' in transaction ? transaction.date : transaction.createdAt).toLocaleTimeString(locale)}</span>
                         <span className="text-muted-foreground">Status:</span> <span className="flex">{statusBadge}</span>
                         {transaction.approvedBy && <>
                            <span className="text-muted-foreground">Approved By:</span>
                            <span>{transaction.approvedBy}</span>
                         </>}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};

const TransactionRow = ({ transaction, isPendingView }: { transaction: Payment | ApprovedPayment, isPendingView: boolean }) => {
    const approveMutation = useApprovePayment();
    const rejectMutation = useRejectPayment();

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };
    const handleReject = (id: string) => {
        rejectMutation.mutate(id);
    };

    const isMutating = approveMutation.isPending || rejectMutation.isPending;

    return (
         <Dialog>
            <TableRow>
                <TableCell>
                    <div className="font-medium">{transaction.name}</div>
                    <div className="text-sm text-muted-foreground">{transaction.memberId}</div>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{pageText.paymentTypes[transaction.type as keyof typeof pageText.paymentTypes] || transaction.type}</div>
                     {'reason' in transaction && transaction.reason && <div className="text-sm text-muted-foreground">{transaction.reason}</div>}
                </TableCell>
                <TableCell className="font-mono text-xs">{transaction.transactionId}</TableCell>
                <TableCell className={transaction.amount < 0 ? 'text-destructive' : ''}>৳{transaction.amount.toLocaleString()}</TableCell>
                <TableCell className="text-center">{getStatusBadge(transaction.status as TransactionStatus)}</TableCell>
                <TableCell className="text-right">
                {isMutating ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
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
                          {isPendingView && (
                          <>
                              <DropdownMenuItem onClick={() => handleApprove(transaction.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(transaction.id)}>
                                  <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                          </>
                          )}
                      </DropdownMenuContent>
                  </DropdownMenu>
                )}
                </TableCell>
            </TableRow>
            <TransactionDetailsDialog transaction={transaction} statusBadge={getStatusBadge(transaction.status as TransactionStatus)} />
        </Dialog>
    )
}

const PendingTransactionsTab = () => {
    const { data: pendingPayments, isLoading, isError } = usePendingPayments();
    
    if (isLoading) return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    if (isError) return <div className="text-center py-8 text-destructive">Could not load pending payments.</div>
    if (!pendingPayments || pendingPayments.length === 0) return <div className="text-center py-8 text-muted-foreground">No transactions found for this status.</div>

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pendingPayments.map((txn) => (
                    <TransactionRow key={txn.id} transaction={txn} isPendingView={true} />
                ))}
            </TableBody>
        </Table>
    )
}

const CompletedTransactionsTab = () => {
    const { data: transactions, isLoading, isError } = useAllTransactions('Completed');

    if (isLoading) return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    if (isError) return <div className="text-center py-8 text-destructive">Could not load transactions.</div>
    if (!transactions || transactions.length === 0) return <div className="text-center py-8 text-muted-foreground">No transactions found for this status.</div>

     return (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Txn ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((txn) => (
                    <TransactionRow key={txn.id} transaction={txn} isPendingView={false} />
                ))}
            </TableBody>
        </Table>
    );
}

const FailedTransactionsTab = () => {
    const { data: transactions, isLoading, isError } = useAllTransactions('Failed');

    if (isLoading) return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    if (isError) return <div className="text-center py-8 text-destructive">Could not load transactions.</div>
    if (!transactions || transactions.length === 0) return <div className="text-center py-8 text-muted-foreground">No transactions found for this status.</div>

     return (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Txn ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((txn) => (
                    <TransactionRow key={txn.id} transaction={txn} isPendingView={false} />
                ))}
            </TableBody>
        </Table>
    );
}

export function TransactionClient() {
  const [tab, setTab] = useState('Pending');
  
  return (
    <Tabs defaultValue={tab} onValueChange={(value) => setTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value="Pending">
            <PendingTransactionsTab />
        </TabsContent>
         <TabsContent value="Completed">
            <CompletedTransactionsTab />
        </TabsContent>
        <TabsContent value="Failed">
            <FailedTransactionsTab />
        </TabsContent>
    </Tabs>
  );
}
