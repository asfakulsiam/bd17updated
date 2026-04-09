
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/types";
import { ReceiptLink } from "@/components/receipt-link";
import { TransactionStatus, UserDetailsData, OrgLoanData } from "@/models";
import { useLanguage } from "@/contexts/language-context";

const pageText = {
    bn: {
        title: "লেনদেন ও হিসাব বিবরনি",
        yourTotalDeposit: "আপনার মোট সঞ্চয়",
        yourTotalDepositDesc: "সফল সঞ্চয় এবং অন্যান্য জমার যোগফল (ঋণ পরিশোধ বাদে)",
        orgTotalFund: "সমিতির মোট সঞ্চয় তহবিল (ক্যাশ)",
        orgTotalFundDesc: "সদস্যদের সঞ্চয় থেকে মোট জমা (বিতরণকৃত ঋণ বাদ দিয়ে)",
        paymentHistory: "পেমেন্টের ইতিহাস",
        paymentHistoryDesc: "আপনার সাম্প্রতিক সকল লেনদেনের তালিকা",
        date: "তারিখ",
        transactionId: "লেনদেন আইডি",
        status: "স্থিতি",
        amount: "পরিমাণ (টাকা)",
        receipt: "রসিদ",
        view: "দেখুন",
        thisYearContributions: "এই বছরের জমা",
        thisYearContributionsDesc: "আপনার এই বছরের মোট সফল জমার বিবরণ",
        statusMap: {
            "Pending": "প্রসেসিং",
            "Completed": "সফল",
            "Failed": "ব্যর্থ",
        },
        loanableBalance: "ঋণযোগ্য ব্যালেন্স",
        extraFund: "অন্যান্য জমা",
        totalSavings: "মোট সঞ্চয়",
        totalOtherPayments: "মোট অন্যান্য পেমেন্ট",
        savingsThisYear: "এই বছরের সঞ্চয়",
        otherPaymentsThisYear: "এই বছরের অন্যান্য পেমেন্ট",
        errorTitle: "তথ্য লোড করা যায়নি",
        errorDescription: "এই মুহূর্তে লেনদেনের তথ্য আনা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
        totalLoanTaken: "মোট গৃহীত ঋণ",
        loanTakenThisYear: "এই বছরে গৃহীত ঋণ",
        paymentTypes: {
          'MONTHLY_SAVINGS': "মাসিক সঞ্চয়",
          'LOAN_REPAYMENT': "লোন পরিশোধ",
          'LOAN_DISBURSEMENT': "ঋণ বিতরণ",
          'SPECIAL_SAVINGS': "স্পেশাল সঞ্চয়",
          'OTHER': "অন্যান্য পেমেন্ট",
        }
    },
    en: {
        title: "Transactions & Statements",
        yourTotalDeposit: "Your Total Savings",
        yourTotalDepositDesc: "Sum of all successful savings and other payments (excluding loan repayments)",
        orgTotalFund: "Organization&apos;s Total Savings Fund (Cash)",
        orgTotalFundDesc: "Total cash from member savings (minus disbursed loans)",
        paymentHistory: "Payment History",
        paymentHistoryDesc: "A list of all your recent transactions",
        date: "Date",
        transactionId: "Transaction ID",
        status: "Status",
        amount: "Amount (BDT)",
        receipt: "Receipt",
        view: "View",
        thisYearContributions: "This Year's Contributions",
        thisYearContributionsDesc: "Details of your successful deposits this year",
        statusMap: {
            "Pending": "Processing",
            "Completed": "Successful",
            "Failed": "Failed",
        },
        loanableBalance: "Loanable Balance",
        extraFund: "Other Deposits",
        totalSavings: "Total Savings",
        totalOtherPayments: "Total Other Payments",
        savingsThisYear: "Savings This Year",
        otherPaymentsThisYear: "Other Payments This Year",
        errorTitle: "Could Not Load Data",
        errorDescription: "Transaction data could not be retrieved at this time. Please try again later.",
        totalLoanTaken: "Total Loan Taken",
        loanTakenThisYear: "Loan Taken This Year",
        paymentTypes: {
          'MONTHLY_SAVINGS': "Monthly Savings",
          'LOAN_REPAYMENT': "Loan Repayment",
          'LOAN_DISBURSEMENT': "Loan Disbursement",
          'SPECIAL_SAVINGS': "Special Savings",
          'OTHER': "Other Payment",
        }
    }
};

