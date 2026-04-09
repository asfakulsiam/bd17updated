
'use client';

import { useState, useTransition } from 'react';
import type { ProfileUpdate } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { approveProfileUpdate, rejectProfileUpdate } from '@/lib/actions/members';
import { getMemberDetails } from '@/services/prisma/queries/members';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { getValidImageSrc } from '@/lib/utils';
import type { MemberDetailsData } from '@/app/admin/members/[id]/types';

type ProfileUpdateWithMember = ProfileUpdate & { member: { fullNameEn: string } };

const ChangeRow = ({ field, oldValue, newValue }: { field: string, oldValue: any, newValue: any }) => {
    // Capitalize first letter and add spaces before uppercase letters
    const formattedField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    // Don't show fields that haven't changed or are image URLs (handled separately)
    if (String(oldValue) === String(newValue) || field.toLowerCase().includes('url') || field.toLowerCase().includes('publicid')) {
        return null;
    }
    
    const formatValue = (value: any) => {
        if (!value) return 'N/A';
        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
             return new Date(value).toLocaleDateString();
        }
        return String(value);
    }

    return (
        <TableRow>
            <TableCell className="font-semibold">{formattedField}</TableCell>
            <TableCell className="text-muted-foreground">{formatValue(oldValue)}</TableCell>
            <TableCell className="text-primary font-medium">{formatValue(newValue)}</TableCell>
        </TableRow>
    )
};


const UpdateDetailsDialog = ({ request }: { request: ProfileUpdateWithMember }) => {
    const [originalMember, setOriginalMember] = useState<MemberDetailsData | null>(null);
    const [loading, setLoading] = useState(false);
    const updatedData = request.updateData;

    const handleOpen = async (isOpen: boolean) => {
        if (isOpen && !originalMember) {
            setLoading(true);
            try {
                const memberDetails = await getMemberDetails(request.memberId);
                 if (memberDetails) {
                    setOriginalMember(memberDetails);
                }
            } catch (error) {
                console.error("Failed to fetch original member details", error);
                toast({ title: "Error", description: "Could not fetch original member details.", variant: 'destructive'});
            } finally {
                setLoading(false);
            }
        }
    }
    
    const imageFields = [
        { key: 'photoUrl', label: 'Photo' },
        { key: 'nidCopyUrl', label: 'NID Copy' },
        { key: 'bankStatementUrl', label: 'Bank Statement' }
    ];

    const changedImages = imageFields.filter(field => updatedData[field.key] && updatedData[field.key] !== (originalMember?.details as any)?.[field.key]);

    return (
        <Dialog onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto"><Eye className="mr-2 h-4 w-4" /> View Changes</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Review Profile Update</DialogTitle>
                    <DialogDescription>
                        Review the requested changes for {request.member.fullNameEn}.
                    </DialogDescription>
                </DialogHeader>
                {loading || !originalMember ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto p-1">
                        <h3 className="font-semibold text-lg mb-2">Text Changes</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Current Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(updatedData).map(key => (
                                    <ChangeRow key={key} field={key} oldValue={(originalMember.details as any)[key]} newValue={updatedData[key]} />
                                ))}
                            </TableBody>
                        </Table>
                        
                        {changedImages.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-2">Image Changes</h3>
                                <div className="space-y-4">
                                {changedImages.map(field => (
                                    <div key={field.key}>
                                        <h4 className="font-medium text-muted-foreground">{field.label}</h4>
                                        <div className="grid grid-cols-2 gap-4 mt-2 border rounded-lg p-2">
                                            <div>
                                                <p className="text-sm font-semibold text-center mb-1">Current</p>
                                                <Image 
                                                    src={getValidImageSrc((originalMember.details as any)[field.key])} 
                                                    alt={`Current ${field.label}`} 
                                                    width={400} 
                                                    height={250} 
                                                    className="rounded-md object-contain w-full h-auto"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-center mb-1">New</p>
                                                 <Image 
                                                    src={getValidImageSrc(updatedData[field.key])} 
                                                    alt={`New ${field.label}`} 
                                                    width={400} 
                                                    height={250} 
                                                    className="rounded-md object-contain w-full h-auto"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
};


const MobileRequestCard = ({ request, onApprove, onReject, isProcessingId }: { request: ProfileUpdateWithMember; onApprove: (id: string) => void; onReject: (id: string) => void; isProcessingId: string | null; }) => {
    const isThisCardProcessing = isProcessingId === request.id;
    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-base'>{request.member.fullNameEn}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Requested on: {new Date(request.createdAt).toLocaleDateString()}
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
                 {isThisCardProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                    <>
                        <UpdateDetailsDialog request={request} />
                        <Button size="sm" variant="outline" className="bg-red-100 dark:bg-red-900/50 w-full sm:w-auto" onClick={() => onReject(request.id)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                        <Button size="sm" variant="outline" className="bg-green-100 dark:bg-green-900/50 w-full sm:w-auto" onClick={() => onApprove(request.id)}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                    </>
                 )}
            </CardFooter>
        </Card>
    )
}

export function ProfileUpdateRequestClient({ initialRequests }: { initialRequests: ProfileUpdateWithMember[] }) {
    const [requests, setRequests] = useState(initialRequests);
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();
    const isMobile = useIsMobile();

    const handleApprove = (id: string) => {
        setProcessingId(id);
        startTransition(async () => {
            try {
                await approveProfileUpdate(id);
                toast({ title: "Update Approved", description: "The member's profile has been updated." });
                setRequests(prev => prev.filter(req => req.id !== id));
                router.refresh();
            } catch (error) {
                toast({ title: "Error", description: (error as Error).message, variant: 'destructive' });
            } finally {
                setProcessingId(null);
            }
        });
    }
    
    const handleReject = (id: string) => {
        setProcessingId(id);
        startTransition(async () => {
            try {
                await rejectProfileUpdate(id);
                toast({ title: "Update Rejected" });
                setRequests(prev => prev.filter(req => req.id !== id));
                router.refresh();
            } catch (error) {
                toast({ title: "Error", description: (error as Error).message, variant: 'destructive' });
            } finally {
                setProcessingId(null);
            }
        });
    }

    if (requests.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-4">No pending requests.</p>;
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                {requests.map(request => (
                    <MobileRequestCard 
                        key={request.id} 
                        request={request} 
                        onApprove={handleApprove} 
                        onReject={handleReject}
                        isProcessingId={processingId}
                    />
                ))}
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map(request => (
                    <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.member.fullNameEn}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            {isPending && processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                <div className="flex gap-2 justify-end">
                                    <UpdateDetailsDialog request={request} />
                                    <Button size="sm" variant="outline" className="bg-red-100 dark:bg-red-900/50" onClick={() => handleReject(request.id)}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                    <Button size="sm" variant="outline" className="bg-green-100 dark:bg-green-900/50" onClick={() => handleApprove(request.id)}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
