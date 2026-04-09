

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import type { MemberStatus, MemberDetailsData, Member, JoiningType, Settings } from '@/models';
import { useRouter } from 'next/navigation';
import { getMembersList, getUserDetails as getUserDetailsAction, getMemberDetails } from '@/services/prisma/queries/members';
import { transferShare as transferShareAction } from '@/lib/actions/admin';
import { convertShareToAdvance } from '@/lib/actions/shares';
import { updateMember as updateMemberAction } from '@/lib/actions/members';


export const useMembersList = (status?: MemberStatus) => {
    return useQuery<Member[], Error>({
        queryKey: ['members', status],
        queryFn: () => getMembersList(status),
    });
};

export const useMemberDetails = (memberId?: string) => {
    return useQuery<MemberDetailsData | null, Error>({
        queryKey: ['memberDetails', memberId],
        queryFn: () => getMemberDetails(memberId!),
        enabled: !!memberId,
    });
};

export const useUserDetails = (userId?: string) => {
    return useQuery<MemberDetailsData | null, Error>({
        queryKey: ['userDetails', userId],
        queryFn: () => getUserDetailsAction(),
        enabled: !!userId,
    });
};

export const useCreateMemberFromClerk = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ clerkId, joiningType }: { clerkId: string, joiningType: JoiningType }) => {
            const response = await fetch('/api/admin/create-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkId, joiningType }),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({
                title: "Member Created Successfully",
                description: "The member's application is now in the Pending list for review.",
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
}

export const useUpdateMember = (memberId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => updateMemberAction(memberId, formData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['memberDetails', memberId] });
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({
                title: "Member Profile Updated",
                description: `Changes for member have been saved successfully.`,
            });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useUpdateMemberStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ memberId, status, reason }: { memberId: string, status: MemberStatus, reason?: string }) => {
            const response = await fetch('/api/admin/members/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, status, reason }),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails', variables.memberId] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({ title: `Member status set to ${variables.status}` });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useDeleteMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (memberId: string) => {
             const response = await fetch('/api/admin/members/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            toast({ title: "Member Deleted" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useManuallyAssignLoan = (memberId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch(`/api/admin/loans/assign-manual/${memberId}`, {
                method: 'POST',
                body: formData
            });
             if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberDetails', memberId] });
            queryClient.invalidateQueries({ queryKey: ['loanApplications'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['userLoanData'] });
            toast({ title: "Loan Assigned", description: "A manual loan has been successfully created." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useAdminAddShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ memberId, formData }: { memberId: string, formData: FormData }) => {
            const response = await fetch(`/api/admin/shares/create/${memberId}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) { const { error } = await response.json(); throw new Error(error); }
            return await response.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['memberDetails', variables.memberId] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            document.getElementById(`close-share-dialog-new`)?.click();
            toast({ title: 'Extra Member Added' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useAdminDeleteShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (shareId: string) => {
            const response = await fetch(`/api/admin/shares/delete/${shareId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: (data) => {
            const { memberId, clerkId } = data.data;
            queryClient.invalidateQueries({ queryKey: ['memberDetails', memberId] });
            queryClient.invalidateQueries({ queryKey: ['userDetails', clerkId] });
            toast({ title: 'Extra Member Converted', description: 'Share has been converted to advance balance.' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useAdminUpdateShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ shareId, formData }: { shareId: string, formData: FormData }) => {
            const response = await fetch(`/api/admin/shares/update/${shareId}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) { const { error } = await response.json(); throw new Error(error); }
            return await response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['memberDetails', data.memberId] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            document.getElementById(`close-share-dialog-${data.id}`)?.click();
            toast({ title: 'Extra Member Updated' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useAdminTransferShare = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: transferShareAction,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['memberDetails', data.fromMemberId] });
            queryClient.invalidateQueries({ queryKey: ['memberDetails', variables.toMemberId] });
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
            toast({ title: 'Share Transferred Successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
}
