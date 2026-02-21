/**
 * Fairness calculation for task distribution between me and partner.
 * Used by the Tasks module to show balance (e.g. within 60/40).
 */

export interface FairnessTaskInput {
  assigned_to: 'me' | 'partner' | 'both' | 'unassigned';
  status: string;
  effort_level: 'quick' | 'medium' | 'involved';
  completed_at: string | null;
}

export interface FairnessInput {
  tasks: FairnessTaskInput[];
  periodDays: number;
}

export interface FairnessResult {
  myPercentage: number;
  partnerPercentage: number;
  myCount: number;
  partnerCount: number;
  myWeightedScore: number;
  partnerWeightedScore: number;
  isBalanced: boolean;
}

const EFFORT_WEIGHT: Record<'quick' | 'medium' | 'involved', number> = {
  quick: 1,
  medium: 2,
  involved: 4,
};

const BALANCE_THRESHOLD = 0.6;

/**
 * Compute fairness metrics for completed tasks over a period.
 * Only tasks with status 'done' and completed_at set are counted.
 * isBalanced is true when neither person exceeds 60% of weighted work.
 */
export function computeFairness(input: FairnessInput): FairnessResult {
  const completed = input.tasks.filter(
    (t) => t.status === 'done' && t.completed_at != null && t.assigned_to !== 'unassigned'
  );

  let myWeightedScore = 0;
  let partnerWeightedScore = 0;
  let myCount = 0;
  let partnerCount = 0;

  for (const t of completed) {
    const weight = EFFORT_WEIGHT[t.effort_level];
    if (t.assigned_to === 'me') {
      myWeightedScore += weight;
      myCount += 1;
    } else if (t.assigned_to === 'partner') {
      partnerWeightedScore += weight;
      partnerCount += 1;
    }
  }

  const totalWeighted = myWeightedScore + partnerWeightedScore;
  const myPercentage = totalWeighted > 0 ? myWeightedScore / totalWeighted : 0;
  const partnerPercentage = totalWeighted > 0 ? partnerWeightedScore / totalWeighted : 0;

  const isBalanced =
    totalWeighted === 0 || (myPercentage <= BALANCE_THRESHOLD && partnerPercentage <= BALANCE_THRESHOLD);

  return {
    myPercentage,
    partnerPercentage,
    myCount,
    partnerCount,
    myWeightedScore,
    partnerWeightedScore,
    isBalanced,
  };
}
