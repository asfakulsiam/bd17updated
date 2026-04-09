'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import type { TransactionStatus, ApprovedPayment, Payment } from '@/types';
import { getUserPaymentHistory } from '@/services/prisma/queries/transactions';
import { getAllTransactions as getAllTransactionsQuery, getPendingPayments as getPendingPaymentsQuery } from '@/services/prisma/queries/transactions';
import { approvePayment as approvePaymentAction, rejectPayment as rejectPaymentAction } from '@/lib/actions/transactions';


export const useUserPaymentHistory = () => {
    return useQuery({
        queryKey: ['paymentHistory'],
        queryFn: () => getUserPaymentHistory(),
    });
};

export const useAllTransactions = (status?: TransactionStatus) => {
    return useQuery<Payment[]>({
        queryKey: ['allTransactions', status],
        queryFn: () => getAllTransactionsQuery(status),
    });
};

export const usePendingPayments = () => {
    return useQuery<ApprovedPayment[]>({
        queryKey: ['pendingPayments'],
        queryFn: () => getPendingPaymentsQuery(),
    });
};

export const useSubmitManualPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            const response = await fetch('/api/payments/submit-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return await response.json();
        },
        onSuccess: () => {
            toast({ title: "Payment Submitted", description: "Your payment is now pending admin approval." });
            queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    })
};


export const useApprovePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approvePaymentAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
            queryClient.invalidateQueries({ queryKey: ['allTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({ title: "Payment Approved", description: `Transaction has been approved and allocated.` });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useRejectPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectPaymentAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            toast({ title: "Payment Rejected" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    })
}
