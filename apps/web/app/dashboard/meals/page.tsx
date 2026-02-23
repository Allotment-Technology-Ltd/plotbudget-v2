import Link from 'next/link';
import { BookOpen, CalendarDays, ShoppingCart, ChefHat, Refrigerator } from 'lucide-react';
import { getModule } from '@repo/logic';

const cards = [
  { href: '/dashboard/meals/recipes', label: 'Recipes', icon: BookOpen, description: 'Your recipe collection' },
  { href: '/dashboard/meals/what-can-i-cook', label: 'What can I cook?', icon: ChefHat, description: 'Suggest recipes from ingredients you have' },
  { href: '/dashboard/meals/meal-plan', label: 'Meal plan', icon: CalendarDays, description: 'Plan meals for the week' },
  { href: '/dashboard/meals/pantry', label: 'Pantry', icon: Refrigerator, description: 'What you have in fridge, cupboard and pantry' },
  { href: '/dashboard/meals/grocery', label: 'Shopping list', icon: ShoppingCart, description: 'Shopping list from your plan' },
];

export default function MealsPage() {
  const moduleInfo = getModule('meals');
  const moduleColor = moduleInfo.colorLight;

  return (
    <div className="content-wrapper section-padding" data-testid="meals-hub">
      <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-2">
        {moduleInfo.name}
      </h1>
      <p className="text-muted-foreground mb-8">
        Recipes, meal planning and shopping list in one place.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderLeftWidth: 4, borderLeftColor: moduleColor }}
            data-testid={`meals-hub-${label.toLowerCase().replace(/\s+/g, '-').replace(/\?/g, '')}`}
          >
            <Icon className="h-8 w-8 shrink-0" style={{ color: moduleColor }} aria-hidden />
            <span className="font-heading text-lg uppercase tracking-wider text-foreground">
              {label}
            </span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
