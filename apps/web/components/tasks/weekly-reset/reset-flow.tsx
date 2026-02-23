'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { useTasks, useGenerateRoutineTasks, useUpdateTask, useFairness } from '@/hooks/use-tasks';
import type { Task } from '@repo/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@repo/ui';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

const STEPS = 5;

const NEXT_ASSIGN: Record<string, 'me' | 'partner' | 'both' | 'unassigned'> = {
  me: 'partner',
  partner: 'both',
  both: 'unassigned',
  unassigned: 'me',
};

export function ResetFlow({
  displayName,
  assigneeLabels,
}: {
  displayName: string;
  assigneeLabels?: AssigneeLabels;
}) {
  const labels = assigneeLabels ?? { me: 'Me', partner: 'Partner', both: 'Both of us', unassigned: 'Unassigned' };
  const [step, setStep] = useState(0);
  const [skippedTaskIds, setSkippedTaskIds] = useState<Set<string>>(new Set());
  const generateRoutine = useGenerateRoutineTasks();
  const { data: tasks = [] } = useTasks({ limit: 100 });
  const updateTask = useUpdateTask();
  const fairness = useFairness(30);

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekTasks = tasks.filter(
    (t) => t.due_date && isWithinInterval(new Date(t.due_date), { start: thisWeekStart, end: thisWeekEnd })
  );
  const routineTasks = tasks.filter((t) => t.routine_id && !skippedTaskIds.has(t.id));
  const routineTasksThisWeek = routineTasks.filter(
    (t) => t.due_date && isWithinInterval(new Date(t.due_date), { start: thisWeekStart, end: thisWeekEnd })
  );
  const unassignedTasks = tasks.filter(
    (t) => (t.assigned_to === 'unassigned' || !t.assigned_to) && t.status !== 'done' && !skippedTaskIds.has(t.id)
  );

  const handleLetsGo = () => {
    generateRoutine.mutate(undefined, {
      onSettled: () => setStep(1),
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3">
        <div className="flex gap-2">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition',
                i === step ? 'bg-module-tasks scale-110' : 'bg-muted'
              )}
              aria-hidden
            />
          ))}
        </div>
        <Link
          href="/dashboard/tasks"
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Exit Weekly Reset"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>

      <main className="flex-1 overflow-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepGreeting
              key="greeting"
              displayName={displayName}
              weekTaskCount={weekTasks.length}
              onLetsGo={handleLetsGo}
              isGenerating={generateRoutine.isPending}
            />
          )}
          {step === 1 && (
            <StepReviewTasks
              key="review"
              tasks={routineTasksThisWeek}
              assigneeLabels={labels}
              onSkip={(id) => setSkippedTaskIds((s) => new Set(s).add(id))}
              onReassign={(id, assigned_to) => updateTask.mutate({ id, assigned_to })}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepClaimSwap
              key="claim"
              unassignedTasks={unassignedTasks}
              assigneeLabels={labels}
              onAssign={(id, assigned_to) => updateTask.mutate({ id, assigned_to })}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepDeadlines key="deadlines" tasks={weekTasks} onNext={() => setStep(4)} />
          )}
          {step === 4 && (
            <StepComplete
              key="complete"
              tasks={tasks}
              fairness={fairness}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepGreeting({
  displayName,
  weekTaskCount,
  onLetsGo,
  isGenerating,
}: {
  displayName: string;
  weekTaskCount: number;
  onLetsGo: () => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-md space-y-8 pt-4"
    >
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider text-foreground sm:text-3xl">
          Hey {displayName} 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          It&apos;s time for your Weekly Reset. Let&apos;s sort out the week ahead.
        </p>
        {weekTaskCount > 0 && (
          <p className="text-sm text-muted-foreground">
            You have {weekTaskCount} task{weekTaskCount !== 1 ? 's' : ''} on the list this week.
          </p>
        )}
      </div>
      <Button onClick={onLetsGo} disabled={isGenerating} className="w-full">
        {isGenerating ? 'Preparing…' : "Let's go"}
      </Button>
    </motion.div>
  );
}

function assigneeInitial(assigned_to: string | null, labels: AssigneeLabels): string {
  const key = assigned_to === 'me' || assigned_to === 'partner' || assigned_to === 'both' ? assigned_to : 'unassigned';
  const label = labels[key];
  if (key === 'both') return 'B';
  if (key === 'unassigned') return '?';
  return label.charAt(0).toUpperCase() || (key === 'me' ? 'M' : 'P');
}

function StepReviewTasks({
  tasks,
  assigneeLabels,
  onSkip,
  onReassign,
  onNext,
}: {
  tasks: Task[];
  assigneeLabels: AssigneeLabels;
  onSkip: (id: string) => void;
  onReassign: (id: string, assigned_to: 'me' | 'partner' | 'both' | 'unassigned') => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-md space-y-8 pt-4"
    >
      <div>
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground">
          Review auto-generated tasks
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          From your routines. Reassign or skip any.
        </p>
      </div>
      <ul className="space-y-3">
        {tasks.map((t) => {
          const current = (t.assigned_to === 'me' || t.assigned_to === 'partner' || t.assigned_to === 'both' ? t.assigned_to : 'unassigned') as keyof typeof NEXT_ASSIGN;
          const next = NEXT_ASSIGN[current] ?? 'me';
          const nextLabel = assigneeLabels[next];
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{t.effort_level ?? 'medium'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReassign(t.id, next)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    t.assigned_to === 'me' && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
                    t.assigned_to === 'partner' && 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                    t.assigned_to === 'both' && 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
                    (t.assigned_to === 'unassigned' || !t.assigned_to) && 'bg-muted text-muted-foreground'
                  )}
                  title={nextLabel}
                >
                  {assigneeInitial(t.assigned_to ?? 'unassigned', assigneeLabels)}
                </button>
                <Button variant="ghost" className="h-8 px-2 text-sm" onClick={() => onSkip(t.id)}>
                  Skip
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No routine tasks this week.</p>
      )}
      <Button onClick={onNext} className="w-full">
        Next
      </Button>
    </motion.div>
  );
}

function StepClaimSwap({
  unassignedTasks,
  assigneeLabels,
  onAssign,
  onNext,
}: {
  unassignedTasks: Task[];
  assigneeLabels: AssigneeLabels;
  onAssign: (id: string, assigned_to: 'me' | 'partner' | 'both') => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-md space-y-8 pt-4"
    >
      <div>
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground">
          Claim & swap
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign unassigned tasks to you, your partner, or both.
        </p>
      </div>
      {unassignedTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No unassigned tasks.</p>
      ) : (
        <ul className="space-y-2">
          {unassignedTasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
              <span className="min-w-0 flex-1 text-sm text-foreground">{t.name}</span>
              <Button variant="outline" className="h-8 px-2 text-sm" onClick={() => onAssign(t.id, 'me')}>
                {assigneeLabels.me}
              </Button>
              <Button variant="outline" className="h-8 px-2 text-sm" onClick={() => onAssign(t.id, 'partner')}>
                {assigneeLabels.partner}
              </Button>
              <Button variant="outline" className="h-8 px-2 text-sm" onClick={() => onAssign(t.id, 'both')}>
                {assigneeLabels.both}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={onNext} className="w-full">
        Next
      </Button>
    </motion.div>
  );
}

function StepDeadlines({ tasks, onNext }: { tasks: Task[]; onNext: () => void }) {
  const byDay = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const day = t.due_date ? format(new Date(t.due_date), 'EEE d MMM') : 'No date';
    if (!acc[day]) acc[day] = [];
    acc[day].push(t);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort(
    (a, b) => (byDay[a][0]?.due_date ? new Date(byDay[a][0].due_date).getTime() : 0) - (byDay[b][0]?.due_date ? new Date(byDay[b][0].due_date).getTime() : 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-md space-y-8 pt-4"
    >
      <div>
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground">
          Upcoming deadlines
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This week&apos;s due dates.
        </p>
      </div>
      <ul className="space-y-4">
        {days.map((day) => (
          <li key={day}>
            <h3 className="text-sm font-medium text-muted-foreground">{day}</h3>
            <ul className="mt-1 space-y-1">
              {byDay[day].map((t) => (
                <li key={t.id} className="rounded border border-border bg-card px-3 py-2 text-sm text-foreground">
                  {t.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No deadlines this week.</p>
      )}
      <Button onClick={onNext} className="w-full">
        Next
      </Button>
    </motion.div>
  );
}

function StepComplete({
  tasks,
  fairness,
}: {
  tasks: Task[];
  fairness: { myCount: number; partnerCount: number; isBalanced: boolean };
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const myTasks = tasks.filter((t) => t.assigned_to === 'me' && t.status !== 'done');
  const partnerTasks = tasks.filter((t) => t.assigned_to === 'partner' && t.status !== 'done');

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-md space-y-8 pt-4"
    >
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: Math.cos((i / 24) * Math.PI * 2) * 120,
                y: Math.sin((i / 24) * Math.PI * 2) * 120,
              }}
              transition={{ duration: 1.2 }}
              className="absolute h-2 w-2 rounded-full bg-module-tasks"
              style={{ transform: 'translate(0, 0)' }}
            />
          ))}
        </div>
      )}
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider text-foreground">
          All sorted ✨
        </h1>
        <p className="text-muted-foreground">
          {myTasks.length} task{myTasks.length !== 1 ? 's' : ''} for you, {partnerTasks.length} for your partner this week.
        </p>
        {fairness.isBalanced && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Fairness this month looks balanced.
          </p>
        )}
      </div>
      <Link href="/dashboard" className="block">
        <Button className="w-full">Back to Home</Button>
      </Link>
    </motion.div>
  );
}
