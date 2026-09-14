import { useSearchParams } from 'react-router';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { useAuth } from '@/auth/context/auth-context';
import { ShieldAlert, Users, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTable } from './components/user-table';
import { CollaboratorTable } from './components/collaborator-table';

export function UsersPage() {
  const { can, isAdmin, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canViewUsers = can('users:view') || hasRole('admin') || isAdmin;
  const canViewCollaborators =
    can('collaborators:view') || hasRole('admin') || isAdmin;

  // Determine current active tab from URL query param
  const rawTab = searchParams.get('tab');
  const activeTab =
    rawTab === 'collaborators' && canViewCollaborators
      ? 'collaborators'
      : canViewUsers
        ? 'users'
        : canViewCollaborators
          ? 'collaborators'
          : 'users';

  const handleTabChange = (newTab: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 'collaborators') {
      nextParams.set('tab', 'collaborators');
    } else {
      nextParams.delete('tab');
    }
    // Spec requirement: replace URL, don't push so browser back exits the page
    setSearchParams(nextParams, { replace: true });
  };

  if (!canViewUsers && !canViewCollaborators) {
    return (
      <Container width="fluid" className="flex flex-col gap-5 py-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Nhân sự" />
            <ToolbarDescription>
              Quản lý tài khoản nhân viên và danh sách cộng tác viên.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <ShieldAlert className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Truy cập bị từ chối
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Bạn không có quyền (<code>users:view</code> hoặc{' '}
              <code>collaborators:view</code>) để xem thông tin nhân sự. Vui
              lòng liên hệ quản trị viên hệ thống để được cấp quyền.
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
          <ToolbarPageTitle text="Nhân sự" />
          <ToolbarDescription>
            Quản lý thông tin tài khoản nhân viên, hồ sơ cá nhân và đối tác cộng
            tác viên.
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* If user has permission to view Collaborators AND Users, show 2 tabs. 
          If user lacks collaborators:view, hide the tab bar completely (Spec 1.3). */}
      {canViewCollaborators && canViewUsers ? (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-4"
        >
          <TabsList variant="line" size="md" className="border-b border-border">
            <TabsTrigger value="users" className="gap-2 cursor-pointer">
              <Users className="size-4" />
              Nhân viên
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="gap-2 cursor-pointer">
              <UserCheck className="size-4" />
              Cộng tác viên
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0 focus-visible:outline-none">
            <UserTable />
          </TabsContent>

          <TabsContent
            value="collaborators"
            className="mt-0 focus-visible:outline-none"
          >
            <CollaboratorTable />
          </TabsContent>
        </Tabs>
      ) : canViewCollaborators ? (
        <CollaboratorTable />
      ) : (
        <UserTable />
      )}
    </Container>
  );
}
