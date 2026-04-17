import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './app/App';
import ErrorBoundary from './components/common/ErrorBoundary';
import theme from './styles/theme';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min: datos se consideran frescos
      gcTime: 1000 * 60 * 10,          // 10 min: datos persisten en caché
      refetchOnMount: false,            // No refetch si hay datos en caché
      refetchOnWindowFocus: false,      // No refetch al volver a la ventana
      refetchOnReconnect: 'stale',      // Refetch solo si hay datos stale
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);
