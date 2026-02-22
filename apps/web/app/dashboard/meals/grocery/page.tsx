import { GroceryPageClient } from '@/components/meals/grocery-page-client';

export default function GroceryPage() {
  return (
    <div className="content-wrapper section-padding" data-testid="grocery-page">
      <GroceryPageClient />
    </div>
  );
}
