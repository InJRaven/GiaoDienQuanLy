import { Link, useLocation } from 'react-router';
import { MenuConfig, MenuItem } from '@/config/types';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { useMenu } from '@/hooks/use-menu';
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSeparator,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { UniversalIcon } from './universal-icon';

export function SidebarMenuSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full py-1">
      {/* Group 1: Dashboards */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="size-3 rounded ms-auto" />
        </div>
      </div>

      <div className="border-t border-border/40 mx-2 my-1" />

      {/* Group 2: Management */}
      <div className="flex flex-col gap-1">
        <div className="px-3 py-1">
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="size-3 rounded ms-auto" />
        </div>
        <div className="ps-8 flex flex-col gap-1.5 py-1">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </div>

      <div className="border-t border-border/40 mx-2 my-1" />

      {/* Group 3: System */}
      <div className="flex flex-col gap-1">
        <div className="px-3 py-1">
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SidebarMenu({ items }: { items?: MenuConfig }) {
  const { menuItems, isLoading } = useDynamicMenu();
  const { pathname } = useLocation();
  const { isActive } = useMenu(pathname);

  // If dynamic menu is loading and no explicit items were passed, show skeleton
  if (!items && isLoading) {
    return <SidebarMenuSkeleton />;
  }

  const currentItems = items || menuItems;

  const renderMenuItem = (item: MenuItem, index: number) => {
    // 1. Separator
    if (item.separator) {
      return <AccordionMenuSeparator key={`sep-${index}`} />;
    }

    // 2. Heading
    if (item.heading) {
      return (
        <AccordionMenuLabel key={`heading-${index}`}>
          {item.heading}
        </AccordionMenuLabel>
      );
    }

    // 3. Parent Submenu (with children)
    if (item.children && item.children.length > 0) {
      const itemKey = item.key || item.title || `sub-${index}`;
      return (
        <AccordionMenuSub key={itemKey} value={itemKey}>
          <AccordionMenuSubTrigger>
            {item.icon && (
              <UniversalIcon icon={item.icon} className="size-4 shrink-0" />
            )}
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ms-auto rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="multiple"
            parentValue={itemKey}
            collapsible
          >
            {item.children.map((child, childIdx) =>
              renderMenuItem(child, childIdx),
            )}
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    }

    // 4. Leaf item (Link)
    const itemKey = item.key || item.path || `item-${index}`;
    const active = item.path ? isActive(item.path) : false;

    return (
      <AccordionMenuItem key={itemKey} value={item.path || itemKey} asChild>
        <Link
          to={item.path || '#'}
          className="flex w-full items-center gap-2"
          data-active={active || undefined}
        >
          {item.icon && (
            <UniversalIcon icon={item.icon} className="size-4 shrink-0" />
          )}
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <span className="ms-auto rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {item.badge}
            </span>
          )}
        </Link>
      </AccordionMenuItem>
    );
  };

  return (
    <AccordionMenu
      type="multiple"
      selectedValue={pathname}
      matchPath={isActive}
      className="w-full"
    >
      <AccordionMenuGroup>
        {currentItems.map((item, idx) => renderMenuItem(item, idx))}
      </AccordionMenuGroup>
    </AccordionMenu>
  );
}
