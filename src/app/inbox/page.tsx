

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Message } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, Mail, AlertTriangle } from 'lucide-react';
import { getMessagesForUser } from '@/services/prisma/queries/messages';
import { markMessageAsRead } from '@/lib/actions/messages';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const pageText = {
  bn: {
    title: "ইনবক্স",
    description: "আপনার সকল ব্যক্তিগত বার্তা এখানে দেখুন।",
    noMessages: "এই মুহূর্তে আপনার কোনো নতুন বার্তা নেই।",
    markAsRead: "পঠিত হিসেবে চিহ্নিত করুন",
    markAsUnread: "অপঠিত হিসেবে চিহ্নিত করুন",
    sentOn: "প্রেরিত",
    errorTitle: "ত্রুটি",
    errorDescription: "বার্তা লোড করা সম্ভব হচ্ছে না।"
  },
  en: {
    title: "Inbox",
    description: "View all your personal messages here.",
    noMessages: "You have no new messages at this time.",
    markAsRead: "Mark as read",
    markAsUnread: "Mark as unread",
    sentOn: "Sent on",
    errorTitle: "Error",
    errorDescription: "Could not load messages."
  }
}

function MessageItem({ message: initialMessage }: { message: Message }) {
    const [message, setMessage] = useState(initialMessage);
    const [isPending, startTransition] = useTransition();
    const { language } = useLanguage();
    const text = pageText[language];
    const { toast } = useToast();

    const handleToggleRead = () => {
        if (message.isRead) return;

        startTransition(async () => {
            try {
                await markMessageAsRead(message.id);
                setMessage(prev => ({...prev, isRead: true}));
                toast({ title: "Message marked as read." });
            } catch(e) {
                toast({ title: "Error", description: (e as Error).message, variant: "destructive"});
            }
        });
    }

    return (
        <div 
            className={cn(
                "p-4 rounded-lg border flex items-start space-x-4 transition-colors",
                message.isRead ? "bg-card" : "bg-primary/10"
            )}
        >
            <div className="pt-1">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleRead} disabled={message.isRead}>
                        {message.isRead ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-primary" />}
                    </Button>
                )}
            </div>
            <div className="flex-1">
                <h3 className={cn("font-semibold", !message.isRead && "text-primary")}>
                    {message.title}
                </h3>
                <p className="text-sm mt-1 text-muted-foreground">{message.content}</p>
                 <p className="text-xs text-muted-foreground mt-2">
                    {text.sentOn} {new Date(message.sentAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                    })}
                </p>
            </div>
        </div>
    )
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const text = pageText[language];

  useEffect(() => {
    async function loadMessages() {
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getMessagesForUser();
        setMessages(fetchedMessages);
      } catch (err) {
        setError((err as Error).message || text.errorDescription);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [text.errorDescription]);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : error ? (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{text.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-4">
            {messages.length > 0 ? (
                messages.map(msg => (
                    <MessageItem key={msg.id} message={msg} />
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
