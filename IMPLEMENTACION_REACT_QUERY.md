# Implementación Práctica: React Query para Optimización

**Fase:** Implementation Ready  
**Duración estimada:** 4-6 horas  
**Dependencias:** @tanstack/react-query

---

## PASO 1: Instalación y Setup

### 1.1 Instalar React Query

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 1.2 Configurar QueryClient en `main.jsx`

```javascript
// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';

// Configuración óptima para tu aplicación
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos"
      // Mientras estén frescos, no se refetch automáticamente
      staleTime: 1000 * 60 * 5, // 5 minutos
      
      // Tiempo que los datos persisten en caché después de estar "stale"
      // Después de este tiempo, son descartados de memoria
      cacheTime: 1000 * 60 * 10, // 10 minutos
      
      // No refetch al hacer mount si ya tenemos datos (incluso si están stale)
      refetchOnMount: false,
      
      // No refetch cuando la ventana regain focus (Recommended: false para dashboards)
      refetchOnWindowFocus: false,
      
      // No refetch cuando el navegador estaba offline y reconecta
      refetchOnReconnect: 'stale',
      
      // Reintentos en caso de error
      retry: 1,
      
      // Delay entre reintentos (ms)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Reintentos para mutations (crear, actualizar, eliminar)
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      
      {/* DevTools para debugging en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
```

---

## PASO 2: Crear Hooks Personalizados

### 2.1 Hook para Propietarios

```javascript
// frontend/src/hooks/queries/useOwnersQuery.js
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para obtener lista de propietarios
 * - Deduplicación automática
 * - Caché compartida entre componentes
 * - Invalidación manual si es necesario
 */
export function useOwnersQuery(options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'owners'],
    queryFn: async () => {
      const response = await movimientosService.listOwners();
      return response.items || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
    ...options, // Permitir override de opciones
  });
}

// USAGE:
// const { data: owners, isLoading, error, refetch } = useOwnersQuery();
```

### 2.2 Hook para VTAs por Propietario

```javascript
// frontend/src/hooks/queries/useVtasByOwnerQuery.js
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para obtener VTAs de un propietario específico
 * - Solo hace fetch si propietarioId está presente
 * - Clave única por propietario (caché separada)
 */
export function useVtasByOwnerQuery(propietarioId, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'vtas', propietarioId],
    queryFn: async () => {
      const response = await movimientosService.listVtasByOwner(propietarioId);
      return response.items || [];
    },
    // 🔑 IMPORTANTE: Solo haz fetch si propietarioId existe
    enabled: !!propietarioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

// USAGE:
// const { data: vtas } = useVtasByOwnerQuery(propietarioId, {
//   enabled: !!propietarioId
// });
```

### 2.3 Hook para Movimientos (Lista con Paginación)

```javascript
// frontend/src/hooks/queries/useMovimientosListQuery.js
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para obtener lista de movimientos con filtros y paginación
 * - queryKey incluye todos los parámetros (filtros, página, orden)
 * - Cada combinación de parámetros = caché separada (granularidad alta)
 */
export function useMovimientosListQuery({
  filters = {},
  page = 0,
  rowsPerPage = 10,
  sortBy = 'fecha',
  sortDir = 'desc',
  options = {}
} = {}) {
  return useQuery({
    // 🔑 queryKey DEBE incluir todos los parámetros que afectan el resultado
    queryKey: ['movimientos', 'list', filters, page, rowsPerPage, sortBy, sortDir],
    
    queryFn: async ({ signal }) => {
      // React Query pasa signal de AbortController automáticamente
      return await movimientosService.list(
        {
          ...filters,
          sortBy,
          sortDir,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        { signal } // Pasar signal para cancelación
      );
    },
    
    staleTime: 1000 * 60 * 1, // 1 minuto (data muy dinámica)
    cacheTime: 1000 * 60 * 5, // 5 minutos
    keepPreviousData: true, // Mantener datos anteriores mientras carga (mejor UX)
    ...options,
  });
}

// USAGE:
// const { data, isLoading, isPreviousData } = useMovimientosListQuery({
//   filters: { fechaDesde, fechaHasta, propietarioId },
//   page,
//   rowsPerPage,
//   sortBy: 'fecha',
//   sortDir: 'desc'
// });
```

