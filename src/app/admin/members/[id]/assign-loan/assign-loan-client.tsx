

'use client';

import { useTransition } from "react";
import type { MemberDetailsData } from "../types";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, PiggyBank } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useManuallyAssignLoan } from "@/hooks/use-members";


export function AssignLoanClient({ memberDetails }: { memberDetails: MemberDetailsData }) {
    const router = useRouter();
    const assignLoanMutation = useManuallyAssignLoan(memberDetails.details.id);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        assignLoanMutation.mutate(formData, {
            onSuccess: () => {
                router.push(`/admin/members/${memberDetails.details.id}`);
            }
        });
    }

  return (
    <div className="space-y-8">
        <Button asChild variant="outline">
          <Link href={`/admin/members/${memberDetails.details.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Member Details
          </Link>
        </Button>

        <form onSubmit={handleSubmit}>
            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Manually Assign Loan</CardTitle>
                <CardDescription>Directly issue a loan to {memberDetails.details.fullNameEn}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <fieldset disabled={assignLoanMutation.isPending} className="space-y-8 group">
                         <div className="space-y-4">
                            <h3 className="font-headline text-xl font-semibold border-b pb-2">Loan Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <Label>Total Savings</Label>
                                    <Input value={`৳${memberDetails.financials.totalSavings.toLocaleString()}`} disabled />
                                </div>
                                 <div>
                                    <Label>Max Loanable Amount</Label>
                                    <Input value={`৳${memberDetails.financials.loanableAmount.toLocaleString()}`} disabled />
                                </div>
                                <div>
                                    <Label htmlFor="loanAmount">Loan Amount (Max: ৳{memberDetails.financials.loanableAmount.toLocaleString()})</Label>
                                    <Input id="loanAmount" name="loanAmount" type="number" max={memberDetails.financials.loanableAmount} placeholder="Enter loan amount" required />
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
                                    <Textarea id="loanReason" name="loanReason" placeholder="Reason for assigning this loan" required />
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
                                <Select name="deathPayee" required>
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
                        </div>

                    </fieldset>
                </CardContent>
                <CardFooter>
                <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={assignLoanMutation.isPending}>
                    {assignLoanMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PiggyBank className="mr-2 h-4 w-4" />}
                    {assignLoanMutation.isPending ? 'Assigning...' : 'Assign Loan'}
                </Button>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
