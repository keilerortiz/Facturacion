import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Custom render para tests de React Query.
 * Proporciona un QueryClient aislado para cada test.
 */
export function renderWithQueryClient(
  ui,
  {
    initialState,
    queries = [],
    mutations = [],
    ...renderOptions
  } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No reintentar en tests
        gcTime: 0, // Limpiar inmediatamente
      },
    },
  });

  // Establecer estado inicial si se proporciona
  if (initialState) {
    queryClient.setQueryData(initialState.queryKey, initialState.data);
  }

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export todo de @testing-library/react
export * from '@testing-library/react';
