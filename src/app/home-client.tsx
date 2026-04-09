
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Megaphone, Newspaper, Target, BookOpen, User, Wallet, Receipt, Banknote, Building2, UserCog, HeartHandshake, FileBadge, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useRecentNotices, useDashboardPosts } from "@/hooks/use-posts";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from "@/contexts/auth-context";
import { getValidImageSrc } from "@/lib/utils";


const pageText = {
  bn: {
    heroTitle: "বন্ধন'১৭ সমবায় সমিতিতে স্বাগতম",
    heroSubtitle: "সদস্যদের পারস্পরিক সহযোগিতার মাধ্যমে আর্থিক স্বচ্ছলতা অর্জন।",
    heroButton: "অংশ হোন",
    welcomeBack: "স্বাগতম, ",
    myAccount: "আমার অ্যাকাউন্ট",
    makePayment: "পেমেন্ট করুন",
    transactions: "লেনদেন দেখুন",
    ourGoal: "আমাদের লক্ষ্য",
    goalDescription: "বন্ধন'১৭ এর মূল লক্ষ্য হলো সদস্যদের মধ্যে পারস্পরিক সহযোগিতা, সঞ্চয়ের মানসিকতা তৈরি, এবং আর্থিক স্বচ্ছলতা নিশ্চিত করা। আমরা একটি শক্তিশালী ও টেকসই সমবায় সমাজ গঠনে প্রতিশ্রুতিবদ্ধ।",
    goal1: "আর্থিক নিরাপত্তা এবং স্বচ্ছলতা অর্জন।",
    goal2: "সদস্যদের মধ্যে পারস্পরিক সহযোগিতা বৃদ্ধি।",
    goal3: "একটি শক্তিশালী ও টেকসই সমবায় সমাজ গঠন।",
    policyTitle: "নীতিমালা ও পরিকল্পনা",
    policyDesc: "বন্ধন'১৭ সমবায় সমিতির মূল নিয়মাবলী এবং ভবিষ্যৎ পরিকল্পনা।",
    announcements: "সাম্প্রতিক ঘোষণা",
    postedOn: "প্রকাশিত:",
    readMore: "আরও পড়ুন",
    viewAllNotices: "সকল নোটিশ দেখুন",
    dashboardPosts: "ড্যাশবোর্ড পোস্ট",
    noNotices: "কোনো নতুন নোটিশ নেই।",
    noPosts: "কোনো নতুন পোস্ট নেই।"
  },
  en: {
    heroTitle: "Welcome to Bondhon'17 Cooperative Society",
    heroSubtitle: "Achieving financial prosperity through mutual cooperation among members.",
    heroButton: "Become a Member",
    welcomeBack: "Welcome back, ",
    myAccount: "My Account",
    makePayment: "Make Payment",
    transactions: "View Transactions",
    ourGoal: "Our Goal",
    goalDescription: "The main goal of Bondhon'17 is to foster mutual cooperation, encourage a savings mindset, and ensure financial transparency among its members. We are committed to building a strong and sustainable cooperative society.",
    goal1: "Achieve financial security and prosperity.",
    goal2: "Increase mutual cooperation among members.",
    goal3: "Build a strong and sustainable cooperative society.",
    policyTitle: "Policies & Plans",
    policyDesc: "The core rules and future plans of the Bondhon'17 Cooperative Society.",
    announcements: "Recent Announcements",
    postedOn: "Posted on:",
    readMore: "Read More",
    viewAllNotices: "View All Notices",
    dashboardPosts: "Dashboard Posts",
    noNotices: "No new notices.",
    noPosts: "No new posts."
  }
};

const PostSkeleton = () => (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
);

const PolicyAccordionItem = ({ value, icon, title, items }: { value: string, icon: React.ReactNode, title: string, items: string[] }) => (
  <AccordionItem value={value}>
    <AccordionTrigger>
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-xl font-semibold">{title}</span>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <ul className="list-disc pl-10 space-y-2 text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </AccordionContent>
  </AccordionItem>
);

