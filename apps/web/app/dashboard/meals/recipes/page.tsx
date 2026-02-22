import { RecipesPageClient } from '@/components/meals/recipes-page-client';

export default function RecipesPage() {
  return (
    <div className="content-wrapper section-padding" data-testid="recipes-page">
      <RecipesPageClient />
    </div>
  );
}
