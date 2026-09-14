import { useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { BookOpen, ShieldAlert, Users } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/common/container';
import { CustomerAccountTable } from './components/customer-account-table';
import { CustomerOrderTable } from './components/customer-order-table';

export function CustomerOrdersPage() {
  const { can, isAdmin } = useAuth();
  const canView = can('customer_orders:view') || isAdmin;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'accounts' ? 'accounts' : 'orders';
  const initialAccountId = searchParams.get('accountId')
    ? Number(searchParams.get('accountId'))
    : null;

  const [currentTab, setCurrentTab] = useState<'orders' | 'accounts'>(
    initialTab,
  );
  const [filterAccountId, setFilterAccountId] = useState<number | null>(
    initialAccountId,
  );

  // Handle Tab Switch
  const handleTabChange = (val: string) => {
    const tab = val as 'orders' | 'accounts';
    setCurrentTab(tab);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  // Switch to Orders Tab filtered by specific account
  const handleViewAccountOrders = (accountId: number) => {
    setFilterAccountId(accountId);
    setCurrentTab('orders');
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', 'orders');
      p.set('accountId', String(accountId));
      return p;
    });
  };

  const handleClearAccountFilter = () => {
    setFilterAccountId(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('accountId');
      return p;
    });
  };

  if (!canView) {
    return (
      <Container width="fluid" className="flex flex-col gap-5 py-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Khách hàng Coursera" />
            <ToolbarDescription>
              Quản lý tài khoản học Coursera và các đơn hàng môn học của khách
              lẻ.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="size-12 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Không có quyền truy cập
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Bạn không có quyền <code>customer_orders:view</code> để xem thông
              tin khách hàng Coursera. Vui lòng liên hệ quản trị viên để được
              cấp quyền.
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
          <ToolbarPageTitle text="Khách hàng Coursera" />
          <ToolbarDescription>
            Quản lý tài khoản Coursera dùng chung, tiến độ học các môn, chứng
            chỉ và kiểm tra trạng thái đăng nhập.
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* Two Tabs: Đơn hàng & Tài khoản */}
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full flex flex-col gap-4"
      >
        <TabsList variant="line" size="md" className="border-b border-border">
          <TabsTrigger
            value="orders"
            className="gap-2 text-xs font-semibold py-2.5"
          >
            <BookOpen className="size-4" />
            <span>Danh sách Đơn hàng</span>
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="gap-2 text-xs font-semibold py-2.5"
          >
            <Users className="size-4" />
            <span>Tài khoản Coursera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="m-0 focus-visible:outline-none">
          <CustomerOrderTable
            filterAccountId={filterAccountId}
            onClearAccountFilter={handleClearAccountFilter}
          />
        </TabsContent>

        <TabsContent
          value="accounts"
          className="m-0 focus-visible:outline-none"
        >
          <CustomerAccountTable onViewOrders={handleViewAccountOrders} />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
