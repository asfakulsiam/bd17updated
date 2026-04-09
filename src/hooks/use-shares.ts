
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import type { ShareStatus } from '@/types';
import { createShare, updateShare, updateShareStatus } from '@/lib/actions/shares';

export const useCreateShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createShare,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({ title: 'Member Created', description: 'Your new extra member has been successfully created.' });
            document.getElementById(`close-dialog-new`)?.click();
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useUpdateShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ shareId, formData }: { shareId: string, formData: FormData }) => {
            return updateShare(shareId, formData);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({ title: 'Member Updated', description: 'The extra member details have been successfully updated.' });
            document.getElementById(`close-dialog-${variables.shareId}`)?.click();
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useUpdateShareStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateShareStatus,
        onSuccess: (response, variables) => {
            const data = response;
            queryClient.invalidateQueries({ queryKey: ['userDetails', data.clerkId] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails', data.memberId] });
            if (variables.status === 'Removed') {
                toast({ title: 'Member Removed', description: 'The extra member has been removed and payments converted to advance.' });
            } else if (variables.status === 'ForTransfer') {
                toast({ title: 'Transfer Requested', description: 'An admin will review your share transfer request.' });
            }
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};
