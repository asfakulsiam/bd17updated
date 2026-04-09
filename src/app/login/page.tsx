
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
    const router = useRouter();
    const { isLoaded, signIn } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isLoaded) {
            return;
        }

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        startTransition(async () => {
            setError(null);
            try {
                const result = await signIn.create({
                    identifier: email,
                    password,
                });

                if (result.status === "complete") {
                    router.push('/');
                    router.refresh();
                } else {
                    console.log(result);
                }

            } catch (e: any) {
                 setError(e.errors?.[0]?.longMessage || e.message || "An unexpected error occurred.");
            }
        });
    };

    return (
        <div className="flex justify-center items-center py-12">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Login Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending || !isLoaded}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
