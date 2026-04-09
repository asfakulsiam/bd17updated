
import { getPosts } from '@/services/prisma/queries/posts';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Megaphone, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const pageText = {
  bn: {
    title: "নোটিশ বোর্ড",
    description: "আপনার সকল নোটিশ এবং ঘোষণা এখানে দেখুন।",
    noMessages: "এই মুহূর্তে কোনো নতুন নোটিশ নেই।",
    readMore: "আরও পড়ুন",
    postedOn: "প্রকাশিত",
    errorTitle: "ত্রুটি",
    errorDescription: "নোটিশ লোড করা সম্ভব হচ্ছে না।"
  },
  en: {
    title: "Notice Board",
    description: "View all your notices and announcements here.",
    noMessages: "There are no new notices at this time.",
    readMore: "Read More",
    postedOn: "Posted on",
    errorTitle: "Error",
    errorDescription: "Could not load notices."
  }
}

export default async function NoticesPage() {
  let posts;
  let error = null;
  const language = 'bn'; // Assuming 'bn' for server component text
  const text = pageText[language];
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  try {
    posts = (await getPosts()).filter(p => p.status === 'Published' && p.type === 'NOTICE');
  } catch (err) {
    error = (err as Error).message || "Could not load notices.";
    posts = [];
  }

  return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{text.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-4">
            {posts.length > 0 ? (
                posts.map(post => (
                <Link href={`/notices/${post.id}`} key={post.id} className="block">
                    <div 
                    className={cn(
                        "p-4 rounded-lg border flex items-start space-x-4 transition-colors",
                         "bg-card hover:bg-muted/50"
                    )}
                    >
                    <div className="pt-1">
                        <Megaphone className="w-5 h-5 text-primary"/>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold">
                            {post.title}
                        </h3>
                        <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{post.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {text.postedOn} {new Date(post.createdAt).toLocaleString(locale, {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>
                     <div className="pt-1 text-muted-foreground self-center">
                        <ArrowRight className="w-5 h-5"/>
                    </div>
                    </div>
                </Link>
                ))
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">{text.noMessages}</h3>
                </div>
            )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
