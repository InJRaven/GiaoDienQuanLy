import React from 'react';

export * from './activity/account-basic-page';
export * from './api-keys/account-basic-page';
export * from './appearance/account-basic-page';
export * from './billing';
export * from './integrations/account-basic-page';
export * from './members';
export * from './notifications/account-basic-page';
export * from './security';
export * from './page-navbar';

const PagePlaceholder = (name: string) => () =>
  React.createElement('div', { className: 'p-6' }, [
    React.createElement('h2', { key: '1', className: 'text-xl font-bold' }, name),
    React.createElement('p', { key: '2', className: 'text-muted-foreground mt-2' }, 'Trang đang được xây dựng.'),
  ]);

import { UserProfilePage } from '@/pages/user_profile';

export const AccountGetStartedPage = PagePlaceholder('Account Get Started');
export const AccountUserProfilePage = () => <UserProfilePage mode="my_profile" />;
export const AccountCompanyProfilePage = PagePlaceholder('Account Company Profile');
export const AccountSettingsSidebarPage = PagePlaceholder('Account Settings Sidebar');
export const AccountSettingsEnterprisePage = PagePlaceholder('Account Settings Enterprise');
export const AccountSettingsPlainPage = PagePlaceholder('Account Settings Plain');
export const AccountSettingsModalPage = PagePlaceholder('Account Settings Modal');
export const AccountInviteAFriendPage = PagePlaceholder('Account Invite a Friend');
