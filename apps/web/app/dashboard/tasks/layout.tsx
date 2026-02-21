import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Chores, to-dos and projects',
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