export function HomeClient() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useSession();
  const text = pageText[language];
  const { data: notices, isLoading: noticesLoading } = useRecentNotices();
  const { data: posts, isLoading: postsLoading } = useDashboardPosts();

  const HeroSection = () => (
      <section className="w-full text-center py-12 rounded-lg bg-card border animate-fade-in-up">
        {user ? (
          <>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
              {text.welcomeBack} {user.firstName || user.emailAddresses[0].emailAddress.split('@')[0]}!
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {text.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/account"><User className="mr-2"/>{text.myAccount}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/payment"><Wallet className="mr-2"/>{text.makePayment}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/transactions"><Receipt className="mr-2"/>{text.transactions}</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
              {text.heroTitle}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {text.heroSubtitle}
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/registration">{text.heroButton}</Link>
            </Button>
          </>
        )}
      </section>
  );

  return (
    <div className="space-y-12 flex flex-col items-center">
      <HeroSection />
      
      <section className="w-full max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">{text.policyTitle}</h2>
            <p className="text-muted-foreground mt-2">{text.policyDesc}</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <PolicyAccordionItem
                value="item-1"
                icon={<Target className="w-8 h-8 text-primary"/>} 
                title="সংক্ষেপে বন্ধন'১৭" 
                items={[
                    "একটি ১০ বছরের সঞ্চয়ভিত্তিক প্রকল্প (২০২৫–২০৩৫)",
                    "সদস্য: ধানুয়া কামালপুর কো-অপারেটিভ উচ্চ বিদ্যালয়ের ২০১৭ এসএসসি ব্যাচ",
                    "মূল উদ্দেশ্য: আর্থিক নিরাপত্তা, সম্পদ গঠন, উন্নয়নমূলক উদ্যোগ"
                ]}
            />
             <PolicyAccordionItem
                value="item-2"
                icon={<Banknote className="w-8 h-8 text-primary"/>} 
                title="মাসিক চাঁদা ও অর্থনীতি" 
                items={[
                    "মাসিক চাঁদা: ৳১০০০ (প্রতি মাসের ৫–১৫ তারিখ)",
                    "ঈদ বোনাস: ঈদের পরের মাসে, ৳২০০০",
                    "সব টাকা জমা হবে নির্ভরযোগ্য সেভিংস একাউন্টে",
                    "আয়-ব্যয় হিসাব: ক্যাশিয়ার Excel-এ সংরক্ষণ ও হোয়াটসঅ্যাপে শেয়ার করবেন"
                ]}
            />
            <PolicyAccordionItem
                value="item-3"
                icon={<Building2 className="w-8 h-8 text-primary"/>} 
                title="পরিকল্পিত উন্নয়ন" 
                items={[
                    "জমি ক্রয় ও বিক্রয়",
                    "ফ্ল্যাট/ভবন নির্মাণ",
                    "প্রাইভেট স্কুল, কলেজ",
                    "মিনি হাসপাতাল, ডায়াগনস্টিক সেন্টার",
                    "ব্যবসা (শপ, ফার্মেসি ইত্যাদি) ও বিলাসদ্রব্য (যেমন গাড়ি)"
                ]}
            />
            <PolicyAccordionItem
                value="item-4"
                icon={<Users className="w-8 h-8 text-primary"/>} 
                title="সদস্য সম্পর্কিত" 
                items={[
                    "সদস্য হতে হলে ২০১৭ SSC ব্যাচের ছাত্র হতে হবে",
                    "সদস্য পদ বাতিল হতে পারে ৩ মাস চাঁদা না দিলে",
                    "কেউ মারা গেলে উত্তরাধিকারী চালিয়ে নিতে পারবেন"
                ]}
            />
             <PolicyAccordionItem
                value="item-5"
                icon={<UserCog className="w-8 h-8 text-primary"/>} 
                title="ক্যাশিয়ার কমিটি" 
                items={[
                    "প্রতি বছর ১ জন প্রধান ও ৫ সদস্য বিশিষ্ট ক্যাশিয়ার কমিটি গঠন",
                    "এক্সেলে দক্ষ ব্যক্তিকে প্রধান ক্যাশিয়ার হিসেবে অগ্রাধিকার",
                    "মাসিক সভা: প্রতি মাসের ২য় শুক্রবার, বিকাল ৩টা (WhatsApp গ্রুপে)"
                ]}
            />
            <PolicyAccordionItem
                value="item-6"
                icon={<HeartHandshake className="w-8 h-8 text-primary"/>} 
                title="বন্ধুত্ব ও মানবিকতা" 
                items={[
                    "বিপদে পাশে থাকা (সাহায্য তহবিল)",
                    "বিবাহ, জন্মদিন, সাফল্যে শুভেচ্ছা",
                    "মৃত্যুতে সহানুভূতিশীল সহযোগিতা",
                    "সম্পর্ক টিকিয়ে রাখতে সহানুভূতি ও ক্ষমার মানসিকতা"
                ]}
            />
             <PolicyAccordionItem
                value="item-7"
                icon={<FileBadge className="w-8 h-8 text-primary"/>} 
                title="সিদ্ধান্ত ও নিয়ম" 
                items={[
                    "সব সিদ্ধান্ত হবে সকল সদস্যের সম্মতিক্রমে",
                    "শেয়ার হস্তান্তর/ক্রয় সীমাবদ্ধ ও নীতিমালাভিত্তিক",
                    "প্রয়োজনে কমিটি গঠন/পরিবর্তন বা নতুন সদস্য সংযুক্তি"
                ]}
            />
          </Accordion>
      </section>

      <section className="w-full max-w-5xl">
        <h2 className="font-headline text-3xl font-bold mb-4 text-center">{text.announcements}</h2>
        {noticesLoading ? <PostSkeleton /> : (
            notices && notices.length > 0 ? (
                <div className="space-y-4">
                    {notices.map((notice) => (
                        <Card key={notice.id} className="w-full transition-shadow hover:shadow-md">
                             <Link href={`/notices/${notice.id}`}>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold font-headline text-lg">{notice.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">{text.postedOn} {new Date(notice.createdAt).toLocaleDateString()}</p>
                                    <p className="text-muted-foreground text-sm line-clamp-2">{notice.content}</p>
                                    <Button asChild variant="link" className="p-0 mt-2">
                                        <div>
                                            {text.readMore} <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </Button>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">{text.noNotices}</p>
            )
        )}
        <div className="text-center mt-6">
            <Button asChild variant="outline">
                <Link href="/notices">
                    <Megaphone className="mr-2 h-4 w-4" />
                    {text.viewAllNotices}
                </Link>
            </Button>
        </div>
      </section>

      <section className="w-full max-w-5xl bg-card p-8 rounded-lg shadow-md">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold mb-4">{text.ourGoal}</h2>
            <p className="text-muted-foreground mb-6">
              {text.goalDescription}
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-accent mr-3 mt-1 flex-shrink-0" />
                <span>{text.goal1}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-accent mr-3 mt-1 flex-shrink-0" />
                <span>{text.goal2}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-accent mr-3 mt-1 flex-shrink-0" />
                <span>{text.goal3}</span>
              </li>
            </ul>
          </div>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            <Image 
              src="https://picsum.photos/seed/ourgoal/800/600" 
              alt="Community Goal" 
              fill
              className="transition-transform duration-500 hover:scale-105 object-cover"
              data-ai-hint="teamwork collaboration"
            />
          </div>
        </div>
      </section>

      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Newspaper className="mr-2 text-primary" /> {text.dashboardPosts}
          </CardTitle>
        </CardHeader>
        <CardContent>
           {postsLoading ? <PostSkeleton /> : (
              posts && posts.length > 0 ? (
                  <Carousel className="w-full">
                      <CarouselContent>
                          {posts.map((post) => (
                              <CarouselItem key={post.id}>
                                  <Link href={`/notices/${post.id}`} className="block p-1">
                                      <Card className="overflow-hidden">
                                          <CardContent className="p-0">
                                               <Image
                                                  src={getValidImageSrc(post.imageUrls[0])}
                                                  alt={post.title}
                                                  width={600}
                                                  height={400}
                                                  className="aspect-video object-cover w-full"
                                              />
                                              <div className="p-4">
                                                  <h3 className="font-semibold">{post.title}</h3>
                                              </div>
                                          </CardContent>
                                      </Card>
                                  </Link>
                              </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                  </Carousel>
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{text.noPosts}</p>
              )
           )}
        </CardContent>
      </Card>
    </div>
  );
}
