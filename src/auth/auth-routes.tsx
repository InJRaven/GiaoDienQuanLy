import type { RouteObject } from 'react-router';
import { BrandedLayout } from './layouts/branded';
import { ClassicLayout } from './layouts/classic';
import { CallbackPage } from './pages/callback-page';
import { ChangePasswordPage } from './pages/change-password-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SignInPage } from './pages/signin-page';
import { SignUpPage } from './pages/signup-page';

const CheckEmail = () => <div className="p-6 text-center">Check Email</div>;
const ResetPasswordChanged = () => (
  <div className="p-6 text-center">Reset Password Changed</div>
);
const ResetPasswordCheckEmail = () => (
  <div className="p-6 text-center">Reset Password Check Email</div>
);
const TwoFactorAuth = () => (
  <div className="p-6 text-center">Two Factor Auth</div>
);

// Define the auth routes
export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: <BrandedLayout />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      /* Extended examples */
      {
        path: '2fa',
        element: <TwoFactorAuth />,
      },
      {
        path: 'check-email',
        element: <CheckEmail />,
      },
      {
        path: 'reset-password/check-email',
        element: <ResetPasswordCheckEmail />,
      },
      {
        path: 'reset-password/changed',
        element: <ResetPasswordChanged />,
      },
    ],
  },
  {
    path: '',
    element: <ClassicLayout />,
    children: [
      {
        path: 'classic/signin',
        element: <SignInPage />,
      },
      {
        path: 'classic/signup',
        element: <SignUpPage />,
      },
      {
        path: 'classic/change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'classic/reset-password',
        element: <ResetPasswordPage />,
      },
      /* Extended examples */
      {
        path: 'classic/2fa',
        element: <TwoFactorAuth />,
      },
      {
        path: 'classic/check-email',
        element: <CheckEmail />,
      },
      {
        path: 'classic/reset-password/check-email',
        element: <ResetPasswordCheckEmail />,
      },
      {
        path: 'classic/reset-password/changed',
        element: <ResetPasswordChanged />,
      },
    ],
  },
  {
    path: 'callback',
    element: <CallbackPage />,
  },
];
