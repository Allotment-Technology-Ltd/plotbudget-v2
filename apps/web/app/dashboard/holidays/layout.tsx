import type { Metadata } from 'next';
import { getModule } from '@repo/logic';

const holidaysModule = getModule('holidays');

export const metadata: Metadata = {
  title: holidaysModule.name,
  description: holidaysModule.description,
};

export default function HolidaysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
