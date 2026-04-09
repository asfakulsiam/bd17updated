
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Edit, FileText, Banknote, Landmark, UserCheck, Heart, Phone, Mail, GraduationCap, Briefcase, MapPin, Info, Image as ImageIcon, UserPlus, AlertCircle, ArrowRight, Library, Users2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "@/contexts/auth-context";
import { useUserDetails } from "@/hooks/use-members";
import type { UserDetailsData } from "@/types";
import { getValidImageSrc } from "@/lib/utils";

const InfoRow = ({ label, value, icon }: { label: string, value: string | undefined | null, icon?: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row items-start py-3">
        <div className="flex items-center w-full md:w-56 text-muted-foreground mb-1 md:mb-0">
            {icon && <span className="mr-2 min-w-4">{icon}</span>}
            <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex-1 font-semibold text-base md:text-sm break-words">{value || 'N/A'}</div>
    </div>
);

const AccountPageSkeleton = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full aspect-square rounded-lg" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-5/6" />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-9 w-full" />
                </CardFooter>
            </Card>
        </div>
        <Card className="md:col-span-2">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6 divide-y">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="py-4 first:border-t">
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
);


export function AccountClient() {
  const { user, isLoading: authLoading } = useSession();
  const { data: userDetails, isLoading, isError } = useUserDetails(user?.id);
  const { language } = useLanguage();

  const text = {
    bn: {
      title: "আমার অ্যাকাউন্ট",
      editProfile: "প্রোফাইল সম্পাদনা",
      edit: "সম্পাদনা",
      pendingRegistrationTitle: "আবেদন পর্যালোচনার অধীনে আছে",
      pendingRegistrationDesc: "আপনার নিবন্ধন আবেদনটি পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর আপনি আপনার সম্পূর্ণ প্রোফাইল দেখতে পারবেন।",
      awaitingRegistrationTitle: "নিবন্ধন সম্পন্ন করুন",
      awaitingRegistrationDesc: "বন্ধন'১৭ এর সদস্য হয়ে আমাদের সকল সুবিধা উপভোগ করতে এখনই আপনার বিস্তারিত তথ্য দিয়ে নিবন্ধন সম্পন্ন করুন।",
      rejectedRegistrationTitle: "আপনার আবেদনটি বাতিল করা হয়েছে",
      rejectedRegistrationDesc: "দুঃখিত, আপনার আবেদনটি পর্যালোচনার পর বাতিল করা হয়েছে। কারণ:",
      resubmitApplication: "পুনরায় আবেদন করুন",
      memberDetailsTitle: "সদস্যের বিস্তারিত তথ্য",
      memberDetailsDesc: "আপনার নিবন্ধন তথ্য নিচে দেখানো হলো।",
      personalInfo: "ব্যক্তিগত তথ্য",
      fullNameBn: "পূর্ণ নাম (বাংলা)",
      fullNameEn: "পূর্ণ নাম (ইংরেজি)",
      fatherName: "পিতার নাম",
      motherName: "মাতার নাম",
      nid: "NID/জন্ম নিবন্ধন",
      dob: "জন্ম তারিখ",
      bloodGroup: "রক্তের গ্রুপ",
      maritalStatus: "বৈবাহিক অবস্থা",
      religion: "ধর্ম",
      memberId: "সদস্য আইডি",
      joiningDate: "যোগদানের তারিখ",
      addressInfo: "ঠিকানা",
      currentAddress: "বর্তমান ঠিকানা",
      permanentAddress: "স্থায়ী ঠিকানা",
      contactAndEdu: "যোগাযোগ ও শিক্ষা",
      mobilePrimary: "মোবাইল (প্রধান)",
      mobileAlternate: "মোবাইল (বিকল্প)",
      email: "ইমেইল",
      sscBatch: "এসএসসি ব্যাচ",
      otherEdu: "অন্যান্য যোগ্যতা",
      professionalInfo: "পেশাগত তথ্য",
      profession: "পেশা",
      workplace: "কর্মস্থল",
      bankInfo: "ব্যাংক তথ্য",
      bankName: "ব্যাংকের নাম",
      branch: "শাখা",
      accountNumber: "একাউন্ট নম্বর",
      accountType: "একাউন্ট টাইপ",
      bankingMethod: "ব্যাংকিং মাধ্যম",
      nomineeInfo: "উত্তরাধিকারী তথ্য",
      nomineeName: "উত্তরাধিকারীর নাম",
      nomineeRelation: "সম্পর্ক",
      nomineeMobile: "মোবাইল নম্বর",
      nomineeAddress: "ঠিকানা",
      attachments: "প্রয়োজনীয় সংযুক্তি",
      yourPhoto: "আপনার ছবি",
      nidCopy: "জাতীয় পরিচয়পত্র / জন্ম নিবন্ধনের কপি",
      bankStatement: "ব্যাংক একাউন্ট তথ্যের প্রমাণ",
      registerNow: "নিবন্ধন করুন",
      pleaseLogIn: "দয়া করে লগ ইন করুন",
      logInPrompt: "আপনার অ্যাকাউন্টের বিবরণ দেখতে আপনাকে লগ ইন করতে হবে।",
      signIn: "সাইন ইন করুন",
      myExtraMembers: "আমার অতিরিক্ত সদস্য",
      manageExtraMembers: "অতিরিক্ত সদস্য ব্যবস্থাপনা করুন",
      primaryMember: "প্রাথমিক সদস্য",
      additionalMembers: "অতিরিক্ত সদস্য",
      noAdditionalMembers: "আপনার কোনো অতিরিক্ত সদস্য নেই।",
      errorLoading: "সদস্যের তথ্য লোড করতে একটি ত্রুটি হয়েছে।",
    },
    en: {
      title: "My Account",
      editProfile: "Edit Profile",
      edit: "Edit",
      pendingRegistrationTitle: "Application Under Review",
      pendingRegistrationDesc: "Your registration application has been submitted for review. You will be able to see your full profile after it is approved.",
      awaitingRegistrationTitle: "Complete Your Registration",
      awaitingRegistrationDesc: "Become a member of Bondhon17 to enjoy all our benefits. Complete your registration now by providing your details.",
      rejectedRegistrationTitle: "Your Application Was Rejected",
      rejectedRegistrationDesc: "Sorry, your application was rejected after review. Reason:",
      resubmitApplication: "Resubmit Application",
      memberDetailsTitle: "Member Details",
      memberDetailsDesc: "Your registration information is shown below.",
      personalInfo: "Personal Information",
      fullNameBn: "Full Name (Bangla)",
      fullNameEn: "Full Name (English)",
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      nid: "NID/Birth Certificate",
      dob: "Date of Birth",
      bloodGroup: "Blood Group",
      maritalStatus: "Marital Status",
      religion: "Religion",
      memberId: "Member ID",
      joiningDate: "Joining Date",
      addressInfo: "Address",
      currentAddress: "Current Address",
      permanentAddress: "Permanent Address",
      contactAndEdu: "Contact & Education",
      mobilePrimary: "Mobile (Primary)",
      mobileAlternate: "Mobile (Alternate)",
      email: "Email",
      sscBatch: "SSC Batch",
      otherEdu: "Other Qualifications",
      professionalInfo: "Professional Information",
      profession: "Profession",
      workplace: "Workplace",
      bankInfo: "Bank Information",
      bankName: "Bank Name",
      branch: "Branch",
      accountNumber: "Account Number",
      accountType: "Account Type",
      bankingMethod: "Banking Method",
      nomineeInfo: "Nominee Information",
      nomineeName: "Nominee's Name",
      nomineeRelation: "Relation",
      nomineeMobile: "Mobile Number",
      nomineeAddress: "Address",
      attachments: "Required Attachments",
      yourPhoto: "Your Photo",
      nidCopy: "Copy of NID/Birth Certificate",
      bankStatement: "Proof of Bank Account Information",
      registerNow: "Register Now",
      pleaseLogIn: "Please Log In",
      logInPrompt: "You need to be logged in to view your account details.",
      signIn: "Sign In",
      myExtraMembers: "My Extra Members",
      manageExtraMembers: "Manage Extra Members",
      primaryMember: "Primary Member",
      additionalMembers: "Additional Members",
      noAdditionalMembers: "You have no additional members.",
      errorLoading: "An error occurred while loading member details.",
    }
  }

  const pageContent = text[language];

  if (authLoading || (user && isLoading)) {
    return <AccountPageSkeleton />;
  }

  if (!user) {
    return (
         <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
          <div className="bg-primary/10 p-6 rounded-full">
            <UserPlus className="w-16 h-16 text-primary" />
          </div>
          <h1 className="font-headline text-3xl font-bold">{pageContent.pleaseLogIn}</h1>
          <p className="text-muted-foreground max-w-md">
            {pageContent.logInPrompt}
          </p>
          <Button asChild size="lg">
            <Link href="/sign-in">
              {pageContent.signIn}
            </Link>
          </Button>
      </div>
    )
  }

  if (isError) {
      return (
            <div className="flex items-center justify-center p-8 text-center">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{pageContent.errorLoading}</AlertDescription>
                </Alert>
            </div>
        )
  }

  const member = userDetails?.details;

  if (!member || member.status === 'AwaitingRegistration') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
          <div className="bg-primary/10 p-6 rounded-full">
            <UserPlus className="w-16 h-16 text-primary" />
          </div>
          <h1 className="font-headline text-3xl font-bold">{pageContent.awaitingRegistrationTitle}</h1>
          <p className="text-muted-foreground max-w-md">
            {pageContent.awaitingRegistrationDesc}
          </p>
          <Button asChild size="lg">
            <Link href="/registration">
              {pageContent.registerNow}
            </Link>
          </Button>
      </div>
    )
  }
  
  if (member?.status === 'Pending') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
        <div className="bg-yellow-100/50 dark:bg-yellow-900/20 p-6 rounded-full">
          <Info className="w-16 h-16 text-yellow-600" />
        </div>
        <h1 className="font-headline text-3xl font-bold">{pageContent.pendingRegistrationTitle}</h1>
        <p className="text-muted-foreground max-w-md">
          {pageContent.pendingRegistrationDesc}
        </p>
      </div>
    )
  }
  
  if (member?.status === 'Rejected') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
        <div className="bg-destructive/10 p-6 rounded-full">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="font-headline text-3xl font-bold text-destructive">{pageContent.rejectedRegistrationTitle}</h1>
        <p className="text-muted-foreground max-w-md">
          {pageContent.rejectedRegistrationDesc}
          <span className="font-semibold block mt-2 text-foreground">{member.rejectionReason || "No reason provided."}</span>
        </p>
        <Button asChild size="lg">
            <Link href="/registration">
              {pageContent.resubmitApplication}
            </Link>
        </Button>
      </div>
    )
  }
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        return new Date(d.valueOf() + d.getTimezoneOffset() * 60000).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US');
    } catch (e) {
        return 'N/A';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="font-headline text-3xl font-bold">{pageContent.title}</h1>
        <Button asChild size="sm">
          <Link href="/account/edit">
            <Edit className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{pageContent.editProfile}</span>
            <span className="sm:hidden">{pageContent.edit}</span>
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center">
                        <ImageIcon className="mr-2 text-primary" />
                        {pageContent.yourPhoto}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Image 
                        src={getValidImageSrc(member.photoUrl)}
                        alt="User Photo" 
                        width={300} 
                        height={300} 
                        className="rounded-lg object-cover w-full aspect-square"
                        data-ai-hint="portrait professional"
                    />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center">
                        <Users2 className="mr-2 text-primary" />
                        {pageContent.myExtraMembers}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{pageContent.primaryMember}</h4>
                        <p className="font-semibold">{member.fullNameEn}</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{pageContent.additionalMembers} ({member.shares?.length || 0})</h4>
                        {member.shares && member.shares.length > 0 ? (
                            <ul className="list-disc pl-5 text-sm">
                                {member.shares.map(share => (
                                    <li key={share.id} className="font-semibold">{share.sharerName}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">{pageContent.noAdditionalMembers}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/account/shares">
                           {pageContent.manageExtraMembers} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>

         <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{pageContent.memberDetailsTitle}</CardTitle>
                <CardDescription>{pageContent.memberDetailsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><User className="mr-2 text-primary" />{pageContent.personalInfo}</h3>
                    <InfoRow label={pageContent.fullNameBn} value={member.fullNameBn} />
                    <InfoRow label={pageContent.fullNameEn} value={member.fullNameEn} />
                    <InfoRow label={pageContent.fatherName} value={member.fatherName} />
                    <InfoRow label={pageContent.motherName} value={member.motherName} />
                    <InfoRow label={pageContent.nid} value={member.nid} icon={<FileText className="w-4 h-4"/>} />
                    <InfoRow label={pageContent.dob} value={formatDate(member.dob)} />
                    <InfoRow label={pageContent.bloodGroup} value={member.bloodGroup} icon={<Heart className="w-4 h-4"/>} />
                    <InfoRow label={pageContent.maritalStatus} value={member.maritalStatus} />
                    <InfoRow label={pageContent.religion} value={member.religion} />
                    <InfoRow label={pageContent.memberId} value={member.id} />
                     <InfoRow label={pageContent.joiningDate} value={formatDate(member.joiningDate)} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><MapPin className="mr-2 text-primary" />{pageContent.addressInfo}</h3>
                    <InfoRow label={pageContent.currentAddress} value={member.currentAddress} />
                    <InfoRow label={pageContent.permanentAddress} value={member.permanentAddress} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><Phone className="mr-2 text-primary" />{pageContent.contactAndEdu}</h3>
                    <InfoRow label={pageContent.mobilePrimary} value={member.mobilePrimary} />
                    <InfoRow label={pageContent.mobileAlternate} value={member.mobileAlternate} />
                    <InfoRow label={pageContent.email} value={member.email} icon={<Mail className="w-4 h-4"/>} />
                    <InfoRow label={pageContent.sscBatch} value={member.sscBatch} icon={<GraduationCap className="w-4 h-4"/>} />
                    <InfoRow label={pageContent.otherEdu} value={member.otherEducation} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><Briefcase className="mr-2 text-primary" />{pageContent.professionalInfo}</h3>
                    <InfoRow label={pageContent.profession} value={member.profession} />
                    <InfoRow label={pageContent.workplace} value={member.workplace} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><Landmark className="mr-2 text-primary" />{pageContent.bankInfo}</h3>
                    <InfoRow label={pageContent.bankName} value={member.bankName} />
                    <InfoRow label={pageContent.branch} value={member.branch} />
                    <InfoRow label={pageContent.accountNumber} value={member.accountNumber} />
                    <InfoRow label={pageContent.accountType} value={member.accountType} />
                    <InfoRow label={pageContent.bankingMethod} value={member.bankingMethod} />
                </div>
                <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><UserCheck className="mr-2 text-primary" />{pageContent.nomineeInfo}</h3>
                    <InfoRow label={pageContent.nomineeName} value={member.nomineeName} />
                    <InfoRow label={pageContent.nomineeRelation} value={member.nomineeRelation} />
                    <InfoRow label={pageContent.nomineeMobile} value={member.nomineeMobile} />
                    <InfoRow label={pageContent.nomineeAddress} value={member.nomineeAddress} />
                </div>
                 <div className="py-4">
                    <h3 className="font-headline text-lg font-semibold mb-2 flex items-center"><ImageIcon className="mr-2 text-primary" />{pageContent.attachments}</h3>
                    <div className="grid grid-cols-1 gap-4 pt-2">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">{pageContent.nidCopy}</h4>
                             <Image 
                                src={getValidImageSrc(member.nidCopyUrl)}
                                alt="NID/Birth Certificate" 
                                width={600} 
                                height={400} 
                                className="rounded-lg object-contain w-full border"
                                data-ai-hint="document certificate"
                            />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">{pageContent.bankStatement}</h4>
                            <Image 
                                src={getValidImageSrc(member.bankStatementUrl)}
                                alt="Bank Statement" 
                                width={600} 
                                height={400} 
                                className="rounded-lg object-contain w-full border"
                                data-ai-hint="document bank statement"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
