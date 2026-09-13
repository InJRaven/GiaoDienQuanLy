import { Navigate, Outlet, useLocation } from 'react-router';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';

/**
 * Component to protect routes that require authentication.
 * Displays a smooth ScreenLoader while checking session on initial boot.
 * If user is not authenticated, redirects to the login page.
 */
export const RequireAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show screen loader during initial silent refresh check (Splash / Skeleton)
  if (loading) {
    return <ScreenLoader />;
  }

  // If not authenticated, redirect to login page with return URL
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // If authenticated, render child routes
  return <Outlet />;
};
