
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';

export const useExportData = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/admin/data-management');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }
            
            const blob = await response.blob();
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `bondhon17_export_${new Date().toISOString().split('T')[0]}.zip`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        onSuccess: () => {
            toast({ title: 'Export Successful', description: 'Data has been downloaded.' });
        },
        onError: (error: Error) => {
            toast({ title: 'Export Error', description: error.message, variant: 'destructive' });
        }
    });
};

export const useImportData = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => { // Data is the unzipped JSON object
             const response = await fetch('/api/admin/data-management', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Import failed');
            }
            return await response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Import Complete",
                description: `Successfully processed file. The database has been restored.`,
            });
            // Invalidate all queries to refetch fresh data
            queryClient.invalidateQueries();
            // A full reload is often best after a destructive import
            window.location.reload();
        },
        onError: (error: Error) => {
            toast({ title: "Import Error", description: error.message, variant: 'destructive' });
        }
    });
};
