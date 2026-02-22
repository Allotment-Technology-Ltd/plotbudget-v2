import type { Metadata } from 'next';
import { getModule } from '@repo/logic';

const mealsModule = getModule('meals');

export const metadata: Metadata = {
  title: mealsModule.name,
  description: mealsModule.description,
};

export default function MealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
