'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { registerMember } from "@/lib/actions/members";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { Loader2, Info } from "lucide-react";
import { Member, JoiningType } from "@/types";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getValidImageSrc } from "@/lib/utils";


const MAX_FILE_SIZE_KB = 700;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;


export function RegistrationClient({ member }: { member: Member | null }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [joiningType, setJoiningType] = useState<JoiningType | null>(member?.status === 'Rejected' ? member.joiningType : null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        if (!joiningType) {
            toast({ title: "ত্রুটি", description: "অনুগ্রহ করে যোগদানের ধরন নির্বাচন করুন।", variant: "destructive" });
            return;
        }
        formData.set('joiningType', joiningType);

        const photoFile = formData.get('photo') as File | null;
        const nidFile = formData.get('nidCopy') as File | null;
        const bankFile = formData.get('bankStatement') as File | null;

        if (photoFile && photoFile.size > MAX_FILE_SIZE_BYTES) {
            toast({ title: "ত্রুটি", description: `ফাইলের আকার ${MAX_FILE_SIZE_KB}KB এর বেশি হতে পারবে না।`, variant: "destructive" });
            return;
        }
        if (nidFile && nidFile.size > MAX_FILE_SIZE_BYTES) {
            toast({ title: "ত্রুটি", description: `ফাইলের আকার ${MAX_FILE_SIZE_KB}KB এর বেশি হতে পারবে না।`, variant: "destructive" });
            return;
        }
        if (bankFile && bankFile.size > MAX_FILE_SIZE_BYTES) {
            toast({ title: "ত্রুটি", description: `ফাইলের আকার ${MAX_FILE_SIZE_KB}KB এর বেশি হতে পারবে না।`, variant: "destructive" });
            return;
        }
        
        startTransition(async () => {
            try {
                await registerMember(formData);
                toast({
                    title: "আবেদন সফল হয়েছে",
                    description: "আপনার নিবন্ধন আবেদন পর্যালোচনার জন্য জমা হয়েছে।",
                });
                // After successful (re)submission, reset state to show pending message
                if (member) {
                    member.status = 'Pending';
                }
            } catch (error) {
                toast({
                    title: "ত্রুটি",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            }
        });
    }

    const defaultValues = (member && member.status === 'Rejected') ? member : {} as Member;
    
    const formatDateForInput = (dateString?: string | null): string => {
      if (!dateString) return '';
      try {
        // Create a date object, which will be in the local timezone of the server/browser.
        const date = new Date(dateString);
        // If the date is invalid, return empty.
        if (isNaN(date.getTime())) return '';
        // The toISOString() method returns a string in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ), which is always in UTC.
        // To get the correct date in the user's local timezone, we need to account for the timezone offset.
        const tzOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
        return localISOTime;
      } catch (e) {
        return '';
      }
    };

    if (member && member.status === 'Pending') {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
                <div className="bg-yellow-100/50 dark:bg-yellow-900/20 p-6 rounded-full">
                <Info className="w-16 h-16 text-yellow-600" />
                </div>
                <h1 className="font-headline text-3xl font-bold">আবেদন পর্যালোচনার অধীনে আছে</h1>
                <p className="text-muted-foreground max-w-md">
                আপনার নিবন্ধন আবেদনটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর আপনি আপনার সম্পূর্ণ প্রোফাইল দেখতে পারবেন।
                </p>
                <Button asChild variant="link">
                    <Link href="/account">অ্যাকাউন্টে ফিরে যান</Link>
                </Button>
            </div>
        )
    }

    if (!joiningType && member?.status !== 'Rejected') {
        return (
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>যোগদানের ধরন নির্বাচন করুন</CardTitle>
                    <CardDescription>আপনি কিভাবে সমিতিতে যোগদান করতে চান তা নির্বাচন করুন।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div onClick={() => setJoiningType('New')} className="p-4 border rounded-lg hover:bg-muted cursor-pointer">
                        <h3 className="font-semibold text-lg">নতুন সদস্য (New Member)</h3>
                        <p className="text-sm text-muted-foreground">যদি আপনি ২০২৫ সালে যোগদান করেন, আপনাকে পুরাতন সদস্য হিসাবে গণ্য করা হবে এবং আগস্ট ২০২৫ থেকে পেমেন্ট করতে হবে। যদি আপনি ২০২৫ সালের পরে যোগদান করেন, তাহলে যোগদানের বছরের জানুয়ারি মাস থেকে পেমেন্ট শুরু হবে।</p>
                    </div>
                     <div onClick={() => setJoiningType('Old')} className="p-4 border rounded-lg hover:bg-muted cursor-pointer">
                        <h3 className="font-semibold text-lg">পুরাতন সদস্য (Old Member)</h3>
                        <p className="text-sm text-muted-foreground">আমি সমিতির শুরু থেকে (আগস্ট ২০২৫) একজন সদস্য হিসেবে যোগদান করতে চাই এবং পূর্বের সকল বকেয়া পরিশোধ করতে ইচ্ছুক।</p>
                    </div>
                </CardContent>
            </Card>
        )
    }


  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-4xl shadow-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">সদস্য নিবন্ধন ফরম</CardTitle>
          <CardDescription> বন্ধন&apos;১৭ তে যোগদানের জন্য আবেদন করুন {joiningType && `( ধরন: ${joiningType} )`}</CardDescription>
          {member?.status === 'Rejected' && (
              <Alert variant="destructive" className="text-left">
                <AlertTitle>আপনার পূর্ববর্তী আবেদনটি বাতিল করা হয়েছে</AlertTitle>
                <AlertDescription>
                    <p>কারণ: {member.rejectionReason || "কোনো কারণ উল্লেখ করা হয়নি।"}</p>
                    <p className="mt-2">অনুগ্রহ করে আপনার তথ্য সংশোধন করে পুনরায় জমা দিন।</p>
                </AlertDescription>
              </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          
          <fieldset disabled={isPending} className="space-y-8 group">
              <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">ব্যক্তিগত তথ্য</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="fullNameBn">পূর্ণ নাম (বাংলা)</Label>
                    <Input name="fullNameBn" id="fullNameBn" placeholder="আপনার পুরো নাম লিখুন" defaultValue={defaultValues.fullNameBn ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fullNameEn">পূর্ণ নাম (ইংরেজি)</Label>
                    <Input name="fullNameEn" id="fullNameEn" placeholder="Enter your full name" defaultValue={defaultValues.fullNameEn ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fatherName">পিতার নাম</Label>
                    <Input name="fatherName" id="fatherName" placeholder="আপনার পিতার নাম লিখুন" defaultValue={defaultValues.fatherName ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="motherName">মাতার নাম</Label>
                    <Input name="motherName" id="motherName" placeholder="আপনার মাতার নাম লিখুন" defaultValue={defaultValues.motherName ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nid">জাতীয় পরিচয়পত্র নম্বর / জন্ম নিবন্ধন নম্বর</Label>
                    <Input name="nid" id="nid" placeholder="NID or Birth Certificate Number" defaultValue={defaultValues.nid ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dob">জন্ম তারিখ</Label>
                    <Input name="dob" id="dob" type="date" defaultValue={formatDateForInput(defaultValues.dob)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bloodGroup">রক্তের গ্রুপ</Label>
                    <Select name="bloodGroup" defaultValue={defaultValues.bloodGroup ?? ''} required>
                    <SelectTrigger id="bloodGroup">
                        <SelectValue placeholder="রক্তের গ্রুপ নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maritalStatus">বৈবাহিক অবস্থা</Label>
                    <Select name="maritalStatus" defaultValue={defaultValues.maritalStatus ?? ''} required>
                    <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="বৈবাহিক অবস্থা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="married">বিবাহিত</SelectItem>
                        <SelectItem value="unmarried">অবিবাহিত</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="religion">ধর্ম</Label>
                    <Input name="religion" id="religion" placeholder="আপনার ধর্ম লিখুন" defaultValue={defaultValues.religion ?? ''} required />
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">ঠিকানা</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currentAddress">বর্তমান ঠিকানা</Label>
                    <Textarea name="currentAddress" id="currentAddress" placeholder="আপনার বর্তমান ঠিকানা লিখুন" defaultValue={defaultValues.currentAddress ?? ''} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="permanentAddress">স্থায়ী ঠিকানা</Label>
                    <Textarea name="permanentAddress" id="permanentAddress" placeholder="আপনার স্থায়ী ঠিকানা লিখুন" defaultValue={defaultValues.permanentAddress ?? ''} required />
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">যোগাযোগ ও শিক্ষা</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="mobilePrimary">মোবাইল নম্বর (প্রধান)</Label>
                    <Input name="mobilePrimary" id="mobilePrimary" placeholder="আপনার প্রধান মোবাইল নম্বর" defaultValue={defaultValues.mobilePrimary ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobileAlternate">বিকল্প মোবাইল নম্বর</Label>
                    <Input name="mobileAlternate" id="mobileAlternate" placeholder="একটি বিকল্প মোবাইল নম্বর" defaultValue={defaultValues.mobileAlternate || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">ইমেইল (যদি থাকে)</Label>
                    <Input name="email" id="email" type="email" placeholder="আপনার ইমেইল ঠিকানা" defaultValue={defaultValues.email || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sscBatch">এসএসসি ব্যাচ</Label>
                    <Input name="sscBatch" id="sscBatch" placeholder="উদাহরণ: ২০০২" defaultValue={defaultValues.sscBatch ?? ''} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="otherEducation">অন্যান্য শিক্ষাগত যোগ্যতা</Label>
                    <Input name="otherEducation" id="otherEducation" placeholder="অন্যান্য যোগ্যতা লিখুন" defaultValue={defaultValues.otherEducation || ''} />
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">পেশাগত তথ্য</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="profession">পেশা</Label>
                    <Input name="profession" id="profession" placeholder="আপনার পেশা লিখুন" defaultValue={defaultValues.profession ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="workplace">কর্মস্থলের নাম ও ঠিকানা (যদি থাকে)</Label>
                    <Input name="workplace" id="workplace" placeholder="কর্মস্থলের বিবরণ" defaultValue={defaultValues.workplace || ''}/>
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">ব্যাংক তথ্য</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="bankName">ব্যাংকের নাম</Label>
                    <Input name="bankName" id="bankName" placeholder="ব্যাংকের নাম" defaultValue={defaultValues.bankName ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="branch">শাখা</Label>
                    <Input name="branch" id="branch" placeholder="শাখার নাম" defaultValue={defaultValues.branch ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accountNumber">একাউন্ট নম্বর</Label>
                    <Input name="accountNumber" id="accountNumber" placeholder="আপনার একাউন্ট নম্বর" defaultValue={defaultValues.accountNumber ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accountType">একাউন্ট টাইপ</Label>
                    <Select name="accountType" defaultValue={defaultValues.accountType ?? ''} required>
                    <SelectTrigger id="accountType">
                        <SelectValue placeholder="একাউন্ট টাইপ নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bankingMethod">ব্যাংকিং মাধ্যম</Label>
                    <Input name="bankingMethod" id="bankingMethod" placeholder="যেমন: অনলাইন ব্যাংকিং, চেক বই" defaultValue={defaultValues.bankingMethod || ''} />
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">উত্তরাধিকারী তথ্য</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="nomineeName">উত্তরাধিকারীর নাম</Label>
                    <Input name="nomineeName" id="nomineeName" placeholder="উত্তরাধিকারীর নাম" defaultValue={defaultValues.nomineeName ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nomineeRelation">সম্পর্ক</Label>
                    <Input name="nomineeRelation" id="nomineeRelation" placeholder="আপনার সাথে সম্পর্ক" defaultValue={defaultValues.nomineeRelation ?? ''} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nomineeMobile">মোবাইল নম্বর</Label>
                    <Input name="nomineeMobile" id="nomineeMobile" placeholder="উত্তরাধিকারীর মোবাইল নম্বর" defaultValue={defaultValues.nomineeMobile ?? ''} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomineeAddress">ঠিকানা</Label>
                    <Textarea name="nomineeAddress" id="nomineeAddress" placeholder="উত্তরাধিকারীর ঠিকানা" defaultValue={defaultValues.nomineeAddress ?? ''} required />
                </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-headline text-xl font-semibold border-b pb-2">প্রয়োজনীয় সংযুক্তি</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="photo">সদ্য তোলা ১ কপি পাসপোর্ট সাইজ ছবি</Label>
                        {defaultValues.photoUrl && <Image src={getValidImageSrc(defaultValues.photoUrl)} alt="Current Photo" width={100} height={100} className="rounded-md border p-1" />}
                        <Input name="photo" id="photo" type="file" required={!defaultValues.photoUrl} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nidCopy">জাতীয় পরিচয়পত্র / জন্ম নিবন্ধনের কপি</Label>
                         {defaultValues.nidCopyUrl && <Image src={getValidImageSrc(defaultValues.nidCopyUrl)} alt="Current NID" width={150} height={100} className="rounded-md border p-1" />}
                        <Input name="nidCopy" id="nidCopy" type="file" required={!defaultValues.nidCopyUrl} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bankStatement">ব্যাংক একাউন্ট তথ্যের প্রমাণ (যদি থাকে)</Label>
                        {defaultValues.bankStatementUrl && <Image src={getValidImageSrc(defaultValues.bankStatementUrl)} alt="Current Bank Statement" width={150} height={100} className="rounded-md border p-1" />}
                        <Input name="bankStatement" id="bankStatement" type="file" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-6">
                <div className="items-top flex space-x-2">
                    <Checkbox id="terms" required />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="terms" className="font-bold">
                        আমি সকল অঙ্গিকারনামা স্বইচ্ছায় স্বীকার করিলাম
                        </Label>
                        <p className="text-sm text-muted-foreground">
                        আমি ঘোষণা করছি যে, উপরের তথ্য সঠিক এবং নির্ভুল। আমি বন্ধন&apos;১৭ এর নীতিমালার সকল শর্তাবলী মান্য করবো এবং সংগঠনের প্রতি বিশ্বস্ত থাকবো।
                        </p>
                    </div>
                </div>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> জমা হচ্ছে...</> : 'আবেদন জমা দিন'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
