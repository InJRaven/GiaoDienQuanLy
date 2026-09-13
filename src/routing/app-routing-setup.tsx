import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth } from '@/auth/require-auth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { SubjectsPage } from '@/pages/coursera';
import { Dashboards } from '@/pages/dashboards';
import { MenuPage } from '@/pages/menu';
import { RolesPage } from '@/pages/roles';
import { UsersPage } from '@/pages/users';
import { Navigate, Route, Routes } from 'react-router';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route index element={<Dashboards />} />
          <Route path="/" element={<Dashboards />} />
          {/* COURSERA PAGE */}
          <Route path="/coursera/subjects" element={<SubjectsPage />} />
          {/* MENU MANAGEMENT PAGE */}
          <Route path="/settings/menus" element={<MenuPage />} />
          {/* USERS MANAGEMENT PAGE */}
          <Route path="/users/list" element={<UsersPage />} />
          <Route path="/users/new" element={<Navigate to="/users/list" replace />} />
          <Route path="/users" element={<Navigate to="/users/list" replace />} />
          {/* ROLES & PERMISSIONS PAGE */}
          <Route path="/roles" element={<RolesPage />} />
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
