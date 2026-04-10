
'use client';

import Link from 'next/link';
import { Globe, Send, Camera } from 'lucide-react';
import { TakaSymbolIcon } from './icons/taka-symbol-icon';
import { useLanguage } from '@/contexts/language-context';
import { useApp } from '@/contexts/app-context';
import Image from 'next/image';
import { getValidImageSrc } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

const footerLinks = {
  bn: {
    account: "আমার অ্যাকাউন্ট",
    transactions: "লেনদেন ও হিসাব বিবরনি",
    loan: "লোনের অবস্থা",
    payment: "পেমেন্ট করুন",
    register: "নিবন্ধন",
    terms: "শর্তাবলী",
    importantLinks: "গুরুত্বপূর্ণ লিংক",
    contact: "যোগাযোগ",
    social: "সামাজিক মাধ্যম",
    description: "আপনার আর্থিক যাত্রাকে মসৃণ করার জন্য একটি নির্ভরযোগ্য সমবায় সমাধান।",
    addressTitle: "ঠিকানা",
    address: "ধানুয়া কামালপুর, কামালপুর বাজার ২১৪০\nবকশীগঞ্জ, জামালপুর",
    helpline: "সহায়তা ও হটলাইন",
    contacts: [
        "সিয়াম: ০১৭৩৪-৭৩৭২৯৪",
        "হ্যাভেন: ০১৭১৬-৯০৭৫৯২",
        "শান্ত: ০১৭৮৩-৫৩৬১২৩",
        "এবি রহমান: ০১৩০৩-০০২৭৩৯",
        "আবু হানিফ: ০১৬৭৭-৩৪৪৫০৮"
    ],
    copyright: `© ${new Date().getFullYear()} বন্ধন১৭। সর্বস্বত্ব সংরক্ষিত।`
  },
  en: {
    account: "My Account",
    transactions: "Transactions",
    loan: "Loan Status",
    payment: "Payment",
    register: "Register",
    terms: "Terms & Conditions",
    importantLinks: "Important Links",
    contact: "Contact",
    social: "Social Media",
    description: "A reliable cooperative solution to streamline your financial journey.",
    addressTitle: "Address",
    address: "Dhanua Kamalpur, Kamalpur Bazar 2140\nBakshiganj, Jamalpur",
    helpline: "Support & Helpline",
    contacts: [
        "Siam: 01734-737294",
        "Haven: 01716-907592",
        "Shanto: 01783-536123",
        "AB Rahman: 01303-002739",
        "Abu Hanif: 01677-344508"
    ],
    copyright: `© ${new Date().getFullYear()} Bondhon17. All rights reserved.`
  },
}

const Footer = () => {
  const { language } = useLanguage();
  const { settings, isInitialLoading } = useApp();
  const links = footerLinks[language];
  
  const Logo = () => {
    if (isInitialLoading || !settings) {
        return (
            <>
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-6 w-24" />
            </>
        )
    }
    return (
        <>
            <Image src={getValidImageSrc(settings.logoUrl)} alt="Site Logo" width={32} height={32} className="rounded-md" data-ai-hint="logo"/>
            <span className="font-bold font-headline text-xl">{settings.siteTitle || "বন্ধন&apos;১৭"}</span>
        </>
    )
  }

  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">
              {links.description}
            </p>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">{links.importantLinks}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account" className="text-muted-foreground hover:text-primary transition-colors">{links.account}</Link></li>
              <li><Link href="/transactions" className="text-muted-foreground hover:text-primary transition-colors">{links.transactions}</Link></li>
              <li><Link href="/loan" className="text-muted-foreground hover:text-primary transition-colors">{links.loan}</Link></li>
              <li><Link href="/payment" className="text-muted-foreground hover:text-primary transition-colors">{links.payment}</Link></li>
              <li><Link href="/registration" className="text-muted-foreground hover:text-primary transition-colors">{links.register}</Link></li>
              <li><Link href="/policy" className="text-muted-foreground hover:text-primary transition-colors">{links.terms}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">{links.contact}</h3>
            <div className="text-sm text-muted-foreground space-y-4">
                <div>
                    <h4 className='font-medium text-foreground'>{links.addressTitle}</h4>
                    {links.address.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                </div>
                 <div>
                    <h4 className='font-medium text-foreground'>{links.helpline}</h4>
                    {links.contacts.map((contact, index) => <p key={index}>{contact}</p>)}
                </div>
            </div>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">{links.social}</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Send className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Camera className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p suppressHydrationWarning>{links.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
