
'use client';

import { Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { Payment } from '@/types/payment';
import { TakaSymbolIcon } from '@/components/icons/taka-symbol-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const pageText = {
  bn: {
    title: "বন্ধন১৭",
    description: "অর্থপ্রদানের রসিদ",
    invoiceTo: "প্রাপক:",
    paymentDetails: "লেনদেনের বিবরণ:",
    memberName: "সদস্যের নাম",
    memberId: "সদস্য আইডি",
    phone: "ফোন",
    transactionDate: "লেনদেনের তারিখ",
    transactionTime: "লেনদেনের সময়",
    transactionId: "লেনদেন আইডি",
    approvedBy: "অনুমোদনকারী",
    amount: "পরিমাণ",
    status: "স্থিতি",
    total: "সর্বমোট",
    footerNote: "এটি একটি কম্পিউটার-জেনারেটেড রসিদ এবং কোন স্বাক্ষরের প্রয়োজন নেই।",
    copyright: `© ${new Date().getFullYear()} বন্ধন১৭. সর্বস্বত্ব সংরক্ষিত।`,
    paid: "PAID",
    failed: "FAILED",
    processing: "PROCESSING",
    statusMap: {
        "Completed": "সফল",
        "Failed": "ব্যর্থ",
        "Pending": "প্রসেসিং",
    },
    error: "রসিদ লোড করা যায়নি। প্রয়োজনীয় ডেটা পাওয়া যায়নি।",
    errorTitle: "ত্রুটি",
    descriptionHeader: "বিবরণ",
    amountHeader: "পরিমাণ",
    download: "ডাউনলোড করুন",
    paymentType: "পেমেন্টের ধরন",
    paymentMethod: "পেমেন্ট পদ্ধতি",
    paymentAccount: "পেমেন্ট অ্যাকাউন্ট",
    reason: "কারণ",
    downloadUnavailable: "ডাউনলোড বর্তমানে অনুপলব্ধ।",
    paymentTypes: {
      'MONTHLY_SAVINGS': "মাসিক সঞ্চয়",
      'LOAN_REPAYMENT': "লোন পরিশোধ",
      'LOAN_DISBURSEMENT': "ঋণ বিতরণ",
      'SPECIAL_SAVINGS': "স্পেশাল সঞ্চয়",
      'OTHER': "অন্যান্য পেমেন্ট",
    }
  },
  en: {
    title: "Bondhon17",
    description: "Payment Receipt",
    invoiceTo: "INVOICE TO:",
    paymentDetails: "PAYMENT DETAILS:",
    memberName: "Member Name",
    memberId: "Member ID",
    phone: "Phone",
    transactionDate: "Transaction Date",
    transactionTime: "Transaction Time",
    transactionId: "Transaction ID",
    approvedBy: "Approved By",
    amount: "Amount",
    status: "Status",
    total: "Total",
    footerNote: "This is a computer-generated receipt and does not require a signature.",
    copyright: `© ${new
      Date().getFullYear()} Bondhon17. All rights reserved.`,
    paid: "PAID",
    failed: "FAILED",
    processing: "PROCESSING",
     statusMap: {
        "Completed": "Successful",
        "Failed": "Failed",
        "Pending": "Processing",
    },
    error: "Could not load receipt. Required data is missing.",
    errorTitle: "Error",
    descriptionHeader: "Description",
    amountHeader: "Amount",
    download: "Download",
    paymentType: "Payment Type",
    paymentMethod: "Payment Method",
    paymentAccount: "Payment Account",
    reason: "Reason",
    downloadUnavailable: "Download is currently unavailable.",
    paymentTypes: {
      'MONTHLY_SAVINGS': "Monthly Savings",
      'LOAN_REPAYMENT': "Loan Repayment",
      'LOAN_DISBURSEMENT': "Loan Disbursement",
      'SPECIAL_SAVINGS': "Special Savings",
      'OTHER': "Other Payment",
    }
  }
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const text = pageText[language];
  const paymentDataString = searchParams.get('data');
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!paymentDataString) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className='flex items-center'><AlertTriangle className="mr-2 text-destructive" />{text.errorTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{text.error}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  const payment: Payment = JSON.parse(decodeURIComponent(paymentDataString));

  const handleDownloadPdf = () => {
    // This feature is currently disabled
    window.print();
  };

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const getPaymentDescription = () => {
    let description = text.paymentTypes[payment.paymentType as keyof typeof text.paymentTypes];
    if (payment.paymentType === 'MONTHLY_SAVINGS' && payment.paymentForMonth) {
        const date = new Date(payment.paymentForMonth + '-02'); // Use day 2 to avoid timezone issues
        const monthYear = date.toLocaleString(locale, { month: 'long', year: 'numeric' });
        description = `${description} (${monthYear})`;
    }
    if ((payment.paymentType === 'OTHER' || payment.paymentType === 'SPECIAL_SAVINGS') && payment.reason) {
      description = `${description} (${payment.reason})`;
    }
    return description;
  }

  const isDownloadable = () => {
    if (payment.status !== 'Completed' && payment.status !== 'Failed') {
      return false;
    }
    
    const paymentDate = new Date(payment.date);
    const now = new Date();
    const hoursDifference = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDifference <= 48;
  };
  
  const getPaymentAccountDisplay = () => {
      if (payment.paymentMethod !== 'Manual') return payment.paymentMethod;
      return payment.bankName ? `${payment.bankName} - ${payment.service}` : payment.service;
  }


  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-8 flex justify-center items-start min-h-screen printable-receipt">
          <div ref={receiptRef} className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 relative receipt-content">
              <header className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                      <TakaSymbolIcon className="h-8 w-8 text-primary" />
                      <h1 className="text-3xl font-bold font-headline text-gray-800 dark:text-gray-100">{text.title}</h1>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{text.description}</p>
              </header>

              <div className="space-y-6 text-sm">
                  <div className="p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-700/20">
                      <h2 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">{text.invoiceTo}</h2>
                      <p className="font-bold text-base">{payment.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{text.memberId}: {payment.memberId}</p>
                      {payment.phone && <p className="text-gray-500 dark:text-gray-400">{text.phone}: {payment.phone}</p>}
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                       <h2 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">{text.paymentDetails}</h2>
                       <div className="space-y-1 text-gray-500 dark:text-gray-400">
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.transactionDate}:</span><span suppressHydrationWarning>{new Date(payment.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.transactionTime}:</span><span suppressHydrationWarning>{new Date(payment.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span></div>
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.transactionId}:</span><span>{payment.transactionId}</span></div>
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.paymentType}:</span><span>{text.paymentTypes[payment.paymentType as keyof typeof text.paymentTypes]}</span></div>
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.paymentMethod}:</span><span>{payment.paymentMethod}</span></div>
                            {payment.paymentMethod === 'Manual' && payment.service && (
                                <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.paymentAccount}:</span><span>{getPaymentAccountDisplay()}</span></div>
                            )}
                           <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.status}:</span>
                              <Badge variant={payment.status === 'Completed' ? 'default' : payment.status === 'Failed' ? 'destructive' : 'secondary'} className={payment.status === 'Completed' ? 'bg-green-500/80' : ''}>
                                  {text.statusMap[payment.status as keyof typeof text.statusMap]}
                              </Badge>
                           </div>
                           {payment.approvedBy && <div className="flex justify-between"><span className="font-medium text-gray-600 dark:text-gray-300">{text.approvedBy}:</span><span>{payment.approvedBy}</span></div>}
                      </div>
                  </div>

                  <div>
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-gray-50 dark:bg-gray-700/50">
                                  <th className="p-3 font-semibold text-xs uppercase">{text.descriptionHeader}</th>
                                  <th className="p-3 font-semibold text-xs uppercase text-right">{text.amountHeader}</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td className="p-3">{getPaymentDescription()}</td>
                                  <td className="p-3 text-right font-mono">{payment.amount < 0 ? '-' : ''}৳{Math.abs(payment.amount).toLocaleString(locale)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                   <div className="flex justify-end mt-4">
                      <div className="w-full max-w-xs">
                          <div className="w-full border-t border-border my-2"></div>
                          <div className="flex justify-between items-center py-2">
                              <p className="text-base font-bold">{text.total}</p>
                              <p className="text-base font-bold font-mono">{payment.amount < 0 ? '-' : ''}৳{Math.abs(payment.amount).toLocaleString(locale)}</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="text-center p-6 mt-8">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{text.footerNote}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500" suppressHydrationWarning>{text.copyright}</p>
              </div>
          </div>
      </div>
      <div className="py-8 text-center no-print">
         <Button onClick={handleDownloadPdf}>
            <Download className="mr-2" />
            {text.download}
        </Button>
      </div>
    </>
  );
}

export default function ReceiptPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReceiptContent />
        </Suspense>
    )
}
