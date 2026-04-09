
'use client';

import { useState, useMemo, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, CheckCircle, HandCoins, PiggyBank, Landmark, CalendarHeart, ArrowLeft, Star } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemberDetailsData, Settings, PaymentAccount, Event, TransactionType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth } from 'date-fns';
import { useSubmitManualPayment } from "@/hooks/use-transactions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { makePaymentForMember } from "@/lib/actions/transactions";
import { useRouter } from "next/navigation";
import Link from "next/link";


const pageText = {
  bn: {
    title: "পেমেন্ট করুন",
    description: "আপনার প্রয়োজনীয় পেমেন্ট সম্পন্ন করুন।",
    selectPaymentType: "পেমেন্টের ধরন নির্বাচন করুন",
    savingsTitle: "মাসিক সঞ্চয়",
    loanTitle: "লোন পরিশোধ",
    specialSavingsTitle: "স্পেশাল সঞ্চয়",
    otherTitle: "অন্যান্য পেমেন্ট",
    eventTitle: "ইভেন্ট পেমেন্ট",
    amount: "টাকার পরিমাণ (BDT)",
    pendingTitle: "আপনার পেমেন্ট অনুরোধটি পর্যালোচনার জন্য জমা দেওয়া হয়েছে",
    pendingDescription: "অ্যাডমিন কর্তৃক অনুমোদনের পর আপনার ব্যালেন্স আপডেট করা হবে।",
    goToHistory: "লেনদেনের ইতিহাসে যান",
    loanRepaymentDesc: "আপনার বকেয়া লোন থেকে কিস্তি পরিশোধ করুন।",
    specialSavingsDesc: "এটি সরাসরি আপনার সঞ্চয় তহবিলে জমা হবে। এটি কোনো মাসিক বকেয়া বা অগ্রিমের সাথে সমন্বয় করা হবে না।",
    loanAmount: "পরিশোধের পরিমাণ",
    otherPaymentDesc: "ইভেন্ট বা অন্য কোনো বিশেষ কারণে পেমেন্ট করুন।",
    paymentReason: "পেমেন্টের কারণ",
    savingsDesc: "আপনার মাসিক সঞ্চয় জমা দিন।",
    manualInfo: "নিচের ফর্মটি পূরণ করে আপনার পেমেন্টের তথ্য জমা দিন।",
    paymentService: "সার্ভিস",
    selectService: "সার্ভিস নির্বাচন করুন",
    transactionId: "ট্রানজেকশন আইডি (TxID)",
    senderNumber: "আপনার নম্বর",
    submitForReview: "অনুমোদনের জন্য জমা দিন",
    selectPaymentAccount: "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন",
    noAccountsConfigured: "কোনো পেমেন্ট অ্যাকাউন্ট কনফিগার করা হয়নি।",
    paymentForMonth: "কোন মাসের জন্য পেমেন্ট করছেন?",
    paid: "পরিশোধিত",
    pastDue: "পূর্বের বকেয়া",
    currentMonthsSavings: "চলতি মাসের সঞ্চয়",
    primaryMember: "প্রাথমিক সদস্য",
    extraMember: "অতিরিক্ত সদস্য",
    advanceBalance: "অগ্রিম ব্যালেন্স",
    totalPayable: "সর্বমোট পরিশোধযোগ্য",
    shareInfoTitle: "অতিরিক্ত সদস্যের তথ্য",
    shareInfoDesc: "You need to pay an additional ৳{amount} for your {count} extra member(s).",
    payingFor: "এর জন্য পেমেন্ট করছেন",
    totalDueSummary: "সর্বমোট বকেয়া",
    totalCurrentDueSummary: "চলতি মাসের মোট দেয়",
    customAmount: "কাস্টম পরিমাণ",
    paymentDetails: "পেমেন্টের বিবরণ",
    totalDue: "মোট বকেয়া",
    due: "বকেয়া",
    current: "চলতি",
    advance: "অগ্রিম",
    breakdownTitle: "সদস্য ভিত্তিক বিস্তারিত দেখুন",
    totalOutstandingHelp: "আপনার মোট বকেয়া (অতীত + বর্তমান): ৳{total}",
    recordPayment: "পেমেন্ট রেকর্ড করুন",
    recordingPayment: "রেকর্ড করা হচ্ছে...",
    paymentRecorded: "পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে",
    paymentRecordedDesc: "এই পেমেন্টটি এখন সদস্যের লেনদেনের ইতিহাসে প্রদর্শিত হবে।",
    backToMember: "সদস্যের বিবরণে ফিরে যান"
  },
  en: {
    title: "Make a Payment",
    description: "Complete your required payments.",
    selectPaymentType: "Select a payment type",
    savingsTitle: "Monthly Savings",
    loanTitle: "Loan Repayment",
    specialSavingsTitle: "Special Savings",
    otherTitle: "Other Payment",
    eventTitle: "Event Payment",
    amount: "Amount (BDT)",
    pendingTitle: "Your payment request has been submitted for review",
    pendingDescription: "Your balance will be updated after an admin approves it.",
    goToHistory: "Go to Transaction History",
    loanRepaymentDesc: "Repay installments from your outstanding loan.",
    specialSavingsDesc: "This will be added directly to your savings pot. It will not settle any monthly dues or advance balance.",
    loanAmount: "Repayment Amount",
    otherPaymentDesc: "Make payments for events or other special reasons.",
    paymentReason: "Reason for Payment",
    savingsDesc: "Submit your monthly savings.",
    manualInfo: "Submit your payment information by filling out the form below.",
    paymentService: "Service",
    selectService: "Select Service",
    transactionId: "Transaction ID (TxID)",
    senderNumber: "Your Number",
    submitForReview: "Submit for Approval",
    selectPaymentAccount: "Select a Payment Account",
    noAccountsConfigured: "No payment accounts configured.",
    paymentForMonth: "For which month are you paying?",
    paid: "Paid",
    pastDue: "Past Dues",
    currentMonthsSavings: "Current Month's Savings",
    advanceBalance: "Advance Balance",
    totalPayable: "Total Payable",
    shareInfoTitle: "Extra Member Information",
    shareInfoDesc: "You need to pay an additional ৳{amount} for your {count} extra member(s).",
    payingFor: "Paying for",
    totalDueSummary: "Total Past Due",
    totalCurrentDueSummary: "Total Current Due",
    customAmount: "Custom Amount",
    paymentDetails: "Payment Breakdown",
    totalDue: "Total Due",
    due: "Due",
    current: "Current",
    advance: "Advance",
    breakdownTitle: "View Breakdown by Member",
    totalOutstandingHelp: "Your total outstanding (past + current): ৳{total}",
    recordPayment: "Record Payment",
    recordingPayment: "Recording...",
    paymentRecorded: "Payment Successfully Recorded",
    paymentRecordedDesc: "This payment will now appear in the member's transaction history.",
    backToMember: "Back to Member Details"
  }
};


