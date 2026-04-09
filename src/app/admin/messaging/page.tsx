
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { Member } from '@/models';
import { sendMessage } from '@/lib/actions/messages';
import { getMembersList } from '@/services/prisma/queries/members';


export default function AdminMessagingPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientType, setRecipientType] = useState('all');
  const [specificMember, setSpecificMember] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadMembers() {
        setLoading(true);
        const memberList = await getMembersList();
        setMembers(memberList);
        setLoading(false);
    }
    loadMembers();
  }, []);

  const handleSend = () => {
    if (!title || !content) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }
    if (recipientType === 'specific' && !specificMember) {
      toast({
        title: "Error",
        description: "Please select a specific member.",
        variant: "destructive",
      });
      return;
    }
    
    startTransition(async () => {
        try {
            await sendMessage(recipientType as 'all' | 'specific', specificMember || null, title, content);
            toast({
                title: "Message Sent!",
                description: `Your message has been sent.`,
            });
            // Reset form
            setTitle('');
            setContent('');
            setSpecificMember('');
        } catch (error) {
            toast({
                title: "Error",
                description: (error as Error).message,
                variant: "destructive",
            });
        }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Member Messaging</h1>
        <p className="text-muted-foreground">Send messages and notifications to your members.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
          <CardDescription>Send a message to a specific member or all members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <RadioGroup value={recipientType} onValueChange={setRecipientType} className="flex space-x-4" disabled={isPending || loading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Members</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific">Specific Member</Label>
              </div>
            </RadioGroup>
          </div>
          
          {recipientType === 'specific' && (
            <div className="space-y-2">
              <Label htmlFor="member-select">Select Member</Label>
              <Select value={specificMember} onValueChange={setSpecificMember} disabled={isPending || loading}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder={loading ? "Loading members..." : "Select a member by ID or Name"} />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullNameEn} ({member.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message-title">Message Title</Label>
            <Input 
              id="message-title"
              placeholder="Enter message title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-content">Message Content</Label>
            <Textarea
              id="message-content"
              placeholder="Write your message here..."
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSend} className="ml-auto" disabled={isPending || loading}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
