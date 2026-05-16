'use client';

import { MainLayout } from '@/components/layouts/main-layout';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
