

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessagesForUser, getUnreadCounts } from '@/services/prisma/queries/messages';
import { toast } from './use-toast';
import { Member } from '@/types';

export const useMessagesForUser = (userId?: string) => {
    return useQuery({
        queryKey: ['messages', userId],
        queryFn: () => getMessagesForUser(),
        enabled: !!userId,
    });
};

export const useUnreadCounts = (userId?: string) => {
    return useQuery({
        queryKey: ['unreadCounts', userId],
        queryFn: () => getUnreadCounts(),
        enabled: !!userId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ recipientType, memberId, title, content }: { recipientType: 'all' | 'specific', memberId: string | null, title: string, content: string }) => {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientType, memberId, title, content }),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] }); // Invalidate all message queries
            toast({ title: "Message Sent!", description: "Your message has been sent." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};

export const useMarkMessageAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (messageId: string) => {
             const response = await fetch('/api/messages/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId }),
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: (data, messageId) => {
            queryClient.invalidateQueries({ queryKey: ['messages', data.clerkId] });
            queryClient.invalidateQueries({queryKey: ['unreadCounts']});
            toast({ title: "Message marked as read." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
};


export const useSendPaymentReminder = () => {
  return useMutation({
    mutationFn: async ({ memberId, month }: { memberId: string, month: string }) => {
      const response = await fetch('/api/messages/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, month }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Sent",
        description: `A payment reminder has been sent to ${data.memberName}.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useSendBulkPaymentReminders = () => {
  return useMutation({
    mutationFn: async ({ memberIds, month }: { memberIds: string[], month: string }) => {
       const response = await fetch('/api/messages/send-bulk-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds, month }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "All Reminders Sent",
        description: `Payment reminders have been sent to all ${data.count} unpaid members.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
