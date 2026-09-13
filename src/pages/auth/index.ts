import React from 'react';

const PagePlaceholder = (name: string) => () =>
  React.createElement('div', { className: 'p-6' }, [
    React.createElement('h2', { key: '1', className: 'text-xl font-bold' }, name),
    React.createElement('p', { key: '2', className: 'text-muted-foreground mt-2' }, 'Trang đang được xây dựng.'),
  ]);

export const AuthAccountDeactivatedPage = PagePlaceholder('Account Deactivated');
export const AuthWelcomeMessagePage = PagePlaceholder('Welcome Message');
