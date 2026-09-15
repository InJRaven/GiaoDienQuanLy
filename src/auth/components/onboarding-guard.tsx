import { Outlet } from 'react-router';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from '../context/auth-context';
import { OnboardingPage } from '../pages/onboarding-page';

/**
 * OnboardingGuard renders internal business routes (Dashboard) in the background
 * and displays the centered OnboardingPage modal on top if email verification
 * or initial password change is still pending.
 */
export function OnboardingGuard() {
  const { profile, loading, isAuthenticated } = useAuth();

  // Initial boot check
  if (loading) {
    return <ScreenLoader />;
  }

  // Not authenticated handled by RequireAuth
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Check onboarding flags
  const needsEmailVerification = profile?.emailVerified === false;
  const needsPasswordChange = profile?.mustChangePassword === true;
  const showOnboarding = needsEmailVerification || needsPasswordChange;

  return (
    <>
      <Outlet />
      {showOnboarding && <OnboardingPage isModal={true} />}
    </>
  );
}
