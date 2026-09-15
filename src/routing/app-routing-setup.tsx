import { AuthRouting } from '@/auth/auth-routing';
import { OnboardingGuard } from '@/auth/components/onboarding-guard';
import { RequireAuth } from '@/auth/require-auth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { SubjectsPage } from '@/pages/coursera';
import { CustomerOrdersPage } from '@/pages/customer_order';
import { Dashboards } from '@/pages/dashboards';
import { MenuPage } from '@/pages/menu';
import { RolesPage } from '@/pages/roles';
import { UserProfilePage } from '@/pages/user_profile';
import { UsersPage } from '@/pages/users';
import { Navigate, Route, Routes } from 'react-router';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        {/* Onboarding page redirects to dashboard where modal is displayed */}
        <Route path="/auth/onboarding" element={<Navigate to="/" replace />} />

        {/* Protected routes wrapped in OnboardingGuard */}
        <Route element={<OnboardingGuard />}>
          <Route element={<Demo1Layout />}>
            <Route index element={<Dashboards />} />
            <Route path="/" element={<Dashboards />} />
          {/* COURSERA PAGES */}
          <Route path="/coursera/subjects" element={<SubjectsPage />} />
          <Route path="/coursera/customers" element={<CustomerOrdersPage />} />
          <Route
            path="/coursera/customer-orders"
            element={<Navigate to="/coursera/customers" replace />}
          />
          {/* MENU MANAGEMENT PAGE */}
          <Route path="/settings/menus" element={<MenuPage />} />
          {/* USERS & COLLABORATORS MANAGEMENT (NHÂN SỰ) */}
          <Route path="/users" element={<UsersPage />} />
          <Route
            path="/users/list"
            element={<Navigate to="/users" replace />}
          />
          <Route
            path="/users/new"
            element={<Navigate to="/users" replace />}
          />
          {/* ROLES & PERMISSIONS PAGE */}
          <Route path="/roles" element={<RolesPage />} />
          {/* USER PROFILE ROUTES */}
          <Route
            path="/account/profile"
            element={<UserProfilePage mode="my_profile" />}
          />
          <Route
            path="/account/home/user-profile"
            element={<Navigate to="/account/profile" replace />}
          />
          <Route
            path="/public-profile/profiles/default"
            element={<Navigate to="/account/profile" replace />}
          />
          <Route
            path="/users/:id/profile"
            element={<UserProfilePage mode="admin" />}
          />
        </Route>
      </Route>
    </Route>
    <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
