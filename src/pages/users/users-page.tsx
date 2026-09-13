import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { useAuth } from '@/auth/context/auth-context';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserTable } from './components/user-table';

export function UsersPage() {
  const { can, isAdmin, hasRole } = useAuth();
  const canView = can('users:view') || hasRole('admin') || isAdmin;

  if (!canView) {
    return (
      <Container width="fluid" className="flex flex-col gap-5 py-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Employees Management" />
            <ToolbarDescription>
              Manage employee accounts and system credentials.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <ShieldAlert className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Access Denied
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You do not have permission (<code>users:view</code>) to view the employee list. Please contact your system administrator to request access.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container width="fluid" className="flex flex-col gap-5 py-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Employees Management" />
          <ToolbarDescription>
            Manage employee accounts, profile details, login access, and role assignments.
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      <UserTable />
    </Container>
  );
}
