import React from 'react';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { RiErrorWarningFill } from '@remixicon/react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

/**
 * Global QueryClient singleton.
 * Shared across the entire application to ensure cache clearing on logout/login affects all components.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = error.message || 'Something went wrong. Please try again.';
      toast.custom(
        () =>
          React.createElement(
            Alert,
            { variant: 'mono', icon: 'destructive', close: false },
            React.createElement(
              AlertIcon,
              null,
              React.createElement(RiErrorWarningFill),
            ),
            React.createElement(AlertTitle, null, message),
          ),
        {
          position: 'top-center',
        },
      );
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