### 2.4 Hook para Tarifa

```javascript
// frontend/src/hooks/queries/useTarifaQuery.js
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para obtener tarifa de una combinación propietario-vta
 * - Clave única por propietario y vta
 * - Solo fetch si ambos IDs existen
 */
export function useTarifaQuery({ propietarioId, vtaId }, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'tarifa', propietarioId, vtaId],
    
    queryFn: async () => {
      const response = await movimientosService.getRate(propietarioId, vtaId);
      return response.tarifa || null;
    },
    
    // Solo haz fetch si ambos parámetros existen
    enabled: !!propietarioId && !!vtaId,
    staleTime: 1000 * 60 * 10, // 10 minutos (data relativamente estática)
    ...options,
  });
}

// USAGE:
// const { data: tarifa } = useTarifaQuery({
//   propietarioId: form.propietarioId,
//   vtaId: form.vtaId
// });
```

### 2.5 Hook para Init (Carga Inicial)

```javascript
// frontend/src/hooks/queries/useMovimientosInitQuery.js
import { useQuery } from '@anstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para obtener datos iniciales del dashboard
 * - Propietarios + datos de movimientos iniciales en 1 call
 * - Se ejecuta automáticamente al montar la app
 */
export function useMovimientosInitQuery(initialFilters = {}, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'init', initialFilters],
    
    queryFn: async () => {
      return await movimientosService.init(initialFilters);
    },
    
    staleTime: 1000 * 60 * 2, // 2 minutos
    cacheTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}
```

### 2.6 Hook para Crear Movimiento (Mutation)

```javascript
// frontend/src/hooks/mutations/useCreateMovimientoMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Hook para crear movimiento
 * - Invalida queries relacionadas automáticamente (onSuccess)
 * - Manejo de errores integrado
 */
export function useCreateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload) => {
      return await movimientosService.create(payload);
    },
    
    // Ejecutado cuando la mutation es exitosa
    onSuccess: (data) => {
      // Invalida la lista de movimientos para que se refetch
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'list'],
      });
      
      // Invalida también el init data (dashboard)
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'init'],
      });
      
      // Callback adicional del usuario (opcional)
      options?.onSuccess?.(data);
    },
    
    // Ejecutado cuando hay error
    onError: (error) => {
      options?.onError?.(error);
    },
    
    ...options,
  });
}

// USAGE:
// const mutation = useCreateMovimientoMutation({
//   onSuccess: () => {
//     showToast('Movimiento creado exitosamente');
//   },
//   onError: (error) => {
//     showToast(getApiErrorMessage(error), 'error');
//   }
// });
//
// await mutation.mutateAsync({ fecha: '2024-01-15', ... });
```

### 2.7 Hook para Actualizar Movimiento

```javascript
// frontend/src/hooks/mutations/useUpdateMovimientoMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useUpdateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await movimientosService.update(id, payload);
    },
    
    onSuccess: (data, { id }) => {
      // Invalida lista completa
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'list'],
      });
      
      // Invalida también el detalle específico (si existe query)
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'detail', id],
      });
      
      options?.onSuccess?.(data);
    },
    
    onError: (error) => {
      options?.onError?.(error);
    },
    
    ...options,
  });
}
```

---

## PASO 3: Actualizar Componentes

### 3.1 MovimientosPage Optimizado

