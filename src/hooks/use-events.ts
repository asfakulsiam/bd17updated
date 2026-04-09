

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveEvents } from '@/services/prisma/queries/admin';
import { toast } from './use-toast';

export const useActiveEvents = () => {
    return useQuery({
        queryKey: ['activeEvents'],
        queryFn: getActiveEvents
    });
};

export const useCreateEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch('/api/admin/events', {
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
            queryClient.invalidateQueries({ queryKey: ['activeEvents'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] }); // To refetch settings page data
            toast({ title: 'Event Created Successfully' });
            document.getElementById('close-event-dialog')?.click();
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
};
