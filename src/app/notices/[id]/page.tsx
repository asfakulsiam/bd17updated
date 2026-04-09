
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPostById } from '@/services/prisma/queries/posts';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getValidImageSrc } from "@/lib/utils";

const pageText = {
  bn: {
    back: "সকল নোটিশে ফিরে যান",
    postedOn: "প্রকাশিত",
    error: "পোস্ট খুঁজে পাওয়া যায়নি।"
  },
  en: {
    back: "Back to All Notices",
    postedOn: "Posted on",
    error: "Post not found."
  }
}

export default async function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  
  // Assuming 'bn' as default language for server component
  const language = 'bn'; 
  const text = pageText[language];
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  if (!post) {
    return (
      <div className="text-center p-12">
        <p>{text.error}</p>
        <Button asChild variant="link">
            <Link href="/notices">{text.back}</Link>
        </Button>
      </div>
    );
  }

  const images = post.imageUrls || [];

  return (
    <div className="space-y-8">
      <Button asChild variant="outline">
        <Link href="/notices">
          <ArrowLeft className="mr-2 h-4 w-4" /> {text.back}
        </Link>
      </Button>

      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{post.title}</CardTitle>
          <CardDescription>
            {text.postedOn}: {new Date(post.createdAt).toLocaleDateString(locale, {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {images.length > 0 && (
                 <Carousel className="w-full">
                    <CarouselContent>
                        {images.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                            <Card>
                                <CardContent className="flex aspect-video items-center justify-center p-0 rounded-lg overflow-hidden">
                                     <Image 
                                        src={getValidImageSrc(url)}
                                        alt={`Post image ${index + 1}`}
                                        width={1280}
                                        height={720}
                                        className="object-cover w-full h-full"
                                    />
                                </CardContent>
                            </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            )}

            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />')}}>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