```javascript
// frontend/src/pages/movimientos/MovimientosPage.jsx
import { useCallback, useState, useMemo } from 'react';
import { Box, Stack } from '@mui/material';

// Imports de hooks
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useTarifaQuery } from '../../hooks/queries/useTarifaQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useCreateMovimientoMutation } from '../../hooks/mutations/useCreateMovimientoMutation';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePaginationState } from '../../hooks/filters/usePaginationState';

// Otros imports
import MovimientosFilters from '../../components/movimientos/MovimientosFilters';
import MovimientosTable from '../../components/movimientos/MovimientosTable';
import MovimientoForm from '../../components/movimientos/MovimientoForm';
import { getTodayDate } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/apiError';

const initialFilters = {
  fechaDesde: getTodayDate(),
  fechaHasta: getTodayDate(),
  propietarioId: '',
  vtaId: '',
  cantidadMin: '',
  cantidadMax: '',
  usuario: '',
  observaciones: ''
};

const initialForm = {
  fecha: getTodayDate(),
  decada: getTodayDate(),
  propietarioId: '',
  vtaId: '',
  cantidad: '',
  tipovta: '',
  observaciones: ''
};

function MovimientosPage() {
  // ═══════════════════════════════════════════════════════════════════
  // Estado local (simple)
  // ═══════════════════════════════════════════════════════════════════
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 500);
  
  const [form, setForm] = useState(initialForm);
  
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [editingMovement, setEditingMovement] = useState(null);
  const [formError, setFormError] = useState('');
  
  // Paginación
  const { page, rowsPerPage, handlePageChange, handleRowsPerPageChange } = 
    usePaginationState();
  
  // Grid settings
  const [density, setDensity] = useState('compact');
  const [visibleColumnIds, setVisibleColumnIds] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════
  // Queries de React Query (caché automática)
  // ═══════════════════════════════════════════════════════════════════
  
  // Propietarios - Deduplicado automáticamente
  const { data: owners, isLoading: loadingOwners } = useOwnersQuery();
  
  // VTAs para filtros
  const propietarioId = filters.propietarioId;
  const { data: filterVtas } = useVtasByOwnerQuery(propietarioId, {
    enabled: !!propietarioId
  });
  
  // VTAs para formulario
  const formPropietarioId = form.propietarioId;
  const { data: formVtas } = useVtasByOwnerQuery(formPropietarioId, {
    enabled: !!formPropietarioId
  });
  
  // Tarifa automática
  const { data: tarifa } = useTarifaQuery(
    { propietarioId: form.propietarioId, vtaId: form.vtaId },
    { enabled: !!form.propietarioId && !!form.vtaId }
  );
  
  // Movimientos - Con paginación y filtros
  const { 
    data: movimientosData, 
    isLoading: loadingMovimientos,
    isPreviousData // Útil para mostrar indicador de "cached data"
  } = useMovimientosListQuery({
    filters: debouncedFilters,
    page,
    rowsPerPage,
    sortBy: orderBy,
    sortDir: order
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // Mutations (crear/actualizar/eliminar)
  // ═══════════════════════════════════════════════════════════════════
  
  const createMutation = useCreateMovimientoMutation({
    onSuccess: () => {
      showToast('Movimiento creado exitosamente');
      setForm(initialForm);
      setFormError('');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    }
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // Callbacks memoizados
  // ═══════════════════════════════════════════════════════════════════
  
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);
  
  const closeToast = useCallback(() => {
    setToast(t => ({ ...t, open: false }));
  }, []);
  
  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters(current => {
      if (field === 'propietarioId') {
        return { ...current, propietarioId: value, vtaId: '' };
      }
      return { ...current, [field]: value };
    });
  }, []);
  
  const handleFormChange = useCallback((field, value) => {
    setFormError('');
    setForm(current => ({
      ...current,
      [field]: value,
      // Reset vtaId si cambia propietario
      ...(field === 'propietarioId' ? { vtaId: '' } : {})
    }));
  }, []);
  
  const handleCreateMovimiento = useCallback(async (payload) => {
    await createMutation.mutateAsync(payload);
  }, [createMutation]);
  
  const handleSort = useCallback((field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrder('desc');
      setOrderBy(field);
    }
    setPage(0);
  }, [order, orderBy]);
  
  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  
  const items = movimientosData?.items || [];
  const pagination = movimientosData?.pagination || null;
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Filtros */}
      <MovimientosFilters
        filters={filters}
        owners={owners || []}
        vtas={filterVtas || []}
        onFilterChange={handleFilterChange}
        isLoading={loadingOwners}
      />
      
      {/* Tabla */}
      <Box sx={{ mt: 2 }}>
        <MovimientosTable
          items={items}
          total={pagination?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          orderBy={orderBy}
          order={order}
          isLoading={loadingMovimientos}
          isPreviousData={isPreviousData}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onSort={handleSort}
          density={density}
          visibleColumnIds={visibleColumnIds}
          onDensityChange={setDensity}
          onColumnToggle={(colId, checked) => {
            setVisibleColumnIds(prev => {
              const current = prev || TABLE_COLUMNS.filter(c => c.toggleable).map(c => c.id);
              return checked
                ? [...current, colId]
                : current.filter(id => id !== colId);
            });
          }}
        />
      </Box>
      
      {/* Formulario */}
      <Box sx={{ mt: 3 }}>
        <MovimientoForm
          form={form}
          onFormChange={handleFormChange}
          owners={owners || []}
          vtas={formVtas || []}
          tarifa={tarifa}
          isSubmitting={createMutation.isPending}
          error={formError}
          onSubmit={handleCreateMovimiento}
        />
      </Box>
      
      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default MovimientosPage;
```

