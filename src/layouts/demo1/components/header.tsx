import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { AppsDropdownMenu } from '@/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import {
  Bell,
  ChevronRight,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  MessageSquare,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Search,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link, useLocation, useNavigate } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarMenu } from './sidebar-menu';

// Helper to resolve route category and title for breadcrumb
function getPageInfo(pathname: string): { title: string; category: string } {
  if (pathname === '/' || pathname === '/dashboard') {
    return { title: 'Dashboard', category: 'Dashboards' };
  }
  if (pathname.startsWith('/coursera/subjects')) {
    return { title: 'Subjects', category: 'Coursera' };
  }
  if (pathname.startsWith('/settings/menus')) {
    return { title: 'Menu Management', category: 'Settings' };
  }
  if (pathname.startsWith('/account')) {
    return { title: 'Account Settings', category: 'Account' };
  }
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return { title: 'Dashboard', category: 'Pages' };
  const title = parts[parts.length - 1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const category =
    parts.length > 1
      ? parts[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Pages';
  return { title, category };
}

export function Header() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, storeOption } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut for Cmd+K / Ctrl+K search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pageInfo = useMemo(
    () => getPageInfo(location.pathname),
    [location.pathname],
  );

  const isCollapsed = settings.layouts.demo1.sidebarCollapse;

  const handleToggleSidebar = () => {
    storeOption('layouts.demo1.sidebarCollapse', !isCollapsed);
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleCommandNavigate = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  const displayName =
    user?.fullname ||
    (user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username || 'User');

  return (
    <>
      <header className="header fixed top-0 end-0 start-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 transition-[inset-inline-start] duration-300">
        {/* Header Left: Mobile Hamburger, Desktop Sidebar Collapse, Breadcrumb Text, Search Bar */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Drawer (< lg) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                mode="icon"
                size="icon"
                className="lg:hidden size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                title="Toggle Menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] p-0 flex flex-col bg-background"
            >
              <SheetHeader className="border-b border-border px-5 h-[70px] shrink-0 flex items-center justify-between">
                <SheetTitle asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-2.5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="font-bold text-lg text-foreground tracking-tight">
                      Metronic
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary">
                      v9.5
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex grow flex-col overflow-y-auto px-3 py-4 kt-scrollable-y">
                <SidebarMenu />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Sidebar Collapse / Expand Toggle Button (>= lg) */}
          <Button
            variant="ghost"
            mode="icon"
            size="icon"
            className="hidden lg:flex size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            onClick={handleToggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="size-4.5" />
            ) : (
              <PanelLeftClose className="size-4.5" />
            )}
          </Button>

          {/* Breadcrumb Text (replacing horizontal navbar menu) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <span className="font-medium hover:text-foreground transition-colors cursor-default hidden sm:inline">
              {pageInfo.category}
            </span>
            <ChevronRight className="size-3 text-muted-foreground/40 hidden sm:inline shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {pageInfo.title}
            </span>
          </div>

          {/* Quick Search Input Trigger (Desktop) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 hover:text-foreground rounded-lg border border-border/60 transition-all w-44 lg:w-60 justify-between ms-2 shrink-0"
            title="Search anything (Ctrl+K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-3.5 shrink-0 text-muted-foreground/80" />
              <span className="truncate">Search...</span>
            </span>
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-3xs font-medium text-muted-foreground shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Header Right: Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 1. Search Icon (Mobile / Compact) */}
          <Button
            variant="ghost"
            mode="icon"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="md:hidden size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Search (Ctrl+K)"
          >
            <Search className="size-4.5" />
          </Button>

          {/* 2. Apps Menu Dropdown */}
          <AppsDropdownMenu
            trigger={
              <Button
                variant="ghost"
                mode="icon"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Apps"
              >
                <LayoutGrid className="size-4.5" />
              </Button>
            }
          />

          {/* 3. Chat / Messages Sheet */}
          <ChatSheet
            trigger={
              <Button
                variant="ghost"
                mode="icon"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted relative"
                title="Chat & Messages"
              >
                <MessageSquare className="size-4.5" />
                <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
              </Button>
            }
          />

          {/* 4. Notifications Sheet */}
          <NotificationsSheet
            trigger={
              <Button
                variant="ghost"
                mode="icon"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted relative"
                title="Notifications"
              >
                <Bell className="size-4.5" />
                <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
              </Button>
            }
          />

          {/* 5. Theme Toggle (Sun / Moon) */}
          <Button
            variant="ghost"
            mode="icon"
            size="icon"
            onClick={handleToggleTheme}
            className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className="size-4.5 text-amber-500" />
            ) : (
              <Moon className="size-4.5" />
            )}
          </Button>

          {/* Vertical Separator */}
          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* 6. User Profile Dropdown */}
          <UserDropdownMenu
            trigger={
              <div
                className="cursor-pointer flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                title={displayName}
              >
                <div className="relative">
                  <img
                    src={
                      user?.avatar || toAbsoluteUrl('/media/avatars/300-2.png')
                    }
                    alt={displayName}
                    className="size-8.5 rounded-full object-cover border border-border"
                  />
                  <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
              </div>
            }
          />
        </div>
      </header>

      {/* Global Quick Search Command Dialog (Cmd+K / Ctrl+K) */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type a page, action, or command to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => handleCommandNavigate('/')}
              className="cursor-pointer"
            >
              <LayoutDashboard className="size-4 me-2 text-muted-foreground" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleCommandNavigate('/coursera/subjects')}
              className="cursor-pointer"
            >
              <GraduationCap className="size-4 me-2 text-muted-foreground" />
              <span>Coursera Subjects</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleCommandNavigate('/settings/menus')}
              className="cursor-pointer"
            >
              <FolderTree className="size-4 me-2 text-muted-foreground" />
              <span>Menu Management</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleCommandNavigate('/account/home/user-profile')
              }
              className="cursor-pointer"
            >
              <User className="size-4 me-2 text-muted-foreground" />
              <span>My Profile</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                handleToggleTheme();
                setSearchOpen(false);
              }}
              className="cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="size-4 me-2 text-amber-500" />
              ) : (
                <Moon className="size-4 me-2 text-muted-foreground" />
              )}
              <span>
                Toggle Theme (
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})
              </span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                handleToggleSidebar();
                setSearchOpen(false);
              }}
              className="cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeft className="size-4 me-2 text-muted-foreground" />
              ) : (
                <PanelLeftClose className="size-4 me-2 text-muted-foreground" />
              )}
              <span>
                Toggle Sidebar ({isCollapsed ? 'Expand' : 'Collapse'})
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
