'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { toggleRoadmapVote } from '@/lib/actions/roadmap-actions';

type RoadmapVoteButtonProps = {
  featureId: string;
  initialCount: number;
  initialVoted: boolean;
  isAuthenticated: boolean;
  canVote: boolean;
};

export function RoadmapVoteButton({
  featureId,
  initialCount,
  initialVoted,
  isAuthenticated,
  canVote,
}: RoadmapVoteButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      toast.info('Sign in to vote on roadmap features');
      router.push('/login?redirect=/roadmap');
      return;
    }
    if (!canVote) {
      toast.info('Roadmap voting is for founding members');
      return;
    }
    setLoading(true);
    const prevCount = count;
    const prevVoted = voted;
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);

    const result = await toggleRoadmapVote(featureId);
    setLoading(false);

    if (result.error) {
      setVoted(prevVoted);
      setCount(prevCount);
      toast.error(result.error);
      return;
    }
    if (result.voteCount !== undefined) setCount(result.voteCount);
    if (result.voted !== undefined) setVoted(result.voted);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || (isAuthenticated && !canVote)}
      aria-pressed={voted}
      title={isAuthenticated && !canVote ? 'Roadmap voting is for founding members' : undefined}
      aria-label={
        isAuthenticated && !canVote
          ? 'Roadmap voting is for founding members'
          : voted
            ? `Remove vote (${count} votes)`
            : `Vote for this feature (${count} votes)`
      }
      className={`
        flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2
        font-mono text-lg font-semibold tabular-nums
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:opacity-60
        ${
          voted
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
        }
      `}
    >
      <ArrowUp
        className={`h-5 w-5 ${voted ? 'text-primary' : ''}`}
        strokeWidth={2}
        aria-hidden
      />
      <span>{count}</span>
    </button>
  );
}