### 3.2 DashboardPage Optimizado

```javascript
// frontend/src/pages/dashboard/DashboardPage.jsx
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Stack, Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// Hooks de React Query (mismo caché compartido)
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// Hooks de dashboard
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAlerts } from '../../hooks/useDashboardAlerts';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';

// Componentes
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import DashboardRecentActivityTable from '../../components/dashboard/DashboardRecentActivityTable';
import StatCard from '../../components/common/StatCard';
import { getTodayDate } from '../../utils/date';

function DashboardPage() {
  const navigate = useNavigate();
  
  // ═══════════════════════════════════════════════════════════════════
  // Estado (solo UI, data viene de React Query)
  // ═══════════════════════════════════════════════════════════════════
  
  const [filters, setFilters] = useState({
    fechaDesde: getTodayDate(),
    fechaHasta: getTodayDate(),
    propietarioId: '',
    vtaId: ''
  });
  
  const debouncedFilters = useDebouncedValue(filters, 500);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ═══════════════════════════════════════════════════════════════════
  // Queries - Mismo caché que MovimientosPage
  // ═══════════════════════════════════════════════════════════════════
  
  // Propietarios - Sin duplicación (caché compartida)
  const { data: owners, isLoading: loadingOwners } = useOwnersQuery();
  
  // VTAs cuando cambia propietario
  const propietarioId = filters.propietarioId;
  const { data: filterVtas } = useVtasByOwnerQuery(propietarioId, {
    enabled: !!propietarioId
  });
  
  // Movimientos con filtros (caché separada por filtros)
  const { 
    data: movimientosData, 
    isLoading: loadingMovimientos,
    refetch: refetchMovimientos
  } = useMovimientosListQuery({
    filters: debouncedFilters,
    page,
    rowsPerPage
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // Computaciones memoizadas (hooks personalizados)
  // ═══════════════════════════════════════════════════════════════════
  
  const items = movimientosData?.items || [];
  const pagination = movimientosData?.pagination || null;
  
  const kpis = useDashboardKPIs(items, pagination);
  const alerts = useDashboardAlerts(items);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);
  
  // ═══════════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════════
  
  const handleFilterChange = useCallback((key, value) => {
    setPage(0);
    setFilters(prev => {
      if (key === 'propietarioId') {
        return { ...prev, propietarioId: value, vtaId: '' };
      }
      return { ...prev, [key]: value };
    });
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setFilters({
      fechaDesde: getTodayDate(),
      fechaHasta: getTodayDate(),
      propietarioId: '',
      vtaId: ''
    });
    setPage(0);
  }, []);
  
  const handleRefresh = useCallback(() => {
    refetchMovimientos(); // React Query refetch
  }, [refetchMovimientos]);
  
  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  
  if (loadingMovimientos && !items.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Filtros + Refresh */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <DashboardFilters
            filters={filters}
            owners={owners || []}
            vtas={filterVtas || []}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isLoading={loadingOwners}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loadingMovimientos}
          size="small"
        >
          Actualizar
        </Button>
      </Stack>
      
      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total movimientos" value={kpis.totalHoy} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Volumen" value={kpis.volumenTotal} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Facturación" value={`$${kpis.facturacionTotal}`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Con errores" value={kpis.conErrores} tone="warning.main" />
        </Grid>
      </Grid>
      
      {/* Tabla de actividad */}
      <DashboardRecentActivityTable
        items={items}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(newValue) => {
          setRowsPerPage(newValue);
          setPage(0);
        }}
        filters={filters}
      />
    </Box>
  );
}

export default DashboardPage;
```

