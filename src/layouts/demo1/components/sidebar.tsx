import { Link } from 'react-router';
import { SidebarMenu } from './sidebar-menu';

export function Sidebar() {
  return (
    <aside className="sidebar fixed top-0 bottom-0 start-0 z-20 hidden lg:flex flex-col border-r border-border bg-background">
      {/* Sidebar Header / Brand */}
      <div className="sidebar-header flex items-center justify-between border-b border-border px-5 h-[70px] shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-bold text-lg text-foreground tracking-tight">
            Metronic
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary">
            v9.5
          </span>
        </Link>
      </div>

      {/* Sidebar Menu - Scrollable */}
      <div className="flex grow flex-col overflow-y-auto px-5 py-5 kt-scrollable-y">
        <SidebarMenu />
      </div>
    </aside>
  );
}
