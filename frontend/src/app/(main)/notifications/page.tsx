'use client';

import { MainLayout } from '@/components/layouts/main-layout';
import NotificationList from '@/components/notifications/notification-list';

export default function NotificationsPageWrapper() {
  return (
    <MainLayout>
      <NotificationList />
    </MainLayout>
  );
}
