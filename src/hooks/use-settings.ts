'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentAccounts } from '@/services/prisma/queries/admin';
import { toast } from './use-toast';
import { PaymentAccount, AdminUser, Settings } from '@/types';
import { addAdminAction, removeAdminAction, updateSettings as updateSettingsAction } from '@/lib/actions/admin';

async function fetchSettings(): Promise<Settings> {
    const response = await fetch('/api/settings');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

export const useSettings = () => {
    const { data, isInitialLoading, isFetching } = useQuery<Settings>({
        queryKey: ['settings'],
        queryFn: fetchSettings,
    });
    return { data, isInitialLoading, isFetching };
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSettingsAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            toast({ title: "Settings Saved", description: "Your changes have been saved successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};

export const useAddAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addAdminAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            toast({ title: "Admin Added" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};

export const useRemoveAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeAdminAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            toast({ title: "Admin Removed" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};


export const usePaymentAccounts = () => {
    return useQuery<PaymentAccount[]>({
        queryKey: ['paymentAccounts'],
        queryFn: () => getPaymentAccounts(),
    });
};

export const useAddPaymentMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch('/api/admin/payment-accounts', { method: 'POST', body: formData });
            if (!response.ok) { const { error } = await response.json(); throw new Error(error); }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast({ title: "Account Added" });
            document.getElementById(`close-dialog-new`)?.click();
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};

export const useUpdatePaymentMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
            formData.append('id', id);
            const response = await fetch('/api/admin/payment-accounts', { method: 'PUT', body: formData });
            if (!response.ok) { const { error } = await response.json(); throw new Error(error); }
            return await response.json();
        },
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['paymentAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast({ title: "Account Updated" });
            document.getElementById(`close-dialog-${id}`)?.click();
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};

export const useDeletePaymentMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch('/api/admin/payment-accounts', { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!response.ok) { const { error } = await response.json(); throw new Error(error); }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentAccounts'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast({ title: "Account Deleted" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    });
};
