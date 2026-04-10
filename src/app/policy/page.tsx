
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getSettings } from "@/services/prisma/queries/admin";

export default async function PolicyPage() {
    const settings = await getSettings();

    const title = "বন্ধন'১৭ নীতিমালা";
    const description = "বন্ধন'১৭ (Bondhon'17) এর নিয়মাবলী ও পরিকল্পনা";

    if (!settings) {
        return (
            <Card className="w-full max-w-5xl mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-4xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-destructive">Could not load policy content.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-5xl mx-auto shadow-xl border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center py-12">
                <CardTitle className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-primary">{title}</CardTitle>
                <CardDescription className="text-lg mt-4">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 prose dark:prose-invert max-w-none p-8 md:p-16 pt-0">
               <div className="leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: settings.policyContent.replace(/\n/g, '<br />') }} />
            </CardContent>
        </Card>
    );
}
