import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time for better performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for longer
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry less aggressively for better performance
      retry: 1,
      // Reduce refetch frequency
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry failed mutations only once
      retry: 1,
    },
  },
});

// Prefetch common queries on app start
export const prefetchCommonQueries = async () => {
  // Add prefetching for commonly used data here
  // Example:
  // await queryClient.prefetchQuery({
  //   queryKey: ['user'],
  //   queryFn: fetchCurrentUser,
  // });
};
