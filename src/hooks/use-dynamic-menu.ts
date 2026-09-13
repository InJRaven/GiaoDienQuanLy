import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuConfig } from '@/config/types';
import { useApiQuery } from './use-api-query';

/**
 * Custom hook to fetch dynamic menu from Backend with TanStack Query caching
 *
 * Endpoint: GET /menu (or configured via endpoint argument)
 * Cache:
 * - staleTime: 10 minutes (menu data rarely changes frequently)
 * - gcTime: 30 minutes
 * Fallback: If backend endpoint is not yet available, falls back to MENU_SIDEBAR automatically.
 */
export function useDynamicMenu(endpoint: string = '/menu') {
  const query = useApiQuery<MenuConfig>(
    ['menus', 'sidebar', endpoint],
    endpoint,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes fresh
      gcTime: 30 * 60 * 1000,    // 30 minutes in cache
      retry: false,              // Don't retry if endpoint does not exist yet
    },
  );

  // Return API data if available, otherwise graceful fallback to local MENU_SIDEBAR
  const menuItems: MenuConfig =
    query.data && Array.isArray(query.data) && query.data.length > 0
      ? query.data
      : MENU_SIDEBAR;

  return {
    ...query,
    menuItems,
    isDynamic: Boolean(
      query.data && Array.isArray(query.data) && query.data.length > 0,
    ),
  };
}

