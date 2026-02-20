'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@repo/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

type FeedbackType = 'bug' | 'feedback';

type FeedbackCategory = 'general' | 'idea' | 'something_wrong' | 'praise' | 'other';

const RATING_MAX = 5;

export function FeedbackForm() {
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [context, setContext] = useState('');
  const [expected, setExpected] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<'bug' | 'feedback' | null>(null);

  function resetForm() {
    setMessage('');
    setRating(null);
    setContext('');
    setExpected('');
    setCategory('general');
    setType('feedback');
    setSubmittedType(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(type === 'bug' ? 'Please describe what happened.' : 'Please enter your feedback.');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        message: message.trim(),
      };
      if (rating != null) body.rating = rating;
      if (type === 'bug') {
        if (context.trim()) body.context = context.trim();
        if (expected.trim()) body.expected = expected.trim();
      } else {
        body.category = category;
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong. Try again.');
        return;
      }
      setSubmittedType(type);
      setMessage('');
      setRating(null);
      setContext('');
      setExpected('');
      setCategory('general');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedType !== null) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-muted/30 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-heading text-lg font-semibold uppercase tracking-wider text-foreground">
                {submittedType === 'bug' ? 'Bug report received' : 'Thanks for your feedback'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {submittedType === 'bug'
                  ? "We've received your bug report and will get back to you."
                  : "We've received your message and really appreciate you taking the time."}
              </p>
            </div>
          </div>
          {submittedType === 'bug' && (
            <div className="w-full space-y-2 rounded-md border border-border bg-background p-4 text-sm">
              <p className="font-medium text-foreground">
                When to expect a reply
              </p>
              <p className="text-muted-foreground">
                We aim to reply within <strong>1–3 working days</strong>. We're a small team and we're working as hard as we can to resolve issues as quickly as possible while holding down day jobs elsewhere. We really appreciate your patience.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={resetForm}>
            Submit another
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 font-heading text-cta uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="feedback-type">What is this?</Label>
        <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
          <SelectTrigger id="feedback-type" className="h-9 w-full pl-3 pr-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feedback">Feedback or idea</SelectItem>
            <SelectItem value="bug">Bug report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          How satisfied are you with PLOT right now?{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </legend>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="sr-only">1 = Not at all, 5 = Very satisfied</span>
          {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(rating === value ? null : value)}
              aria-pressed={rating === value}
              aria-label={`${value}${value === 1 ? ', Not at all' : value === RATING_MAX ? ', Very satisfied' : ''}`}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors',
                rating === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'
              )}
            >
              {value}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">1 = Not at all · 5 = Very satisfied</span>
        </div>
      </fieldset>

      {type === 'bug' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="feedback-context">
              What were you doing? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="feedback-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Budget page, clicking Save on a category"
              maxLength={500}
              className="font-body normal-case"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-expected">
              What did you expect? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="feedback-expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="e.g. The category should save and show updated totals"
              maxLength={500}
              className="font-body normal-case"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">What actually happened? *</Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you saw (error message, wrong behaviour, etc.)"
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
        </>
      )}

      {type === 'feedback' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="feedback-category">Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger id="feedback-category" className="h-9 w-full pl-3 pr-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="idea">Idea / suggestion</SelectItem>
                <SelectItem value="something_wrong">Something's wrong</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your feedback *</Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, ideas, or suggestions…"
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : type === 'bug' ? 'Send bug report' : 'Send feedback'}
      </Button>
    </form>
  );
}
