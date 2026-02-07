'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  updateHouseholdName,
  updatePartnerName,
  updateMyPartnerName,
} from '@/lib/actions/settings-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InvitePartnerForm } from './invite-partner-form';
import { PartnerStatus } from './partner-status';

interface HouseholdTabProps {
  household: {
    id: string;
    name: string | null;
    is_couple: boolean;
    partner_name: string | null;
    partner_income: number;
    partner_email?: string | null;
    partner_invite_status?: 'none' | 'pending' | 'accepted';
    partner_invite_sent_at?: string | null;
    partner_accepted_at?: string | null;
    partner_last_login_at?: string | null;
  };
  isPartner?: boolean;
}

export function HouseholdTab({ household, isPartner = false }: HouseholdTabProps) {
  const [householdName, setHouseholdName] = useState(household.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [partnerName, setPartnerName] = useState(household.partner_name || '');
  const [isPartnerSaving, setIsPartnerSaving] = useState(false);
  const [myName, setMyName] = useState(household.partner_name || '');
  const [isMyNameSaving, setIsMyNameSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateHouseholdName(household.id, householdName.trim());
      toast.success('Household updated');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update household';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnerSaving(true);
    try {
      await updatePartnerName(household.id, partnerName.trim());
      toast.success('Partner name updated');
      setPartnerDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update partner name';
      toast.error(message);
    } finally {
      setIsPartnerSaving(false);
    }
  };

  const handleMyNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMyNameSaving(true);
    try {
      await updateMyPartnerName(household.id, myName.trim());
      toast.success('Your name updated');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update your name';
      toast.error(message);
    } finally {
      setIsMyNameSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Household Details
        </h2>
        {isPartner ? (
          <p className="text-sm text-muted-foreground">
            {household.name || 'Unnamed household'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g., Smith Household"
                maxLength={50}
                disabled={isLoading}
                aria-describedby="householdName-help"
              />
              <p id="householdName-help" className="text-sm text-muted-foreground">
                A friendly name for your household.
              </p>
            </div>
            <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Save Changes
            </Button>
          </form>
        )}
      </section>

      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Household Mode
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Current mode:{' '}
            <Badge
              variant={household.is_couple ? 'default' : 'secondary'}
              className="ml-2"
            >
              {household.is_couple ? 'Couple' : 'Solo'}
            </Badge>
          </p>
          <p className="text-sm text-muted-foreground">
            To change your household mode, contact support or create a new
            household.
          </p>
        </div>
      </section>

      {household.is_couple && (
        <>
          <section className="bg-card rounded-lg border border-border p-6">
            <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
              {isPartner ? 'Your Details' : 'Partner Details'}
            </h2>
            <div className="space-y-4">
              {isPartner ? (
                <form onSubmit={handleMyNameSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="myPartnerName">Your name (as shown in this household)</Label>
                    <Input
                      id="myPartnerName"
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder="Your name"
                      maxLength={50}
                      disabled={isMyNameSaving}
                    />
                  </div>
                  <Button type="submit" disabled={isMyNameSaving} aria-busy={isMyNameSaving}>
                    {isMyNameSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    )}
                    Save
                  </Button>
                </form>
              ) : (
              <>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Partner Name
                </p>
                <p className="text-sm text-muted-foreground">
                  {household.partner_name || 'Not set'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Partner income is managed in{' '}
                <Link
                  href="/dashboard/settings?tab=income"
                  className="text-primary underline hover:no-underline"
                >
                  Settings → Income
                </Link>
                .
              </p>
              <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" type="button">
                    Edit Partner Name
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg border-border">
                  <DialogHeader>
                    <DialogTitle>Edit Partner Name</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handlePartnerSubmit}
                    className="space-y-4 pt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="partnerName">Partner Name</Label>
                      <Input
                        id="partnerName"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Partner name"
                        maxLength={50}
                        disabled={isPartnerSaving}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPartnerDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPartnerSaving}>
                        {isPartnerSaving && (
                          <Loader2
                            className="mr-2 h-4 w-4 animate-spin"
                            aria-hidden
                          />
                        )}
                        Save
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </>
              )}
            </div>
          </section>

          <section className="bg-card rounded-lg border border-border p-6">
            <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
              Partner Access
            </h2>
            {isPartner ? (
              <p className="text-sm text-muted-foreground">
                You have partner access to this household. Only the account owner can invite or remove partners.
              </p>
            ) : (
            <>
            {household.partner_invite_status === 'none' && <InvitePartnerForm />}
            {household.partner_invite_status === 'pending' && (
              <PartnerStatus
                status="pending"
                email={household.partner_email ?? null}
                sentAt={household.partner_invite_sent_at ?? undefined}
              />
            )}
            {household.partner_invite_status === 'accepted' && (
              <PartnerStatus
                status="accepted"
                email={household.partner_email ?? null}
                acceptedAt={household.partner_accepted_at ?? undefined}
                lastLoginAt={household.partner_last_login_at}
              />
            )}
            </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
