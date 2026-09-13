import {
  DefaultError,
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/axios.config';

/**
 * Default Cache Configuration:
 * - staleTime: 5 minutes (data remains fresh for 5 mins, no unnecessary refetches)
 * - gcTime: 10 minutes (cached data is kept in memory for 10 mins before garbage collection)
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

export interface UseApiQueryOptions<
  TData = unknown,
  TError = DefaultError,
> extends Omit<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  'queryKey' | 'queryFn'
> {
  params?: Record<string, any>;
}

/**
 * Custom TanStack Query hook for fetching API data with built-in caching
 *
 * @template TData Expected response data type
 * @template TError Expected error type
 * @param queryKey TanStack Query Key (e.g. ['users'], ['menus', 'sidebar'])
 * @param url API endpoint path (e.g. '/menu', '/users/me')
 * @param options Query configuration options (staleTime, gcTime, params, enabled, etc.)
 */
export function useApiQuery<TData = unknown, TError = DefaultError>(
  queryKey: QueryKey,
  url: string,
  options?: UseApiQueryOptions<TData, TError>,
) {
  const { params, ...queryOptions } = options || {};

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async ({ signal }) => {
      return await api.get<TData>(url, { params, signal });
    },
    ...DEFAULT_QUERY_OPTIONS,
    ...queryOptions,
  });
}

export interface UseApiMutationOptions<
  TData = unknown,
  TVariables = void,
  TError = DefaultError,
  TOnMutateResult = unknown,
> extends UseMutationOptions<TData, TError, TVariables, TOnMutateResult> {
  invalidateKeys?: QueryKey[];
}

/**
 * Custom TanStack Query hook for mutations (POST, PUT, PATCH, DELETE)
 * Automatically invalidates relevant query caches on success if configured.
 */
export function useApiMutation<
  TData = unknown,
  TVariables = void,
  TError = DefaultError,
  TOnMutateResult = unknown,
>(
  method: 'post' | 'put' | 'patch' | 'delete',
  urlOrFn: string | ((variables: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables, TError, TOnMutateResult>,
) {
  const queryClient = useQueryClient();
  const { invalidateKeys, onSuccess, ...mutationOptions } = options || {};

  return useMutation<TData, TError, TVariables, TOnMutateResult>({
    mutationFn: async (variables: TVariables) => {
      const url = typeof urlOrFn === 'function' ? urlOrFn(variables) : urlOrFn;

      switch (method) {
        case 'post':
          return await api.post<TData>(url, variables);
        case 'put':
          return await api.put<TData>(url, variables);
        case 'patch':
          return await api.patch<TData>(url, variables);
        case 'delete':
          return await api.delete<TData>(url, { data: variables });
        default:
          throw new Error(`Unsupported mutation method: ${method}`);
      }
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      // Automatically invalidate specified query caches
      if (invalidateKeys && invalidateKeys.length > 0) {
        invalidateKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }

      if (onSuccess) {
        onSuccess(data, variables, onMutateResult, context);
      }
    },
    ...mutationOptions,
  });
}
