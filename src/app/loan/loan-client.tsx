

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, FileText, Users, Landmark, Wallet, Ban, BadgeCent } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Loan } from "@/models";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserLoanData, OrgLoanData } from '@/types';
import { addMonths, format } from 'date-fns';


const pageText = {
    bn: {
        title: "লোনের অবস্থা",
        applyForLoan: "ঋণের জন্য আবেদন করুন",
        currentLoanTitle: "আপনার বর্তমান লোন",
        currentLoanDesc: "আপনার বর্তমান লোনের বিস্তারিত তথ্য নিচে দেওয়া হলো।",
        loanAmount: "লোনের পরিমাণ",
        repaidAmount: "পরিশোধিত পরিমাণ",
        dueAmount: "বকেয়া পরিমাণ",
        repaymentProgress: "পরিশোধের অগ্রগতি",
        nextInstallmentDate: "আপনার পরবর্তী কিস্তির তারিখ",
        noActiveLoanTitle: "লোনের আবেদন",
        noActiveLoanDesc: "আপনার কোনো সক্রিয় লোন নেই। প্রয়োজনে ঋণের জন্য আবেদন করতে পারেন।",
        yourMaxLoanable: "আপনার সর্বোচ্চ ঋণ যোগ্যতা",
        yourMaxLoanableDesc: "আপনার মোট সঞ্চয়ের উপর ভিত্তি করে আপনি এই পরিমাণ ঋণ নিতে পারবেন।",
        applicationPending: "আপনার আবেদনটি পর্যালোচনার জন্য অপেক্ষমান।",
        applicationStatusNotice: "আবেদন অনুমোদিত বা বাতিল হলে আপনাকে জানানো হবে।",
        noLoanMessage: "এই মুহূর্তে আপনার কোনো লোন চলমান নেই।",
        applyForNewLoan: "নতুন ঋণের জন্য আবেদন করুন",
        cannotApplyActiveLoan: "আপনার একটি সক্রিয় লোন চলমান থাকায় আপনি নতুন লোনের জন্য আবেদন করতে পারবেন না।",
        yearlyLimitReached: "আপনি এই বছর সর্বোচ্চ সংখ্যক (২টি) লোন গ্রহণ করেছেন। নতুন লোনের জন্য আপনি আগামী বছর আবেদন করতে পারবেন।",
        loanFundStatusTitle: "ফান্ডের বর্তমান অবস্থা",
        loanFundStatusDesc: "সমিতির মোট তহবিল থেকে কত টাকা ঋণ হিসেবে দেওয়া যাবে তার হিসাব।",
        totalFund: "মোট সঞ্চয় তহবিল (ক্যাশ)",
        totalLoanedOut: "মোট ঋণ দেওয়া হয়েছে",
        availableForLoan: "ঋণের জন্য অবশিষ্ট আছে",
        noMoneyLeft: "দুঃখিত, এই মুহূর্তে নতুন ঋণের জন্য কোনো তহবিল উপলব্ধ নেই।",
        currentLoanHolders: "বর্তমান ঋণগ্রহীতাগণ",
        memberName: "সদস্যের নাম",
        loanedAmount: "ঋণের পরিমাণ",
        noLoanHolders: "এই মুহূর্তে কোনো সদস্যের সক্রিয় লোন নেই।",
        loanSystemDisabled: "ঋণ ব্যবস্থা বর্তমানে বন্ধ আছে।",
        loanSystemDisabledDesc: "এই মুহূর্তে নতুন ঋণের আবেদন গ্রহণ করা হচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
        installments: "কিস্তির বিবরণ",
        pastDue: "পূর্বের বকেয়া",
        currentDue: "চলতি মাসের বকেয়া",
        totalDue: "সর্বমোট বকেয়া",
    },
    en: {
        title: "Loan Status",
        applyForLoan: "Apply for Loan",
        currentLoanTitle: "Your Current Loan",
        currentLoanDesc: "Details of your current loan are provided below.",
        loanAmount: "Loan Amount",
        repaidAmount: "Repaid Amount",
        dueAmount: "Due Amount",
        repaymentProgress: "Repayment Progress",
        nextInstallmentDate: "Your next installment date is",
        noActiveLoanTitle: "Loan Application",
        noActiveLoanDesc: "You have no active loans. You can apply for a loan if needed.",
        yourMaxLoanable: "Your Maximum Loanable Amount",
        yourMaxLoanableDesc: "Based on your total savings, you are eligible for this amount.",
        applicationPending: "Your application is pending for review.",
        applicationStatusNotice: "You will be notified once the application is approved or rejected.",
        noLoanMessage: "You do not have any active loans at the moment.",
        applyForNewLoan: "Apply for a new loan",
        cannotApplyActiveLoan: "You cannot apply for a new loan while you have an active one.",
        yearlyLimitReached: "You have reached the maximum number of loans (2) for this year. You can apply for a new loan next year.",
        loanFundStatusTitle: "Fund Status",
        loanFundStatusDesc: "An overview of how much of the total fund is available for loans.",
        totalFund: "Total Savings Fund (Cash)",
        totalLoanedOut: "Total Loaned Out",
        availableForLoan: "Available for Loan",
        noMoneyLeft: "Sorry, there are no funds available for new loans at this moment.",
        currentLoanHolders: "Current Loan Holders",
        memberName: "Member Name",
        loanedAmount: "Loaned Amount",
        noLoanHolders: "There are no members with active loans at this time.",
        loanSystemDisabled: "Loan System Currently Disabled",
        loanSystemDisabledDesc: "New loan applications are not being accepted at this time. Please check back later.",
        installments: "Installment Details",
        pastDue: "Past Due",
        currentDue: "Current Month's Due",
        totalDue: "Total Due",
    }
}

