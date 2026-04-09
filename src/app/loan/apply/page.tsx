
'use client';

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUserLoanData, useApplyForLoan } from "@/hooks/use-loans";
import { Skeleton } from "@/components/ui/skeleton";

const LoanApplicationSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                <Skeleton className="h-8 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="md:col-span-2 space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </div>
                 <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-12 w-full" />
            </CardFooter>
        </Card>
    </div>
);


export default function LoanApplicationPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loanAmount, setLoanAmount] = useState(0);
    const [showAltPayee, setShowAltPayee] = useState(false);
    const { data: loanData, isLoading: loadingLoanData } = useUserLoanData();
    const applyLoanMutation = useApplyForLoan();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        applyLoanMutation.mutate(formData, {
            onSuccess: () => {
                setIsSubmitted(true);
            }
        });
    };
    
    if (loadingLoanData) {
        return <LoanApplicationSkeleton />;
    }

    const maxLoanable = loanData?.maxLoanableAmount || 0;
    const isAmountInvalid = loanAmount > maxLoanable;


  return (
    <div className="space-y-8">
        <Button asChild variant="outline">
          <Link href="/loan">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Loan Status
          </Link>
        </Button>

        <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Loan Application Form</CardTitle>
            <CardDescription>Complete the necessary information to apply for your loan.</CardDescription>
            </CardHeader>
            <CardContent>
                {isSubmitted ? (
                     <div className="flex flex-col items-center justify-center text-center p-12 bg-green-50/50 dark:bg-green-900/10 rounded-lg">
                        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
                        <h2 className="font-headline text-2xl font-bold text-green-700 dark:text-green-300">
                            Your application has been submitted successfully
                        </h2>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            Your loan application has been sent for review. You will be contacted upon approval.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                         <fieldset disabled={applyLoanMutation.isPending} className="space-y-8 group">
                            <div className="space-y-4">
                                <h3 className="font-headline text-xl font-semibold border-b pb-2">Loan Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div>
                                        <Label htmlFor="loanAmount">Loan Amount (Max: ৳{maxLoanable.toLocaleString('en-US')})</Label>
                                        <Input 
                                            id="loanAmount" 
                                            name="loanAmount" 
                                            type="number" 
                                            max={maxLoanable} 
                                            placeholder="Enter loan amount" 
                                            required 
                                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                                        />
                                        {isAmountInvalid && (
                                            <p className="text-xs text-destructive mt-1">
                                                Exceeds your maximum loanable amount.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="repaymentPeriod">Repayment Period</Label>
                                        <Select name="repaymentPeriod" required>
                                            <SelectTrigger id="repaymentPeriod">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 Month</SelectItem>
                                                <SelectItem value="3">3 Months</SelectItem>
                                                <SelectItem value="6">6 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="loanReason">Reason for Loan</Label>
                                        <Textarea id="loanReason" name="loanReason" placeholder="Briefly explain why you need the loan" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                                        <Textarea name="additionalInfo" id="additionalInfo" placeholder="Provide any extra details related to the loan" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-headline text-xl font-semibold border-b pb-2">Guarantor Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div>
                                        <Label htmlFor="guarantorName">Guarantor&apos;s Name</Label>
                                        <Input name="guarantorName" id="guarantorName" placeholder="Guarantor's full name" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="guarantorPhone">Mobile Number</Label>
                                        <Input name="guarantorPhone" id="guarantorPhone" placeholder="Guarantor's mobile number" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="guarantorAddress">Address</Label>
                                        <Textarea name="guarantorAddress" id="guarantorAddress" placeholder="Guarantor's current address" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="guarantorNidNumber">NID / Birth Certificate No.</Label>
                                        <Input name="guarantorNidNumber" id="guarantorNidNumber" placeholder="NID or Birth Certificate No." required />
                                    </div>
                                    <div>
                                        <Label htmlFor="guarantorNidCopy">NID / Birth Certificate Copy</Label>
                                        <Input name="guarantorNidCopy" id="guarantorNidCopy" type="file" required />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-headline text-xl font-semibold border-b pb-2">Special Circumstances</h3>
                                <div className="pt-4 space-y-2">
                                    <Label>Who will repay the loan if the guarantor passes away?</Label>
                                    <Select name="deathPayee" onValueChange={(value) => setShowAltPayee(value === 'other')} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a person" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="father">Father</SelectItem>
                                            <SelectItem value="mother">Mother</SelectItem>
                                            <SelectItem value="brother">Brother</SelectItem>
                                            <SelectItem value="sister">Sister</SelectItem>
                                            <SelectItem value="spouse">Spouse</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {showAltPayee && (
                                    <div className="space-y-4 pt-4 border-t mt-6">
                                        <h4 className="font-headline text-lg font-semibold">Alternate Payee Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            <div>
                                                <Label htmlFor="altPayeeName">Name</Label>
                                                <Input name="altPayeeName" id="altPayeeName" placeholder="Alternate person's name" />
                                            </div>
                                            <div>
                                                <Label htmlFor="altPayeeRelation">Relationship</Label>
                                                <Input name="altPayeeRelation" id="altPayeeRelation" placeholder="Relationship to you" />
                                            </div>
                                            <div>
                                                <Label htmlFor="altPayeePhone">Mobile Number</Label>
                                                <Input name="altPayeePhone" id="altPayeePhone" placeholder="Alternate person's mobile" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label htmlFor="altPayeeAddress">Address</Label>
                                                <Textarea name="altPayeeAddress" id="altPayeeAddress" placeholder="Alternate person's address" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </fieldset>
                        <CardFooter className="p-0 pt-4">
                            <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={applyLoanMutation.isPending || isAmountInvalid}>
                                {applyLoanMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Submit Application'}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