export function PaymentClient({ initialUserDetails, paymentAccounts, activeEvents, settings, isAdminView }: { initialUserDetails: MemberDetailsData, paymentAccounts: PaymentAccount[], activeEvents: Event[], settings: Settings, isAdminView: boolean }) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | string>('');
    const [paymentType, setPaymentType] = useState<string>('MONTHLY_SAVINGS');
    
    const router = useRouter();
    const { language } = useLanguage();
    const { toast } = useToast();
    
    const text = pageText[language];
    const locale = language === 'bn' ? 'bn-BD' : 'en-US';
    
    const submitPaymentMutation = useSubmitManualPayment();
    const [isPending, startTransition] = useState(false);

    const { financials, details } = initialUserDetails;
    const { advanceBalance = 0, entityLedgers = {} } = financials;
    const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM');

    const { correctTotalDue, correctCurrentDue, availableMonths, aggregatedMonthlyBreakdown } = useMemo(() => {
        let totalDue = 0;
        let currentDue = 0;
        const monthlyData: Record<string, { expected: number; paid: number }> = {};

        Object.values(entityLedgers).forEach(ledger => {
            Object.entries(ledger.breakdown).forEach(([monthKey, data]) => {
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { expected: 0, paid: 0 };
                }
                monthlyData[monthKey].expected += data.expected;
                monthlyData[monthKey].paid += data.paid;
            });
        });

        Object.entries(monthlyData).forEach(([monthKey, data]) => {
            const deficit = data.expected - data.paid;
            if (deficit > 0) {
                if (monthKey < currentMonthKey) {
                    totalDue += deficit;
                } else if (monthKey === currentMonthKey) {
                    currentDue += deficit;
                }
            }
        });

        const months = Object.keys(monthlyData)
            .filter(key => (monthlyData[key].expected - monthlyData[key].paid) > 0 && key <= currentMonthKey)
            .sort()
            .map(key => ({
                value: key,
                label: new Date(`${key}-02`).toLocaleString(locale, { month: 'long', year: 'numeric' })
            }));

        return {
            correctTotalDue: totalDue,
            correctCurrentDue: currentDue,
            availableMonths: months,
            aggregatedMonthlyBreakdown: monthlyData
        };
    }, [entityLedgers, currentMonthKey, locale]);
    
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const hasDues = correctTotalDue > 0 || correctCurrentDue > 0;

    const totalPayable = useMemo(() => {
        return Math.max(0, correctTotalDue + correctCurrentDue - advanceBalance);
    }, [correctTotalDue, correctCurrentDue, advanceBalance]);

    const loanRepaymentAmount = useMemo(() => {
        if (!initialUserDetails.financials.activeLoan || !initialUserDetails.loans[0]?.repaymentPeriod) return 0;
        return Math.ceil(initialUserDetails.financials.activeLoan / initialUserDetails.loans[0].repaymentPeriod);
    }, [initialUserDetails.financials.activeLoan, initialUserDetails.loans]);


    useEffect(() => {
      if (paymentType === 'MONTHLY_SAVINGS') {
        let defaultAmount = 0;
        if (selectedMonth) {
          const monthData = aggregatedMonthlyBreakdown[selectedMonth];
          if (monthData) {
            defaultAmount = monthData.expected - monthData.paid;
          }
        } else {
            defaultAmount = correctCurrentDue;
        }

        if (amount === '' || Number(amount) === 0) {
            setAmount(defaultAmount > 0 ? defaultAmount : '');
        }

      } else if (paymentType === 'LOAN_REPAYMENT') {
        if (amount === '' || Number(amount) === 0) {
          setAmount(loanRepaymentAmount);
        }
      } else if (paymentType.startsWith('EVENT_')) {
        const eventId = paymentType.split('_')[1];
        const event = activeEvents.find(e => e.id === eventId);
        if (amount === '' || Number(amount) === 0) {
          setAmount(event?.amount || '');
        }
      } else if (paymentType === 'SPECIAL_SAVINGS') {
          // No default amount for special savings
      }
    }, [selectedMonth, paymentType, aggregatedMonthlyBreakdown, settings, details.shares, loanRepaymentAmount, activeEvents, amount, correctCurrentDue, totalPayable]);

    const handleMonthSelect = (monthKey: string) => {
        setSelectedMonth(monthKey);
    };
    
    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const formData = new FormData(event.currentTarget);
        
        if (!selectedAccountId) {
            toast({ title: text.selectPaymentAccount, variant: "destructive"});
            return;
        }

        if (paymentType === 'MONTHLY_SAVINGS' && hasDues && !selectedMonth && !isAdminView) {
            toast({ title: "Month Selection Required", description: "Please select which month you are paying for.", variant: "destructive"});
            return;
        }
        
        if (paymentType === 'SPECIAL_SAVINGS' && !formData.get('reason')) {
            toast({ title: "Reason Required", description: "Please specify why you are making this special savings deposit.", variant: "destructive"});
            return;
        }

        if (isAdminView) {
            startTransition(true);
            formData.set('amount-display', String(amount));
             if (selectedMonth) {
                formData.set('paymentForMonth', selectedMonth);
             }
             if (paymentType.startsWith('EVENT_')) {
                 formData.set('eventId', paymentType.split('_')[1]);
                 formData.set('type', 'OTHER');
             } else {
                formData.set('type', paymentType);
             }
             formData.set('service', paymentAccounts.find(p => p.id === selectedAccountId)?.accountName || 'Unknown');
            
            makePaymentForMember(details.id, formData).then(() => {
                setIsSubmitted(true);
                toast({ title: "Payment Recorded", description: `Payment has been successfully recorded for ${details.fullNameEn}.` });
            }).catch(error => {
                toast({ title: "Error", description: (error as Error).message, variant: "destructive"});
            }).finally(() => {
                startTransition(false);
            });

        } else {
            const transactionId = formData.get('transactionId') as string;
            const senderNumber = formData.get('senderNumber') as string;
            const reason = formData.get('reason') as string | null;

            if (!transactionId || !senderNumber) {
                toast({ title: "Transaction ID and Sender Number are required.", variant: "destructive"});
                return;
            }

            submitPaymentMutation.mutate({
                amount: Number(amount),
                type: paymentType as TransactionType,
                paymentMethod: paymentAccounts.find(p => p.id === selectedAccountId)?.accountName,
                transactionId,
                senderNumber,
                service: paymentAccounts.find(p => p.id === selectedAccountId)?.accountName,
                paymentForMonth: selectedMonth || null,
                reason,
                shareId: null,
            }, {
                onSuccess: () => {
                    setIsSubmitted(true);
                }
            });
        }
    }

    if (isSubmitted) {
         return (
            <div className="max-w-lg mx-auto space-y-6 text-center">
               <div className="flex flex-col items-center justify-center p-12 bg-green-50/50 dark:bg-green-900/10 rounded-lg border">
                   <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
                    <h2 className="font-headline text-2xl font-bold text-green-700 dark:text-green-300">
                       {isAdminView ? text.paymentRecorded : text.pendingTitle}
                   </h2>
                    <p className="text-muted-foreground mt-2 max-w-md">
                       {isAdminView ? text.paymentRecordedDesc : text.pendingDescription}
                    </p>
               </div>
                 <Button asChild className="w-full text-lg py-6" onClick={() => isAdminView ? router.push(`/admin/members/${details.id}`) : router.push('/transactions')}>
                   <Link href={isAdminView ? `/admin/members/${details.id}` : '/transactions'}>
                       {isAdminView ? text.backToMember : text.goToHistory}
                   </Link>
               </Button>
            </div>
       );
    }
    
    const selectedAccount = paymentAccounts.find(p => p.id === selectedAccountId);

    const isSubmitting = isPending || submitPaymentMutation.isPending;

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">{text.title} {isAdminView ? `- ${details.fullNameEn}` : ''}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleFormSubmit}>
                <div className="space-y-6">

                     <div className="space-y-2">
                        <Label htmlFor="paymentType">{text.selectPaymentType}</Label>
                        <Select value={paymentType} onValueChange={setPaymentType}>
                            <SelectTrigger id="paymentType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY_SAVINGS"><div className="flex items-center"><PiggyBank className="mr-2 h-4 w-4" /> {text.savingsTitle}</div></SelectItem>
                                {initialUserDetails.financials.activeLoan > 0 && <SelectItem value="LOAN_REPAYMENT"><div className="flex items-center"><Landmark className="mr-2 h-4 w-4" /> {text.loanTitle}</div></SelectItem>}
                                {settings.specialSavingsEnabled && <SelectItem value="SPECIAL_SAVINGS"><div className="flex items-center"><Star className="mr-2 h-4 w-4" /> {text.specialSavingsTitle}</div></SelectItem>}
                                {activeEvents.map(event => {
                                    const isPaid = details.paidEventIds?.includes(event.id);
                                    return <SelectItem key={event.id} value={`EVENT_${event.id}`} disabled={isPaid}><div className="flex items-center"><CalendarHeart className="mr-2 h-4 w-4" /> {event.name} {isPaid ? `(${text.paid})` : ''}</div></SelectItem>
                                })}
                                <SelectItem value="OTHER"><div className="flex items-center"><HandCoins className="mr-2 h-4 w-4" /> {text.otherTitle}</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentType === 'MONTHLY_SAVINGS' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-red-50 dark:bg-red-900/20">
                                <CardHeader className="p-4 pb-0"><CardTitle className="text-sm text-red-700 dark:text-red-300">{text.pastDue}</CardTitle></CardHeader>
                                <CardContent className="p-4"><p className="text-2xl font-bold text-red-600 dark:text-red-400">৳{correctTotalDue.toLocaleString(locale)}</p></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="p-4 pb-0"><CardTitle className="text-sm text-muted-foreground">{text.currentMonthsSavings}</CardTitle></CardHeader>
                                <CardContent className="p-4"><p className="text-2xl font-bold">৳{correctCurrentDue.toLocaleString(locale)}</p></CardContent>
                            </Card>
                            <Card className="bg-green-50 dark:bg-green-900/20">
                                <CardHeader className="p-4 pb-0"><CardTitle className="text-sm text-green-700 dark:text-green-300">{text.advanceBalance}</CardTitle></CardHeader>
                                <CardContent className="p-4"><p className="text-2xl font-bold text-green-600 dark:text-green-400">৳{advanceBalance.toLocaleString(locale)}</p></CardContent>
                            </Card>
                            </div>

                            <div className="p-4 border-2 border-primary/50 rounded-lg bg-primary/10 text-center">
                                <Label className="text-lg font-semibold">{text.totalPayable}</Label>
                                <p className="text-4xl font-bold text-primary">৳{totalPayable.toLocaleString(locale)}</p>
                            </div>
                            
                             <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="item-1">
                                <AccordionTrigger>{text.breakdownTitle}</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                  {entityLedgers && Object.keys(entityLedgers).length > 0 ? (
                                    Object.entries(entityLedgers).map(([entityId, ledger]: [string, any]) => {
                                      let entityDue = 0;
                                      let entityCurrent = 0;
                                      if(ledger.breakdown){
                                          Object.entries(ledger.breakdown).forEach(([monthKey, data]: [string, any]) => {
                                            const deficit = data.expected - data.paid;
                                            if(deficit > 0) {
                                              if (monthKey < currentMonthKey) entityDue += deficit;
                                              if (monthKey === currentMonthKey) entityCurrent += deficit;
                                            }
                                          });
                                      }
                                      return (
                                        <div key={entityId} className="flex justify-between items-center p-2 border rounded-md text-sm">
                                          <p className="font-semibold">{ledger.name}</p>
                                          <div className="flex gap-4">
                                            <p><span className="text-muted-foreground">{text.due}: </span><span className={cn(entityDue > 0 && "text-red-500 font-bold")}>৳{entityDue.toLocaleString(locale)}</span></p>
                                            <p><span className="text-muted-foreground">{text.current}: </span><span>৳{entityCurrent.toLocaleString(locale)}</span></p>
                                            <p><span className="text-muted-foreground">{text.advance}: </span><span className={cn(ledger.advance > 0 && "text-green-500 font-bold")}>৳{ledger.advance.toLocaleString(locale)}</span></p>
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <p className="text-muted-foreground text-sm">{language === 'bn' ? "কোনো তথ্য পাওয়া যায়নি" : "No breakdown available"}</p>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                <Label htmlFor="payment-month">{text.paymentForMonth}</Label>
                                    <Select value={selectedMonth} onValueChange={handleMonthSelect} required={hasDues && !isAdminView}>
                                        <SelectTrigger id="payment-month">
                                            <SelectValue placeholder="Select a month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMonths.map(month => (
                                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{text.customAmount}</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder={`e.g., 1000`}
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="appearance-none m-0"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">{text.totalOutstandingHelp.replace('{total}', totalPayable.toLocaleString(locale))}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {paymentType === 'LOAN_REPAYMENT' && (
                         <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground text-center">{text.loanRepaymentDesc}</p>
                             <div className="space-y-2">
                                <Label htmlFor="amount-loan">{text.loanAmount}</Label>
                                <Input name="amount-display" id="amount-loan" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-lg font-bold" />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="payment-month-loan">{text.paymentForMonth}</Label>
                                <Input value={new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })} readOnly suppressHydrationWarning/>
                            </div>
                        </div>
                    )}

                    {paymentType === 'SPECIAL_SAVINGS' && (
                        <div className="space-y-4 pt-4 border-t">
                            <Alert className="bg-primary/10 border-primary/50">
                                <Star className="h-4 w-4 text-primary" />
                                <AlertTitle>{text.specialSavingsTitle}</AlertTitle>
                                <AlertDescription>{text.specialSavingsDesc}</AlertDescription>
                            </Alert>
                            <div className="space-y-2">
                                <Label htmlFor="reason-special">{text.paymentReason} (যেমন: ঈদ স্পেশাল)</Label>
                                <Input name="reason" id="reason-special" placeholder="ঈদ স্পেশাল / বোনাস ইত্যাদি" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount-special">{text.amount}</Label>
                                <Input name="amount-display" id="amount-special" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="পরিমাণ লিখুন" className="text-lg font-bold" required />
                            </div>
                        </div>
                    )}

                    {paymentType.startsWith('EVENT_') && (() => {
                        const eventId = paymentType.split('_')[1];
                        const event = activeEvents.find(e => e.id === eventId);
                        if (!event) return null;
                        return (
                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground text-center">{event.description || `Paying for ${event.name}`}</p>
                                <div className="space-y-2">
                                    <Label htmlFor="amount-event">{text.amount}</Label>
                                    <Input name="amount-display" id="amount-event" type="number" value={amount} readOnly className="text-lg font-bold" />
                                </div>
                            </div>
                        )
                    })()}
                    
                    {paymentType === 'OTHER' && (
                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground text-center pt-4">{text.otherPaymentDesc}</p>
                            <div className="space-y-2">
                                <Label htmlFor="reason-other">{text.paymentReason}</Label>
                                <Textarea name="reason" id="reason-other" placeholder={"যেমন: পিকনিকের ফি"} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount-other">{text.amount}</Label>
                                <Input name="amount-display" id="amount-other" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-bold" />
                            </div>
                        </div>
                    )}


                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="payment-account">{text.selectPaymentAccount}</Label>
                            <Select onValueChange={setSelectedAccountId} required>
                                <SelectTrigger id="payment-account">
                                    <SelectValue placeholder={text.selectPaymentAccount} />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentAccounts.length > 0 ? (
                                         paymentAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.bankName ? `${account.bankName} - ${account.accountName}` : account.accountName} ({account.accountType === 'MobileBanking' ? 'মোবাইল ব্যাংকিং' : 'ব্যাংক'})
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>{text.noAccountsConfigured}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                         {selectedAccount && (
                            <Alert variant="default" className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-400/50 text-blue-800 dark:text-blue-300">
                                <Info className="h-4 w-4 !text-blue-600" />
                                <AlertTitle>{selectedAccount.accountNumber}</AlertTitle>
                                <AlertDescription>{selectedAccount.notice}</AlertDescription>
                            </Alert>
                         )}
                        <div className="space-y-2">
                            <Label htmlFor="sender-number">{text.senderNumber}</Label>
                            <Input name="senderNumber" id="sender-number" defaultValue={details.mobilePrimary || ''} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transaction-id">{text.transactionId}</Label>
                            <Input name="transactionId" id="transaction-id" placeholder="e.g., ABC123XYZ" required />
                        </div>
                    </div>
                </div>
                 <CardFooter className="p-0 pt-6">
                    <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <HandCoins className="mr-2 h-4 w-4" />}
                        {isSubmitting ? (isAdminView ? text.recordingPayment : 'জমা হচ্ছে...') : (isAdminView ? text.recordPayment : text.submitForReview)}
                    </Button>
                </CardFooter>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
