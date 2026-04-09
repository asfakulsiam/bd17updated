'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import { LoanApplicationStatus, LoanWithDetails, OrgLoanData, UserLoanData } from '@/types';
import { useRouter } from 'next/navigation';
import { applyForLoan, updateLoanStatus, markLoanAsRepaid } from '@/lib/actions/loans';

async function fetchUserLoanData(): Promise<UserLoanData | null> {
    const response = await fetch('/api/loans/user-data');
     if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
    }
    return response.json();
}

async function fetchOrgLoanData(): Promise<OrgLoanData> {
    const response = await fetch('/api/loans/org-data');
    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
    }
    return response.json();
}

async function fetchLoanApplications(): Promise<LoanWithDetails[]> {
    const response = await fetch('/api/loans/applications');
     if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
    }
    return response.json();
}


export const useUserLoanData = () => {
    return useQuery({
        queryKey: ['userLoanData'],
        queryFn: fetchUserLoanData,
    });
};

export const useOrganizationLoanData = () => {
    return useQuery({
        queryKey: ['orgLoanData'],
        queryFn: fetchOrgLoanData,
    });
};

export const useLoanApplications = () => {
    return useQuery({
        queryKey: ['loanApplications'],
        queryFn: fetchLoanApplications,
    });
};

export const useApplyForLoan = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    return useMutation({
        mutationFn: applyForLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userLoanData'] });
            queryClient.invalidateQueries({ queryKey: ['loanApplications'] });
            toast({
                title: "Application Submitted",
                description: "Your loan application has been submitted for review.",
                variant: "default",
            });
            // Don't redirect, just update state. The component will show success.
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useUpdateLoanStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateLoanStatus,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['loanApplications'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            queryClient.invalidateQueries({ queryKey: ['userLoanData'] });
            toast({
                title: "Status Updated",
                description: `Loan application has been ${variables.status}.`
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};

export const useMarkLoanAsRepaid = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markLoanAsRepaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loanApplications'] });
            queryClient.invalidateQueries({ queryKey: ['userLoanData'] });
            queryClient.invalidateQueries({ queryKey: ['orgLoanData'] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({
                title: "Loan Repaid",
                description: "The loan has been successfully marked as repaid."
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};
