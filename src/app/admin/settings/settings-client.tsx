
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import JSZip from 'jszip';


// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogContent, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle as ShadcnAlertTitle, AlertDescription as ShadcnAlertDescription } from '@/components/ui/alert';


// Hooks and Actions
import { useToast } from '@/hooks/use-toast';
import { useUpdateSettings, useAddAdmin, useRemoveAdmin, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '@/hooks/use-settings';
import { useExportData, useImportData } from '@/hooks/use-data-management';
import { useCreateEvent } from '@/hooks/use-events';

// Models and Icons
import type { AdminUser, Settings, PaymentAccount, PaymentAccountType, Event } from '@/types';
import { Save, UserCog, PlusCircle, Trash2, Loader2, Smartphone, Pencil, CalendarPlus, Download, UploadCloud, Landmark, AlertTriangle, Star } from 'lucide-react';
import { getValidImageSrc } from '@/lib/utils';


const roleNames: Record<AdminUser['role'], string> = {
    super: 'Super Admin',
    members: 'Members Manager',
    loans: 'Loans Manager',
    transactions: 'Transactions Manager',
    posts: 'Posts Manager',
    messaging: 'Messaging Manager',
};


const PaymentAccountDialog = ({ account, children, isSuperAdmin }: { account?: PaymentAccount, children: React.ReactNode, isSuperAdmin: boolean }) => {
    const [accountType, setAccountType] = useState<PaymentAccountType | undefined>(account?.accountType);
    const addPaymentMutation = useAddPaymentMethod();
    const updatePaymentMutation = useUpdatePaymentMethod();
    const isSaving = addPaymentMutation.isPending || updatePaymentMutation.isPending;

    const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (account?.id) {
            updatePaymentMutation.mutate({ id: account.id, formData });
        } else {
            addPaymentMutation.mutate(formData);
        }
    }

    return (
        <Dialog onOpenChange={() => setAccountType(account?.accountType)}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{account ? 'Edit Account' : 'Add New Payment Account'}</DialogTitle>
                    <DialogDescription>Add a manual payment account for members.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <fieldset disabled={!isSuperAdmin || isSaving}>
                        <div className="space-y-2">
                            <Label htmlFor="accountType">Account Type</Label>
                            <Select name="accountType" defaultValue={account?.accountType} onValueChange={(v) => setAccountType(v as PaymentAccountType)} required>
                                <SelectTrigger id="accountType">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MobileBanking">Mobile Banking</SelectItem>
                                    <SelectItem value="Bank">Bank</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {accountType === 'MobileBanking' && (
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Service/Operator Name</Label>
                                <Input id="accountName" name="accountName" defaultValue={account?.accountName} placeholder="e.g., bKash, Nagad" required />
                            </div>
                        )}
                         {accountType === 'Bank' && (
                             <>
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" name="bankName" defaultValue={account?.bankName ?? ''} placeholder="e.g., Islami Bank" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName">Account Holder Name</Label>
                                    <Input id="accountName" name="accountName" defaultValue={account?.accountName} placeholder="e.g., John Doe" required />
                                </div>
                             </>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" name="accountNumber" defaultValue={account?.accountNumber} placeholder="Enter account number" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notice">Special Notice</Label>
                            <Textarea id="notice" name="notice" defaultValue={account?.notice ?? ""} placeholder="Special instructions for members (e.g., &apos;Send Money only&apos;)" />
                        </div>
                    </fieldset>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button id={`close-dialog-${account?.id || 'new'}`} type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={!isSuperAdmin || isSaving}>
                            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {account ? 'Save Changes' : 'Add Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const EventDialog = ({ children }: { children: React.ReactNode }) => {
    const createEventMutation = useCreateEvent();

    const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        createEventMutation.mutate(formData);
    };
    
    return (
         <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Create an event for members to make special payment against.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                     <fieldset disabled={createEventMutation.isPending}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Annual Picnic Fee" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="A short description for the event" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount</Label>
                            <Input id="amount" name="amount" type="number" placeholder="e.g., 500" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" name="startDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" required />
                            </div>
                        </div>
                    </fieldset>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button id="close-event-dialog" type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={createEventMutation.isPending}>
                            {createEventMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export function SettingsClient({ initialSettings, initialAdmins, currentAdminRole, initialPaymentAccounts, initialEvents }: { initialSettings: Settings, initialAdmins: AdminUser[], currentAdminRole: AdminUser['role'], initialPaymentAccounts: PaymentAccount[], initialEvents: Event[] }) {
    const router = useRouter();
    const { toast } = useToast();
    
    const [policyContent, setPolicyContent] = useState(initialSettings?.policyContent || '');
    const [loanSystemEnabled, setLoanSystemEnabled] = useState(initialSettings.loanSystemEnabled);
    const [specialSavingsEnabled, setSpecialSavingsEnabled] = useState(initialSettings.specialSavingsEnabled);
    const [importFile, setImportFile] = useState<File | null>(null);

    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<AdminUser['role'] | ''>('');
    
    const updateSettingsMutation = useUpdateSettings();
    const addAdminMutation = useAddAdmin();
    const removeAdminMutation = useRemoveAdmin();
    const deletePaymentMethodMutation = useDeletePaymentMethod();
    const exportDataMutation = useExportData();
    const importDataMutation = useImportData();

    const isPending = updateSettingsMutation.isPending || addAdminMutation.isPending || removeAdminMutation.isPending || deletePaymentMethodMutation.isPending || exportDataMutation.isPending || importDataMutation.isPending;

    const handleSaveChanges = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('policyContent', policyContent);
        formData.set('loanSystemEnabled', loanSystemEnabled ? 'true' : 'false');
        formData.set('specialSavingsEnabled', specialSavingsEnabled ? 'true' : 'false');
        updateSettingsMutation.mutate(formData);
    };

    const handleExport = () => {
        exportDataMutation.mutate();
    }

     const handleImport = async () => {
        if (!importFile) {
            toast({ title: 'No file selected', description: 'Please select a ZIP file to import.', variant: 'destructive' });
            return;
        }

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(importFile);
            const dataToImport: Record<string, any[]> = {};
            
            for (const filename in contents.files) {
                if (filename.endsWith('.json')) {
                    const file = contents.files[filename];
                    const jsonContent = await file.async('string');
                    const tableName = filename.replace('.json', '');
                    dataToImport[tableName] = JSON.parse(jsonContent);
                }
            }

            importDataMutation.mutate(dataToImport);

        } catch (error) {
            toast({ title: 'Import Error', description: `Failed to read or parse ZIP file: ${(error as Error).message}`, variant: 'destructive' });
        }
    };
    
    const handleDeletePaymentAccount = (id: string) => {
        deletePaymentMethodMutation.mutate(id);
    }

    const handleAddAdmin = () => {
        if (!newAdminEmail || !newAdminRole) {
            toast({ title: "Error", description: "Email and role are required.", variant: 'destructive' });
            return;
        }
        addAdminMutation.mutate({ email: newAdminEmail, role: newAdminRole as any });
        setNewAdminEmail('');
        setNewAdminRole('');
    };

     const handleRemoveAdmin = (id: string) => {
        removeAdminMutation.mutate(id);
    };

    const isSuperAdmin = currentAdminRole === 'super';

    return (
        <form className="space-y-8" onSubmit={handleSaveChanges}>
            <div>
                <h1 className="text-3xl font-bold font-headline">Application Settings</h1>
                <p className="text-muted-foreground">Manage application-wide settings, rules, and content.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Settings</CardTitle>
                            <CardDescription>Manage your site&apos;s title and logo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="siteTitle">Site Title</Label>
                                <Input 
                                    id="siteTitle" 
                                    name="siteTitle"
                                    defaultValue={initialSettings.siteTitle}
                                    disabled={isPending || !isSuperAdmin}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Site Logo</Label>
                                <div className='flex items-end gap-4'>
                                    <Image src={getValidImageSrc(initialSettings.logoUrl)} alt="Current Logo" width={80} height={80} className="rounded-md border p-2 bg-muted" data-ai-hint="logo"/>
                                    <div className='flex-1'>
                                        <Label htmlFor="logoUpload">Upload new logo</Label>
                                        <Input name="logo" id="logoUpload" type="file" disabled={isPending || !isSuperAdmin}/>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Features</CardTitle>
                            <CardDescription>Enable or disable core system modules.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="loan-system-toggle" className="text-base font-semibold">Loan System</Label>
                                    <p className="text-sm text-muted-foreground">Allow members to apply for loans from the savings fund.</p>
                                </div>
                                <Switch 
                                    id="loan-system-toggle" 
                                    checked={loanSystemEnabled}
                                    onCheckedChange={setLoanSystemEnabled}
                                    disabled={isPending || !isSuperAdmin}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="special-savings-toggle" className="text-base font-semibold">Special Savings</Label>
                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Allow members to make one-off deposits that don&apos;t count towards monthly dues.</p>
                                </div>
                                <Switch 
                                    id="special-savings-toggle" 
                                    checked={specialSavingsEnabled}
                                    onCheckedChange={setSpecialSavingsEnabled}
                                    disabled={isPending || !isSuperAdmin}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Rules</CardTitle>
                            <CardDescription>Set the core financial parameters for savings, members, and loans.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="minSavings">Minimum Monthly Savings (BDT)</Label>
                                <Input 
                                    id="minSavings" 
                                    name="minMonthlySavings"
                                    type="number"
                                    defaultValue={initialSettings.minMonthlySavings}
                                    disabled={isPending || !isSuperAdmin}
                                />
                                <p className="text-xs text-muted-foreground">The mandatory minimum amount each member must save per month.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="shareValue">Extra Member Monthly Fee (BDT)</Label>
                                <Input
                                    id="shareValue"
                                    name="shareValue"
                                    type="number"
                                    defaultValue={initialSettings.shareValue || 1000}
                                    disabled={isPending || !isSuperAdmin}
                                />
                                <p className="text-xs text-muted-foreground">The monthly fee for each additional member.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="maxSharesPerMember">Maximum Extra Members</Label>
                                <Input 
                                    id="maxSharesPerMember" 
                                    name="maxSharesPerMember"
                                    type="number"
                                    defaultValue={initialSettings.maxSharesPerMember}
                                    disabled={isPending || !isSuperAdmin}
                                />
                                <p className="text-xs text-muted-foreground">The maximum number of additional members a primary member can hold.</p>
                            </div>
                             <div className="space-y-2">
                                <Label>Loan to Savings Ratio</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="loanToSavingsRatioNumerator"
                                        type="number"
                                        defaultValue={initialSettings.loanToSavingsRatioNumerator}
                                        className="w-1/2"
                                        disabled={isPending || !isSuperAdmin}
                                    />
                                    <span className="text-muted-foreground">/</span>
                                     <Input
                                        name="loanToSavingsRatioDenominator"
                                        type="number"
                                        defaultValue={initialSettings.loanToSavingsRatioDenominator}
                                        className="w-1/2"
                                        disabled={isPending || !isSuperAdmin}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">The ratio of a member&apos;s total savings they can borrow. E.g., 1 / 3 for one-third.</p>
                            </div>
                        </CardContent>
                    </Card>
                     
                    {isSuperAdmin && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Data Management</CardTitle>
                                <CardDescription>Export all site data to a ZIP file, or import from one to restore.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button type="button" variant="outline" className="w-full" onClick={handleExport} disabled={isPending}>
                                    {exportDataMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Export All Data (ZIP)
                                </Button>
                                <div className="border-t pt-4 space-y-2">
                                    <Label htmlFor="import-file">Import Data</Label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Input
                                            id="import-file"
                                            type="file"
                                            accept=".zip"
                                            disabled={importDataMutation.isPending}
                                            onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                            className="flex-grow"
                                        />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button type="button" className="w-full sm:w-auto" disabled={isPending || !importFile}>
                                                    <UploadCloud className="mr-2 h-4 w-4" /> Upload & Import
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This is a destructive action. Importing this file will completely wipe all current data in the database and replace it. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleImport} className="bg-destructive hover:bg-destructive/90">
                                                        Yes, I understand, import data
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}


                    <Card>
                        <CardHeader>
                            <CardTitle>Manual Payment Accounts</CardTitle>
                            <CardDescription>Manage accounts for members to make manual payments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {initialPaymentAccounts.map(account => (
                               <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        {account.accountType === 'MobileBanking' ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Landmark className="h-5 w-5 text-muted-foreground" />}
                                        <div>
                                            <p className="font-semibold">
                                                {account.accountType === 'Bank' ? `${account.bankName ?? ''} - ${account.accountName}` : account.accountName}
                                            </p>
                                            <p className="font-mono text-xs">{account.accountNumber}</p>
                                            <p className="text-xs text-muted-foreground">{account.notice}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <PaymentAccountDialog account={account} isSuperAdmin={isSuperAdmin}>
                                            <Button variant="ghost" size="icon" disabled={!isSuperAdmin || isPending}>
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                        </PaymentAccountDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={!isSuperAdmin || isPending}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the payment account.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeletePaymentAccount(account.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                               </div>
                           ))}
                           <PaymentAccountDialog isSuperAdmin={isSuperAdmin}>
                                <Button variant="outline" className="w-full mt-4" disabled={!isSuperAdmin || isPending}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
                                </Button>
                           </PaymentAccountDialog>
                        </CardContent>
                    </Card>
                     
                    {isSuperAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Management</CardTitle>
                                <CardDescription>Create and manage special payment events like picnics or fees.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Active/Upcoming Events</h4>
                                    {initialEvents.length > 0 ? (
                                        <div className="space-y-2">
                                            {initialEvents.map(event => (
                                                <div key={event.id} className="flex justify-between items-center p-2 border rounded-md">
                                                    <div>
                                                        <p className="font-semibold">{event.name} (৳{event.amount})</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground py-4">No active events.</p>
                                    )}
                               </div>
                                <EventDialog>
                                    <Button variant="outline" className="w-full mt-4">
                                        <CalendarPlus className="mr-2 h-4 w-4" /> Create New Event
                                    </Button>
                                </EventDialog>
                            </CardContent>
                        </Card>
                    )}

                    {isSuperAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserCog className="mr-2" /> Admin Management
                                </CardTitle>
                                <CardDescription>Add or remove administrators for the application.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label>Add New Admin</Label>
                                    <div className="flex flex-col md:flex-row gap-2 mt-2">
                                        <Input 
                                            type="email"
                                            placeholder="Enter user&apos;s email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            disabled={isPending}
                                        />
                                        <Select value={newAdminRole} onValueChange={(value) => setNewAdminRole(value as AdminUser['role'])} disabled={isPending}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(roleNames)
                                                    .filter(([role]) => role !== 'super')
                                                    .map(([role, name]) => (
                                                    <SelectItem key={role} value={role}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={handleAddAdmin} className="md:w-auto w-full" disabled={isPending || !newAdminEmail || !newAdminRole}>
                                            {addAdminMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Admin
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-4">Current Admins</h4>
                                    <div className="space-y-3">
                                        {initialAdmins.map(admin => (
                                            <div key={admin.id} className="flex items-center justify-between p-2 rounded-md border">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={getValidImageSrc(admin.avatarUrl)} alt={admin.name} data-ai-hint="professional person" />
                                                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-sm">{admin.name}</p>
                                                        <p className="text-xs text-muted-foreground">{admin.email} - <span className="font-medium">{roleNames[admin.role]}</span></p>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isPending || admin.role === 'super'} className={admin.role === 'super' ? 'cursor-not-allowed' : 'text-red-500 hover:text-red-600'}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will revoke admin privileges for {admin.email}. This user will not be deleted. Are you sure you want to proceed?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveAdmin(admin.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, remove admin
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}


                    <Card>
                        <CardHeader>
                            <CardTitle>Policy Editor</CardTitle>
                            <CardDescription>Edit the content of the main policy page. Changes will be reflected live.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                name="policyContent"
                                defaultValue={policyContent}
                                onChange={(e) => setPolicyContent(e.target.value)}
                                rows={20}
                                placeholder="Enter the full policy text here..."
                                disabled={isPending || !isSuperAdmin}
                            />
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="lg:col-span-1 sticky top-24">
                    <CardHeader>
                        <CardTitle>Save Changes</CardTitle>
                        <CardDescription>Review your changes and click save when you&apos;re ready to apply them.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending || !isSuperAdmin}>
                            {updateSettingsMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className="mr-2 h-4 w-4" />}
                            Save All Settings
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
      );

    
}
