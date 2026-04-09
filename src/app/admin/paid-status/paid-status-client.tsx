
'use client';

import { useState, useTransition } from 'react';
import type { Member } from "@/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { sendPaymentReminder, sendBulkPaymentReminders } from '@/lib/actions/messages';

type PaidStatusClientProps = {
    members: Member[];
    month: string;
    type: 'paid' | 'unpaid';
};

export function PaidStatusClient({ members, month, type }: PaidStatusClientProps) {
    const [remindingId, setRemindingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isBulkPending, startBulkTransition] = useTransition();

    const handleSendReminder = (member: Member) => {
        setRemindingId(member.id);
        startTransition(async () => {
            try {
                await sendPaymentReminder(member, month);
                toast({
                    title: "Reminder Sent",
                    description: `A payment reminder has been sent to ${member.fullNameEn}.`,
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            } finally {
                setRemindingId(null);
            }
        });
    };

    const handleSendAllReminders = () => {
        startBulkTransition(async () => {
            try {
                await sendBulkPaymentReminders(members, month);
                toast({
                    title: "All Reminders Sent",
                    description: `Payment reminders have been sent to all ${members.length} unpaid members.`,
                });
            } catch (error) {
                 toast({
                    title: "Error",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            }
        });
    }

    if (members.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p>All members have paid for this month.</p>
            </div>
        );
    }
    
    return (
        <div>
            {type === 'unpaid' && (
                <div className="flex justify-end mb-4">
                    <Button onClick={handleSendAllReminders} disabled={isBulkPending}>
                        {isBulkPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        {isBulkPending ? 'Sending...' : 'Remind All Unpaid'}
                    </Button>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        {type === 'unpaid' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={member.photoUrl || undefined} alt={member.fullNameEn || ''} />
                                        <AvatarFallback>{member.fullNameEn?.charAt(0) ?? '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{member.fullNameEn}</div>
                                        <div className="text-xs text-muted-foreground">{member.id}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.mobilePrimary}</TableCell>
                            {type === 'unpaid' && (
                                <TableCell className="text-right">
                                    {remindingId === member.id || isBulkPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => handleSendReminder(member)} disabled={isPending}>
                                            <Mail className="mr-2 h-4 w-4" /> Send Reminder
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
