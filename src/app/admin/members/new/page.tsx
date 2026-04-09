

'use client';

import { useState } from "react";
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
import { ArrowLeft, Loader2, UserPlus, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useCreateMemberFromClerk } from "@/hooks/use-members";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JoiningType } from "@/types";

export default function NewMemberFromClerkPage() {
    const router = useRouter();
    const createMemberMutation = useCreateMemberFromClerk();
    const [clerkId, setClerkId] = useState('');
    const [joiningType, setJoiningType] = useState<JoiningType>('New');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createMemberMutation.mutate({ clerkId, joiningType }, {
          onSuccess: () => {
            router.push('/admin/members?status=pending');
          }
        });
    }

  return (
    <div className="space-y-8">
        <Button asChild variant="outline">
          <Link href="/admin/members">
            <ArrowLeft className="mr-2 h-4 w-4" /> সদস্য তালিকায় ফিরে যান
          </Link>
        </Button>
        <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-2xl shadow-lg mx-auto">
            <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Clerk ID দিয়ে সদস্য যোগ করুন</CardTitle>
            <CardDescription>Clerk-এ ইতোমধ্যে রেজিস্টার্ড ব্যবহারকারীকে সদস্য হিসেবে যোগ করুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
            <Alert variant="default" className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-500/50">
                <Info className="h-4 w-4 !text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">গুরুত্বপূর্ণ ধাপ</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                   ব্যবহারকারীর Clerk User ID এখানে দিন। সিস্টেম Clerk থেকে ব্যবহারকারীর নাম, ইমেইল এবং ছবি নিয়ে একটি প্রাথমিক সদস্য প্রোফাইল তৈরি করবে।
                </AlertDescription>
            </Alert>
            
            <fieldset disabled={createMemberMutation.isPending} className="space-y-4 group">
                <div className="space-y-2">
                    <Label htmlFor="clerkId">Clerk User ID <span className="text-destructive">*</span></Label>
                    <Input 
                        name="clerkId" 
                        id="clerkId" 
                        type="text" 
                        placeholder="user_xxxxxxxxxxxxxxxxxxxxxxxx" 
                        value={clerkId}
                        onChange={(e) => setClerkId(e.target.value)}
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Joining Type <span className="text-destructive">*</span></Label>
                    <RadioGroup value={joiningType} onValueChange={(v) => setJoiningType(v as JoiningType)} className="flex gap-4">
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="New" id="new-joiner" />
                            <Label htmlFor="new-joiner">New Member (pays from current year)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Old" id="old-joiner" />
                            <Label htmlFor="old-joiner">Old Member (pays from Aug 2025)</Label>
                        </div>
                    </RadioGroup>
                </div>
            </fieldset>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={createMemberMutation.isPending || !clerkId}>
                {createMemberMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> তৈরি হচ্ছে...</> : <><UserPlus className="mr-2 h-5 w-5" /> সদস্য তৈরি করুন</>}
            </Button>
            </CardFooter>
        </Card>
        </form>
    </div>
  );
}