export function LoanClient({ loanData, orgLoanData, settings }: { loanData: UserLoanData, orgLoanData: OrgLoanData, settings: Settings }) {
  const { language } = useLanguage();
  const text = pageText[language];
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const dueAmount = loanData.loanAmount - loanData.repaidAmount;
  const repaidPercentage = loanData.hasLoan ? (loanData.repaidAmount / (loanData.loanAmount || 1)) * 100 : 0;
  
  const totalLoanedOut = orgLoanData.totalLoanedOut;
  const fundsAvailable = orgLoanData.organizationTotalFund > 0;

  const canApplyForLoan = settings.loanSystemEnabled && !loanData.hasLoan && !loanData.applicationPending && loanData.loanApplicationsThisYear < 2 && fundsAvailable;

  const getApplicationDisabledReason = () => {
    if (!settings.loanSystemEnabled) return text.loanSystemDisabled;
    if (loanData.hasLoan) return text.cannotApplyActiveLoan;
    if (loanData.applicationPending) return text.applicationPending;
    if (loanData.loanApplicationsThisYear >= 2) return text.yearlyLimitReached;
    if (!fundsAvailable) return text.noMoneyLeft;
    return null;
  }
  const applicationDisabledReason = getApplicationDisabledReason();


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">{text.title}</h1>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            {loanData.hasLoan ? (
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline">{text.currentLoanTitle}</CardTitle>
                    <CardDescription>
                        {text.currentLoanDesc}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex flex-col p-4 border rounded-lg">
                            <span className="text-sm text-muted-foreground">{text.loanAmount}</span>
                            <span className="text-2xl font-bold text-primary">৳{loanData.loanAmount.toLocaleString(locale)}</span>
                            </div>
                            <div className="flex flex-col p-4 border rounded-lg bg-green-100/50 dark:bg-green-900/20">
                            <span className="text-sm text-muted-foreground">{text.repaidAmount}</span>
                            <span className="text-2xl font-bold text-green-600">৳{loanData.repaidAmount.toLocaleString(locale)}</span>
                            </div>
                            <div className="flex flex-col p-4 border rounded-lg bg-red-100/50 dark:bg-red-900/20">
                            <span className="text-sm text-muted-foreground">{text.dueAmount}</span>
                            <span className="text-2xl font-bold text-red-600">৳{dueAmount.toLocaleString(locale)}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">{text.repaymentProgress}</span>
                                <span className="text-sm font-bold text-primary">{repaidPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={repaidPercentage} className="h-4" />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex flex-col p-4 border rounded-lg bg-red-100/50 dark:bg-red-900/20">
                                <span className="text-sm text-muted-foreground">{text.pastDue}</span>
                                <span className="text-xl font-bold text-red-600">৳{loanData.totalLoanDue.toLocaleString(locale)}</span>
                            </div>
                             <div className="flex flex-col p-4 border rounded-lg bg-yellow-100/50 dark:bg-yellow-900/20">
                                <span className="text-sm text-muted-foreground">{text.currentDue}</span>
                                <span className="text-xl font-bold text-yellow-600">৳{loanData.currentMonthLoanDue.toLocaleString(locale)}</span>
                            </div>
                             <div className="flex flex-col p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground">{text.totalDue}</span>
                                <span className="text-xl font-bold">৳{(loanData.totalLoanDue + loanData.currentMonthLoanDue).toLocaleString(locale)}</span>
                            </div>
                        </div>
                        
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{text.noActiveLoanTitle}</CardTitle>
                        <CardDescription>
                            {text.noActiveLoanDesc}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                            {applicationDisabledReason ? <Ban className="w-16 h-16 text-destructive mb-4" /> : <PiggyBank className="w-16 h-16 text-muted-foreground mb-4" />}
                            
                            {applicationDisabledReason ? (
                                <div className="max-w-md">
                                    <p className="text-xl font-medium text-red-600">{applicationDisabledReason}</p>
                                    {loanData.applicationPending && <p className="text-muted-foreground mt-2">{text.applicationStatusNotice}</p>}
                                </div>
                            ) : (
                                <>
                                    <p className="text-xl font-medium text-muted-foreground">{text.noLoanMessage}</p>
                                    <Button asChild className="mt-6" disabled={!canApplyForLoan}>
                                        <Link href="/loan/apply">
                                            <FileText className="mr-2 h-4 w-4" /> {text.applyForNewLoan}
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!loanData.hasLoan && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center"><BadgeCent className="mr-2 text-primary"/>{text.yourMaxLoanable}</CardTitle>
                        <CardDescription>{text.yourMaxLoanableDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold text-center text-primary p-4 bg-primary/10 rounded-lg">
                            ৳{loanData.maxLoanableAmount.toLocaleString(locale)}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Landmark className="mr-2 text-primary"/>{text.loanFundStatusTitle}</CardTitle>
                    <CardDescription>{text.loanFundStatusDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text.totalFund}:</span><span className="font-semibold">৳{orgLoanData.organizationTotalFund.toLocaleString(locale)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{text.totalLoanedOut}</span><span className="font-semibold">৳{totalLoanedOut.toLocaleString(locale)}</span></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Users className="mr-2 text-primary"/>{text.currentLoanHolders}</CardTitle>
                </CardHeader>
                <CardContent>
                    {orgLoanData.activeLoans.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{text.memberName}</TableHead>
                                    <TableHead className="text-right">{text.loanedAmount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orgLoanData.activeLoans.map((loan, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{loan.member.fullNameEn}</TableCell>
                                        <TableCell className="text-right">৳{loan.amount.toLocaleString(locale)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Wallet className="w-12 h-12 mb-4" />
                            <p>{text.noLoanHolders}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
