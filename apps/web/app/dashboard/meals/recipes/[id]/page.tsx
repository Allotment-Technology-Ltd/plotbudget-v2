import { RecipeDetailClient } from '@/components/meals/recipe-detail-client';

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div data-testid="recipe-detail-page">
      <RecipeDetailClient recipeId={id} />
    </div>
  );
}
