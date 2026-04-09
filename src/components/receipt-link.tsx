
'use client';

import Link from 'next/link';
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Payment } from "@/types/payment";

interface ReceiptLinkProps {
  payment: Payment;
}

const pageText = {
  bn: {
    view: "দেখুন",
  },
  en: {
    view: "View",
  }
}

export function ReceiptLink({ payment }: ReceiptLinkProps) {
  const { language } = useLanguage();
  const text = pageText[language];

  const href = {
    pathname: '/receipt',
    query: {
      data: encodeURIComponent(JSON.stringify(payment))
    }
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
  
  if (isDownloadable()) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={href} target="_blank">
          {text.view}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled>
      {text.view}
    </Button>
  );
}

    