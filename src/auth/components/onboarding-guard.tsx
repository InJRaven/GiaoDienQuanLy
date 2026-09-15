import { Navigate, Outlet } from 'react-router';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from '../context/auth-context';

/**
 * OnboardingGuard protects all internal business routes.
 * 
 * Rules:
 * 1. If session is loading, display ScreenLoader.
 * 2. If authenticated and either flag is pending:
 *    - profile.emailVerified === false -> redirect to /auth/onboarding (Step 1)
 *    - profile.mustChangePassword === true -> redirect to /auth/onboarding (Step 2)
 * 3. Prevents bypass via direct URL typing, sidebar navigation, or browser Back.
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

  if (needsEmailVerification || needsPasswordChange) {
    return <Navigate to="/auth/onboarding" replace />;
  }

  return <Outlet />;
}