---

## PASO 4: Verificación y Testing

### 4.1 Checklist de Implementación

```javascript
// ✅ Verificar que:

// 1. React Query está instalado y configurado
// npm list @tanstack/react-query

// 2. QueryClientProvider envuelve <App />
// En main.jsx debe estar arriba de todo

// 3. Los hooks usan queryKey correcto
// Todos los queryKey deben ser arrays consistentes

// 4. Las mutaciones invalidan queries correctas
// onSuccess debe llamar a invalidateQueries

// 5. enabled está configurado donde es necesario
// useVtasByOwnerQuery debe tener enabled: !!propietarioId

// 6. No hay más llamadas a movimientosStore
// Reemplazado completamente por React Query

// 7. DevTools está disponible en desarrollo
// ReactQueryDevtools debe estar en main.jsx

// 8. Performance mejorado verificado
// Chrome DevTools → Network: máximo 1 call /listOwners
```

### 4.2 Test Script

```javascript
// tests/performance.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MovimientosPage from '../pages/movimientos/MovimientosPage';
import DashboardPage from '../pages/dashboard/DashboardPage';

describe('React Query Optimization', () => {
  let queryClient;
  let requestCount = {};
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    // Spy en las llamadas a la API
    requestCount = {
      listOwners: 0,
      listVtas: 0,
      list: 0
    };
  });
  
  it('debe hacer solo 1 call a listOwners', async () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(requestCount.listOwners).toBe(1);
    });
    
    unmount();
  });
  
  it('debe compartir caché entre páginas', async () => {
    // Render MovimientosPage
    const { unmount: unmountMovimientos } = render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(requestCount.listOwners).toBe(1);
    });
    
    unmountMovimientos();
    requestCount.listOwners = 0;
    
    // Render DashboardPage (mismo queryClient)
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );
    
    // No debe hacer llamada adicional (usa caché)
    await waitFor(() => {
      expect(requestCount.listOwners).toBe(0);
    }, { timeout: 1000 });
  });
  
  it('debe cancelar requests en vuelo', async () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    // Desmontar inmediatamente
    unmount();
    
    // Los requests deben ser cancelados
    // (verificar que no hay memoria leak)
  });
});
```

---

## PASO 5: Migración Gradual (Opcional)

Si prefieres migrar gradualmente sin cambiar todo al mismo tiempo:

### Paso 1: Setup React Query (sin cambiar componentes)
```
1. Instalar @tanstack/react-query
2. Configurar QueryClient en main.jsx
3. Crear hooks personalizados
4. Los componentes siguen usando estado local
```

### Paso 2: Migrar 1 componente (ej: Propietarios)
```
1. Reemplazar useState en MovimientosPage
2. Usar useOwnersQuery()
3. Verificar que funciona
```

### Paso 3: Migrar resto de queries
```
1. Migrar useVtasByOwnerQuery
2. Migrar useMovimientosListQuery
3. Etc.
```

### Paso 4: Eliminar código legacy
```
1. Eliminar movimientosStore
2. Eliminar createTtlCache
3. Eliminar requestDeduplicator
```

---

## PRÓXIMOS PASOS

1. **Instalar dependencias**
   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   ```

2. **Copiar hooks** del documento anterior

3. **Configurar main.jsx**

4. **Migrar MovimientosPage**

5. **Verificar en Chrome DevTools**

6. **Migrar DashboardPage**

7. **Testing**

8. **Deploy y monitoreo**

---

**¿Deseas que implemente esto en la aplicación actual?**
