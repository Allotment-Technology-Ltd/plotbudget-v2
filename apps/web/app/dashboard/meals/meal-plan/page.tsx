import { MealPlanPageClient } from '@/components/meals/meal-plan-page-client';

export default function MealPlanPage() {
  return (
    <div className="content-wrapper section-padding" data-testid="meal-plan-page">
      <MealPlanPageClient />
    </div>
  );
}
