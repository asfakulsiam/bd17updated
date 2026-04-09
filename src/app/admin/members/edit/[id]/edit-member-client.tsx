'use client';

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
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Member } from "@/types";
import { useUpdateMember } from "@/hooks/use-members";
import { useRouter } from "next/navigation";
import { getValidImageSrc } from "@/lib/utils";


export function EditMemberClient({ member }: { member: Partial<Member> }) {
    const id = member.id as string;
    const router = useRouter();
    const updateMemberMutation = useUpdateMember(id);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        updateMemberMutation.mutate(formData, {
          onSuccess: () => {
            router.push(`/admin/members/${id}`);
          }
        });
    };

    const formatDateForInput = (dateString?: string | null): string => {
      if (!dateString) return '';
      try {
        // Create a date object, which will be in the local timezone of the server/browser.
        const date = new Date(dateString);
        // If the date is invalid, return empty.
        if (isNaN(date.getTime())) return '';
        // The toISOString() method returns a string in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ), which is always in UTC.
        // To get the correct date in the user's local timezone, we need to account for the timezone offset.
        const tzOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
        return localISOTime;
      } catch (e) {
        return '';
      }
    };
    
  return (
    <div className="space-y-8">
        <Button asChild variant="outline">
          <Link href={`/admin/members/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Member Details
          </Link>
        </Button>
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-5xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Edit Member Profile</CardTitle>
            <CardDescription>Update personal and financial information for {member.fullNameEn}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
              <fieldset disabled={updateMemberMutation.isPending} className="space-y-8 group">
                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                          <div className="space-y-2">
                              <Label htmlFor="fullNameBn">Full Name (Bangla)</Label>
                              <Input id="fullNameBn" name="fullNameBn" defaultValue={member.fullNameBn || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="fullNameEn">Full Name (English)</Label>
                              <Input id="fullNameEn" name="fullNameEn" defaultValue={member.fullNameEn || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="fatherName">Father&apos;s Name</Label>
                              <Input id="fatherName" name="fatherName" defaultValue={member.fatherName || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="motherName">Mother&apos;s Name</Label>
                              <Input id="motherName" name="motherName" defaultValue={member.motherName || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="nid">NID / Birth Certificate No.</Label>
                              <Input id="nid" name="nid" defaultValue={member.nid || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="dob">Date of Birth</Label>
                              <Input id="dob" name="dob" type="date" defaultValue={formatDateForInput(member.dob)} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="bloodGroup">Blood Group</Label>
                              <Select name="bloodGroup" defaultValue={member.bloodGroup || ''}>
                              <SelectTrigger id="bloodGroup">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                              </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="maritalStatus">Marital Status</Label>
                              <Select name="maritalStatus" defaultValue={member.maritalStatus || ''}>
                              <SelectTrigger id="maritalStatus">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="married">Married</SelectItem>
                                  <SelectItem value="unmarried">Unmarried</SelectItem>
                              </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="religion">Religion</Label>
                              <Input id="religion" name="religion" defaultValue={member.religion || ''} />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="currentAddress">Current Address</Label>
                          <Textarea id="currentAddress" name="currentAddress" defaultValue={member.currentAddress || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="permanentAddress">Permanent Address</Label>
                          <Textarea id="permanentAddress" name="permanentAddress" defaultValue={member.permanentAddress || ''} />
                      </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Contact &amp; Education</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="mobilePrimary">Mobile Number (Primary)</Label>
                          <Input id="mobilePrimary" name="mobilePrimary" defaultValue={member.mobilePrimary || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="mobileAlternate">Alternate Mobile Number</Label>
                          <Input id="mobileAlternate" name="mobileAlternate" defaultValue={member.mobileAlternate || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" name="email" defaultValue={member.email || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="sscBatch">SSC Batch</Label>
                          <Input id="sscBatch" name="sscBatch" defaultValue={member.sscBatch || ''} />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                          <Label htmlFor="otherEducation">Other Educational Qualifications</Label>
                          <Input id="otherEducation" name="otherEducation" defaultValue={member.otherEducation || ''} />
                      </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Professional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="profession">Profession</Label>
                          <Input id="profession" name="profession" defaultValue={member.profession || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="workplace">Workplace</Label>
                          <Input id="workplace" name="workplace" defaultValue={member.workplace || ''} />
                      </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Bank Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                          <div className="space-y-2">
                              <Label htmlFor="bankName">Bank Name</Label>
                              <Input id="bankName" name="bankName" defaultValue={member.bankName || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="branch">Branch</Label>
                              <Input id="branch" name="branch" defaultValue={member.branch || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="accountNumber">Account Number</Label>
                              <Input id="accountNumber" name="accountNumber" defaultValue={member.accountNumber || ''} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="accountType">Account Type</Label>
                              <Select name="accountType" defaultValue={member.accountType || ''}>
                              <SelectTrigger id="accountType">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="savings">Savings</SelectItem>
                                  <SelectItem value="current">Current</SelectItem>
                              </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                              <Label htmlFor="bankingMethod">Banking Method</Label>
                              <Input id="bankingMethod" name="bankingMethod" defaultValue={member.bankingMethod || ''} />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">Nominee Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="nomineeName">Nominee&apos;s Name</Label>
                          <Input id="nomineeName" name="nomineeName" defaultValue={member.nomineeName || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="nomineeRelation">Relation</Label>
                          <Input id="nomineeRelation" name="nomineeRelation" defaultValue={member.nomineeRelation || ''} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="nomineeMobile">Mobile Number</Label>
                          <Input id="nomineeMobile" name="nomineeMobile" defaultValue={member.nomineeMobile || ''} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="nomineeAddress">Address</Label>
                          <Textarea id="nomineeAddress" name="nomineeAddress" defaultValue={member.nomineeAddress || ''} />
                      </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h3 className="font-headline text-xl font-semibold border-b pb-2">
                          <ImageIcon className="inline-block mr-2" />
                          Attachments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-start">
                          <div className="space-y-2">
                              <Label>Current Photo</Label>
                              <Image src={getValidImageSrc(member.photoUrl)} alt="Member Photo" width={150} height={150} className="rounded-md border p-1" />
                              <Label htmlFor="photo">Change Photo</Label>
                              <Input name="photo" id="photo" type="file" />
                          </div>
                           <div className="space-y-2">
                              <Label>Current NID Copy</Label>
                              <Image src={getValidImageSrc(member.nidCopyUrl)} alt="NID Copy" width={240} height={160} className="rounded-md border p-1" />
                              <Label htmlFor="nidCopy">Change NID Copy</Label>
                              <Input name="nidCopy" id="nidCopy" type="file" />
                          </div>
                           <div className="space-y-2">
                              <Label>Current Bank Statement</Label>
                              <Image src={getValidImageSrc(member.bankStatementUrl)} alt="Bank Statement" width={240} height={160} className="rounded-md border p-1" />
                              <Label htmlFor="bankStatement">Change Bank Statement</Label>
                              <Input name="bankStatement" id="bankStatement" type="file" />
                          </div>
                      </div>
                  </div>
              </fieldset>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={updateMemberMutation.isPending}>
              {updateMemberMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
