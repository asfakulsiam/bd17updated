'use client';

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Info, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Member } from "@/types";
import Image from "next/image";
import { requestProfileUpdate } from "@/lib/actions/members";
import { getValidImageSrc } from "@/lib/utils";

const MAX_FILE_SIZE_KB = 700;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

export function EditClient({ userDetails }: { userDetails: Member }) {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
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
                await requestProfileUpdate(formData);
                setIsSubmitted(true);
                toast({
                    title: "Request Submitted",
                    description: "Your profile update request has been submitted for review.",
                });
            } catch (error) {
                 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
            }
        });
    };
    
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

  return (
    <div className="space-y-8">
        <Button asChild variant="outline">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" /> অ্যাকাউন্টে ফিরে যান
          </Link>
        </Button>

      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">প্রোফাইল সম্পাদনা</CardTitle>
            <CardDescription>আপনার ব্যক্তিগত তথ্য আপডেট করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

            {isSubmitted && (
                <Alert variant="default" className="bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-500/50">
                    <Info className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">পর্যালোচনা অপেক্ষমান</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    আপনার পরিবর্তনগুলি অনুমোদনের জন্য অপেক্ষমান রয়েছে। অনুমোদনের পর তথ্য আপডেট হয়ে যাবে।
                    </AlertDescription>
                </Alert>
            )}
            
            <fieldset disabled={isSubmitted || isPending} className="space-y-8 group">
                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">ব্যক্তিগত তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullNameBn">পূর্ণ নাম (বাংলা)</Label>
                        <Input id="fullNameBn" name="fullNameBn" defaultValue={userDetails.fullNameBn ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fullNameEn">পূর্ণ নাম (ইংরেজি)</Label>
                        <Input id="fullNameEn" name="fullNameEn" defaultValue={userDetails.fullNameEn ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fatherName">পিতার নাম</Label>
                        <Input id="fatherName" name="fatherName" defaultValue={userDetails.fatherName ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="motherName">মাতার নাম</Label>
                        <Input id="motherName" name="motherName" defaultValue={userDetails.motherName ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nid">জাতীয় পরিচয়পত্র নম্বর / জন্ম নিবন্ধন নম্বর</Label>
                        <Input id="nid" name="nid" defaultValue={userDetails.nid ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dob">জন্ম তারিখ</Label>
                        <Input id="dob" name="dob" type="date" defaultValue={formatDateForInput(userDetails.dob)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bloodGroup">রক্তের গ্রুপ</Label>
                        <Select name="bloodGroup" defaultValue={userDetails.bloodGroup ?? ''}>
                        <SelectTrigger id="bloodGroup">
                            <SelectValue />
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
                        <Select name="maritalStatus" defaultValue={userDetails.maritalStatus ?? ''}>
                        <SelectTrigger id="maritalStatus">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="married">বিবাহিত</SelectItem>
                            <SelectItem value="unmarried">অবিবাহিত</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="religion">ধর্ম</Label>
                        <Input id="religion" name="religion" defaultValue={userDetails.religion ?? ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">ঠিকানা</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="currentAddress">বর্তমান ঠিকানা</Label>
                        <Textarea id="currentAddress" name="currentAddress" defaultValue={userDetails.currentAddress ?? ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="permanentAddress">স্থায়ী ঠিকানা</Label>
                        <Textarea id="permanentAddress" name="permanentAddress" defaultValue={userDetails.permanentAddress ?? ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">যোগাযোগ ও শিক্ষা</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="mobilePrimary">মোবাইল নম্বর (প্রধান)</Label>
                        <Input id="mobilePrimary" name="mobilePrimary" defaultValue={userDetails.mobilePrimary ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobileAlternate">বিকল্প মোবাইল নম্বর</Label>
                        <Input id="mobileAlternate" name="mobileAlternate" defaultValue={userDetails.mobileAlternate || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">ইমেইল (যদি থাকে)</Label>
                        <Input id="email" type="email" name="email" defaultValue={userDetails.email || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sscBatch">এসএসসি ব্যাচ</Label>
                        <Input id="sscBatch" name="sscBatch" defaultValue={userDetails.sscBatch ?? ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="otherEducation">অন্যান্য শিক্ষাগত যোগ্যতা</Label>
                        <Input id="otherEducation" name="otherEducation" defaultValue={userDetails.otherEducation || ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">পেশাগত তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="profession">পেশা</Label>
                        <Input id="profession" name="profession" defaultValue={userDetails.profession ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="workplace">কর্মস্থলের নাম ও ঠিকানা (যদি থাকে)</Label>
                        <Input id="workplace" name="workplace" defaultValue={userDetails.workplace || ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">ব্যাংক তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="bankName">ব্যাংকের নাম</Label>
                        <Input id="bankName" name="bankName" defaultValue={userDetails.bankName ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="branch">শাখা</Label>
                        <Input id="branch" name="branch" defaultValue={userDetails.branch ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">একাউন্ট নম্বর</Label>
                        <Input id="accountNumber" name="accountNumber" defaultValue={userDetails.accountNumber ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountType">একাউন্ট টাইপ</Label>
                        <Select name="accountType" defaultValue={userDetails.accountType ?? ''}>
                        <SelectTrigger id="accountType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bankingMethod">ব্যাংকিং মাধ্যম</Label>
                        <Input id="bankingMethod" name="bankingMethod" defaultValue={userDetails.bankingMethod || ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-headline text-xl font-semibold border-b pb-2">উত্তরাধিকারী তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nomineeName">উত্তরাধিকারীর নাম</Label>
                        <Input id="nomineeName" name="nomineeName" defaultValue={userDetails.nomineeName ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nomineeRelation">সম্পর্ক</Label>
                        <Input id="nomineeRelation" name="nomineeRelation" defaultValue={userDetails.nomineeRelation ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nomineeMobile">মোবাইল নম্বর</Label>
                        <Input id="nomineeMobile" name="nomineeMobile" defaultValue={userDetails.nomineeMobile ?? ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="nomineeAddress">ঠিকানা</Label>
                        <Textarea id="nomineeAddress" name="nomineeAddress" defaultValue={userDetails.nomineeAddress ?? ''} />
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2 flex items-center">
                          <ImageIcon className="mr-2" />
                          সংযুক্তি পরিবর্তন করুন
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-start">
                          <div className="space-y-2">
                              <Label>আপনার বর্তমান ছবি</Label>
                              <Image src={getValidImageSrc(userDetails.photoUrl)} alt="Member Photo" width={150} height={150} className="rounded-md border p-1" />
                              <Label htmlFor="photo">নতুন ছবি আপলোড করুন</Label>
                              <Input name="photo" id="photo" type="file" />
                          </div>
                           <div className="space-y-2">
                              <Label>আপনার বর্তমান NID কপি</Label>
                              <Image src={getValidImageSrc(userDetails.nidCopyUrl)} alt="NID Copy" width={240} height={160} className="rounded-md border p-1" />
                              <Label htmlFor="nidCopy">নতুন NID কপি আপলোড করুন</Label>
                              <Input name="nidCopy" id="nidCopy" type="file" />
                          </div>
                           <div className="space-y-2">
                              <Label>আপনার বর্তমান ব্যাংক স্টেটমেন্ট</Label>
                              <Image src={getValidImageSrc(userDetails.bankStatementUrl)} alt="Bank Statement" width={240} height={160} className="rounded-md border p-1" />
                              <Label htmlFor="bankStatement">নতুন ব্যাংক স্টেটমেন্ট আপলোড করুন</Label>
                              <Input name="bankStatement" id="bankStatement" type="file" />
                          </div>
                      </div>
                  </div>
            </fieldset>

            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={isSubmitted || isPending}>
                {isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : (isSubmitted ? 'পর্যালোচনার জন্য জমা দেওয়া হয়েছে' : 'আপডেট অনুরোধ পাঠান')}
            </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