const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
        case 'Completed':
            return 'bg-green-500/80';
        case 'Failed':
            return 'bg-red-500/80';
        case 'Pending':
            return 'bg-yellow-500/80';
        default:
            return 'default';
    }
}

export function TransactionClient({ history, orgDetails, userDetails }: { history: Payment[], orgDetails: OrgLoanData, userDetails: UserDetailsData }) {
  const { language } = useLanguage();
  
  const text = pageText[language];
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const currentYear = new Date().getFullYear();
  
  const savingsThisYear = userDetails.transactions
    .filter(p => (p.type === 'MONTHLY_SAVINGS' || p.type === 'SPECIAL_SAVINGS') && new Date(p.date).getFullYear() === currentYear && p.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const otherPaymentsThisYear = userDetails.transactions
    .filter(p => p.type === 'OTHER' && !p.isSystem && new Date(p.date).getFullYear() === currentYear && p.amount > 0 && p.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const loanTakenThisYear = userDetails.transactions
    .filter(p => p.type === 'LOAN_DISBURSEMENT' && new Date(p.date).getFullYear() === currentYear && p.status === 'Completed')
    .reduce((sum, payment) => sum + Math.abs(payment.amount), 0);

  const totalContributionsThisYear = savingsThisYear + otherPaymentsThisYear;
  
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">{text.title}</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{text.yourTotalDeposit}</CardTitle>
                <CardDescription>{text.yourTotalDepositDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-primary">৳{userDetails.financials.totalSavings.toLocaleString(locale)}</p>
                 <div className="text-sm text-muted-foreground border-t pt-2 mt-2 space-y-1">
                    <div className="flex justify-between">
                        <span>{text.totalLoanTaken}:</span>
                        <span className="font-medium text-foreground">৳{userDetails.financials.totalLoanTaken.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{text.totalOtherPayments}:</span>
                        <span className="font-medium text-foreground">৳{userDetails.financials.otherPayments.toLocaleString(locale)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{text.thisYearContributions}</CardTitle>
                <CardDescription>{text.thisYearContributionsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-primary">৳{totalContributionsThisYear.toLocaleString(locale)}</p>
                 <div className="text-sm text-muted-foreground space-y-1 border-t pt-2 mt-2">
                    <div className="flex justify-between">
                        <span>{text.savingsThisYear}:</span>
                        <span className="font-medium text-foreground">৳{savingsThisYear.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{text.otherPaymentsThisYear}:</span>
                         <span className="font-medium text-foreground">৳{otherPaymentsThisYear.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{text.loanTakenThisYear}:</span>
                         <span className="font-medium text-foreground">৳{loanTakenThisYear.toLocaleString(locale)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
         <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline">{text.orgTotalFund}</CardTitle>
                <CardDescription>{text.orgTotalFundDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-primary">৳{orgDetails.organizationTotalFund.toLocaleString(locale)}</p>
                <div className="text-sm text-muted-foreground space-y-1 border-t pt-2 mt-2">
                    <div className="flex justify-between">
                        <span>{text.extraFund}:</span>
                         <span className="font-medium text-foreground">৳{orgDetails.organizationOtherFunds.toLocaleString(locale)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{text.paymentHistory}</CardTitle>
          <CardDescription>{text.paymentHistoryDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{text.date}</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">{text.status}</TableHead>
                <TableHead className="text-right">{text.amount}</TableHead>
                <TableHead className="text-right">{text.receipt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((payment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{new Date(payment.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                  <TableCell>
                    {text.paymentTypes[payment.paymentType as keyof typeof text.paymentTypes] || payment.paymentType}
                    {payment.reason && <span className="text-muted-foreground"> ({payment.reason})</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={"default"}
                      className={getStatusVariant(payment.status as TransactionStatus)}
                    >
                      {text.statusMap[payment.status as keyof typeof text.statusMap]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{payment.amount < 0 ? '-' : ''}৳{Math.abs(payment.amount).toLocaleString(locale)}</TableCell>
                  <TableCell className="text-right">
                    <ReceiptLink payment={payment} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
