# Código Ready-to-Use: React Query Implementation

**Este documento contiene código listo para copiar y pegar en tu proyecto.**

---

## PASO 1: Configurar main.jsx

**Archivo:** `frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'stale',
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
```

---

## PASO 2: Crear Hooks Personalizados

### Hook 1: useOwnersQuery.js

**Archivo:** `frontend/src/hooks/queries/useOwnersQuery.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useOwnersQuery(options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'owners'],
    queryFn: async () => {
      const response = await movimientosService.listOwners();
      return response.items || [];
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    ...options,
  });
}
```

### Hook 2: useVtasByOwnerQuery.js

**Archivo:** `frontend/src/hooks/queries/useVtasByOwnerQuery.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useVtasByOwnerQuery(propietarioId, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'vtas', propietarioId],
    queryFn: async () => {
      const response = await movimientosService.listVtasByOwner(propietarioId);
      return response.items || [];
    },
    enabled: !!propietarioId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
```

### Hook 3: useTarifaQuery.js

**Archivo:** `frontend/src/hooks/queries/useTarifaQuery.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useTarifaQuery({ propietarioId, vtaId }, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'tarifa', propietarioId, vtaId],
    queryFn: async () => {
      const response = await movimientosService.getRate(propietarioId, vtaId);
      return response.tarifa || null;
    },
    enabled: !!propietarioId && !!vtaId,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}
```

### Hook 4: useMovimientosListQuery.js

**Archivo:** `frontend/src/hooks/queries/useMovimientosListQuery.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useMovimientosListQuery({
  filters = {},
  page = 0,
  rowsPerPage = 10,
  sortBy = 'fecha',
  sortDir = 'desc',
  options = {}
} = {}) {
  return useQuery({
    queryKey: ['movimientos', 'list', filters, page, rowsPerPage, sortBy, sortDir],
    
    queryFn: async ({ signal }) => {
      return await movimientosService.list(
        {
          ...filters,
          sortBy,
          sortDir,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        { signal }
      );
    },
    
    staleTime: 1000 * 60 * 1,
    cacheTime: 1000 * 60 * 5,
    keepPreviousData: true,
    ...options,
  });
}
```

### Hook 5: useCreateMovimientoMutation.js

**Archivo:** `frontend/src/hooks/mutations/useCreateMovimientoMutation.js`

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useCreateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload) => {
      return await movimientosService.create(payload);
    },
    
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'list'],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'init'],
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

### Hook 6: useUpdateMovimientoMutation.js

**Archivo:** `frontend/src/hooks/mutations/useUpdateMovimientoMutation.js`

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useUpdateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await movimientosService.update(id, payload);
    },
    
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ['movimientos', 'list'],
      });
      
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

### Hook 7: usePaginationState.js

**Archivo:** `frontend/src/hooks/filters/usePaginationState.js`

```javascript
import { useState, useCallback } from 'react';

export function usePaginationState(initialPage = 0) {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);
  
  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);
  
  const reset = useCallback(() => {
    setPage(0);
    setRowsPerPage(10);
  }, []);
  
  return {
    page,
    rowsPerPage,
    handlePageChange,
    handleRowsPerPageChange,
    reset,
    setPage,
    setRowsPerPage,
  };
}
```

---

## PASO 3: Actualizar MovimientosPage

**Archivo:** `frontend/src/pages/movimientos/MovimientosPage.jsx`

**Reemplaza el contenido actual con:**

```javascript
import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Popover,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';

// Hooks de React Query
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useTarifaQuery } from '../../hooks/queries/useTarifaQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useCreateMovimientoMutation } from '../../hooks/mutations/useCreateMovimientoMutation';

// Otros hooks
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePaginationState } from '../../hooks/filters/usePaginationState';

// Componentes
import MovimientosFilters from '../../components/movimientos/MovimientosFilters';
import MovimientosTable, { COLUMNS as TABLE_COLUMNS } from '../../components/movimientos/MovimientosTable';
import MovimientoForm from '../../components/movimientos/MovimientoForm';
import HistorialDialog from '../../components/movimientos/HistorialDialog';

// Utils
import { getApiErrorMessage } from '../../utils/apiError';
import { getTodayDate } from '../../utils/date';
import { tokens } from '../../styles/theme';

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

const toggleableCols = TABLE_COLUMNS.filter((c) => c.toggleable);
const COL_POPOVER_ANCHOR = { vertical: 'bottom', horizontal: 'right' };
const COL_POPOVER_TRANSFORM = { vertical: 'top', horizontal: 'right' };
const COL_POPOVER_PAPER = { elevation: 3, sx: { p: 1.5, width: 200, mt: 0.5, borderRadius: '10px', border: `1px solid ${tokens.borderMedium}` } };

function MovimientosPage() {
  // ─────────────────────────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 500);
  
  const [form, setForm] = useState(initialForm);
  
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  
  const { page, rowsPerPage, handlePageChange, handleRowsPerPageChange } = 
    usePaginationState();
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [editingMovement, setEditingMovement] = useState(null);
  const [formError, setFormError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMovement, setHistoryMovement] = useState(null);
  
  // Grid
  const [density, setDensity] = useState('compact');
  const [visibleColumnIds, setVisibleColumnIds] = useState(null);
  const [colAnchor, setColAnchor] = useState(null);
  
  // ─────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────
  const { data: owners, isLoading: loadingOwners } = useOwnersQuery();
  
  const { data: filterVtas } = useVtasByOwnerQuery(filters.propietarioId, {
    enabled: !!filters.propietarioId
  });
  
  const { data: formVtas } = useVtasByOwnerQuery(form.propietarioId, {
    enabled: !!form.propietarioId
  });
  
  const { data: tarifa } = useTarifaQuery(
    { propietarioId: form.propietarioId, vtaId: form.vtaId },
    { enabled: !!form.propietarioId && !!form.vtaId }
  );
  
  const { 
    data: movimientosData, 
    isLoading: loadingTable
  } = useMovimientosListQuery({
    filters: debouncedFilters,
    page,
    rowsPerPage,
    sortBy: orderBy,
    sortDir: order
  });
  
  // ─────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────
  const createMutation = useCreateMovimientoMutation({
    onSuccess: () => {
      showToast('Movimiento creado exitosamente');
      setForm(initialForm);
      setFormError('');
      setEditingMovement(null);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    }
  });
  
  // ─────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);
  
  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);
  
  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters((current) => {
      if (field === 'propietarioId') {
        return {
          ...current,
          propietarioId: value,
          vtaId: ''
        };
      }
      return {
        ...current,
        [field]: value
      };
    });
  }, []);
  
  const handleApplyFilters = useCallback((partial) => {
    setPage(0);
    setFilters((current) => ({ ...current, ...partial }));
  }, []);
  
  const handleFormChange = useCallback((field, value) => {
    setFormError('');
    setForm((current) => {
      const updated = { ...current };
      
      if (field === 'fecha') {
        updated.fecha = value;
        const currentMonthKey = current.decada?.slice(0, 7);
        const nextMonthKey = value?.slice(0, 7);
        if (currentMonthKey !== nextMonthKey) {
          updated.decada = value;
        }
      } else if (field === 'propietarioId') {
        updated.propietarioId = value;
        updated.vtaId = '';
      } else {
        updated[field] = value;
      }
      
      return updated;
    });
  }, []);
  
  const handleCreateMovimiento = useCallback(async (payload) => {
    if (editingMovement) {
      // TODO: Implementar update
      showToast('Update no implementado aún', 'warning');
      return;
    }
    
    await createMutation.mutateAsync(payload);
  }, [editingMovement, createMutation]);
  
  const handleSort = useCallback((field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrder('desc');
      setOrderBy(field);
    }
    setPage(0);
  }, [order, orderBy]);
  
  const handleDensityChange = useCallback((_, v) => {
    if (v) setDensity(v);
  }, []);
  
  const handleOpenColMenu = useCallback((e) => {
    setColAnchor(e.currentTarget);
  }, []);
  
  const handleCloseColMenu = useCallback(() => {
    setColAnchor(null);
  }, []);
  
  const handleToggleColumn = useCallback((colId, checked) => {
    setVisibleColumnIds((prev) => {
      const current = prev ?? toggleableCols.map((c) => c.id);
      const next = checked
        ? [...current, colId]
        : current.filter((id) => id !== colId);
      return next.length === toggleableCols.length ? null : next;
    });
  }, []);
  
  const effectiveVisible = visibleColumnIds ?? toggleableCols.map((c) => c.id);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const items = movimientosData?.items || [];
  const total = movimientosData?.pagination?.total || 0;
  
  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 2 }}>
      {/* Filtros */}
      <Box sx={{ mb: 2 }}>
        <MovimientosFilters
          filters={filters}
          owners={owners || []}
          vtas={filterVtas || []}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
          isLoading={loadingOwners}
          activeFilterCount={activeFilterCount}
        />
      </Box>
      
      {/* Toolbar */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={density}
          exclusive
          onChange={handleDensityChange}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="compact" title="Compacto">
            <TableRowsOutlinedIcon sx={{ fontSize: '18px' }} />
          </ToggleButton>
          <ToggleButton value="standard" title="Normal">
            <ViewHeadlineIcon sx={{ fontSize: '18px' }} />
          </ToggleButton>
          <ToggleButton value="comfortable" title="Cómodo">
            <ViewColumnOutlinedIcon sx={{ fontSize: '18px' }} />
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Box sx={{ flex: 1 }} />
        
        <Tooltip title="Mostrar/ocultar columnas">
          <IconButton
            size="small"
            onClick={handleOpenColMenu}
            sx={{ border: `1px solid ${tokens.borderMedium}`, borderRadius: 1 }}
          >
            <ViewColumnOutlinedIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Tooltip>
        
        <Popover
          open={!!colAnchor}
          anchorEl={colAnchor}
          onClose={handleCloseColMenu}
          anchorOrigin={COL_POPOVER_ANCHOR}
          transformOrigin={COL_POPOVER_TRANSFORM}
          PaperProps={COL_POPOVER_PAPER}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {toggleableCols.map((col) => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    checked={effectiveVisible.includes(col.id)}
                    onChange={(e) => handleToggleColumn(col.id, e.target.checked)}
                    size="small"
                  />
                }
                label={col.label}
                sx={{ m: 0, '.MuiTypography-root': { fontSize: '0.875rem' } }}
              />
            ))}
          </Box>
        </Popover>
      </Stack>
      
      {/* Tabla */}
      <Box sx={{ mb: 2 }}>
        <MovimientosTable
          items={items}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          orderBy={orderBy}
          order={order}
          isLoading={loadingTable}
          density={density}
          visibleColumnIds={visibleColumnIds}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onSort={handleSort}
          onColumnToggle={handleToggleColumn}
        />
      </Box>
      
      {/* Formulario */}
      <Box>
        <MovimientoForm
          form={form}
          onFormChange={handleFormChange}
          owners={owners || []}
          vtas={formVtas || []}
          tarifa={tarifa}
          isSubmitting={createMutation.isPending}
          error={formError}
          onSubmit={handleCreateMovimiento}
          editingMovement={editingMovement}
          onEditingChange={setEditingMovement}
        />
      </Box>
      
      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
      
      {/* Historial Dialog */}
      <HistorialDialog
        open={!!historyMovement}
        onClose={() => setHistoryMovement(null)}
        movementId={historyMovement?.id}
        items={historyItems}
        isLoading={loadingHistory}
      />
    </Box>
  );
}

export default MovimientosPage;
```

---

## PASO 4: Actualizar DashboardPage

**Archivo:** `frontend/src/pages/dashboard/DashboardPage.jsx`

**Reemplaza con:**

```javascript
import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Hooks de React Query
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';

// Otros
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAlerts } from '../../hooks/useDashboardAlerts';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';

// Componentes
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import DashboardRecentActivityTable from '../../components/dashboard/DashboardRecentActivityTable';
import StatCard from '../../components/common/StatCard';
import { getTodayDate, formatCurrency } from '../../utils/date';
import { tokens } from '../../styles/theme';

function TopBar({ label, valueLabel, pct }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5, gap: 1 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: '75%', fontWeight: 500, fontSize: '0.85rem' }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.8rem' }}>
          {valueLabel}
        </Typography>
      </Stack>
      <Box sx={{ height: 5, borderRadius: 3, bgcolor: tokens.bgLight }}>
        <Box
          sx={{
            height: '100%',
            borderRadius: 3,
            width: `${Math.max(pct, 3)}%`,
            bgcolor: 'primary.main',
            transition: 'width 0.4s ease',
          }}
        />
      </Box>
    </Box>
  );
}

function DashboardPage() {
  // ─────────────────────────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    fechaDesde: getTodayDate(),
    fechaHasta: getTodayDate(),
    propietarioId: '',
    vtaId: ''
  });
  
  const debouncedFilters = useDebouncedValue(filters, 500);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ─────────────────────────────────────────────────────────────────
  // Queries - SIN DUPLICACIÓN (caché compartida con MovimientosPage)
  // ─────────────────────────────────────────────────────────────────
  const { data: owners, isLoading: loadingOwners } = useOwnersQuery();
  
  const { data: filterVtas } = useVtasByOwnerQuery(filters.propietarioId, {
    enabled: !!filters.propietarioId
  });
  
  const { 
    data: movimientosData, 
    isLoading: loadingMovimientos,
    refetch: refetchMovimientos
  } = useMovimientosListQuery({
    filters: debouncedFilters,
    page,
    rowsPerPage
  });
  
  // ─────────────────────────────────────────────────────────────────
  // Derivados
  // ─────────────────────────────────────────────────────────────────
  const items = movimientosData?.items || [];
  const pagination = movimientosData?.pagination || null;
  
  const kpis = useDashboardKPIs(items, pagination);
  const alerts = useDashboardAlerts(items);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);
  
  const maxFacturacion = topPropietarios[0]?.total || 1;
  const maxVolumen = topVtas[0]?.volumen || 1;
  
  // ─────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setPage(0);
    setFilters((prev) => {
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
    refetchMovimientos();
  }, [refetchMovimientos]);
  
  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);
  
  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  if (loadingMovimientos && !items.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!movimientosData) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: `1px solid ${tokens.borderLight}`, borderRadius: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Sin datos operativos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No hay movimientos registrados.
        </Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Actualizar datos
        </Button>
      </Paper>
    );
  }
  
  return (
    <>
      {/* Filtros + Actualizar */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
          sx={{ mt: 0.5 }}
        >
          Actualizar datos
        </Button>
      </Stack>
      
      {/* Alertas */}
      {alerts.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {alerts.map((alert, idx) => (
            <Alert
              key={idx}
              severity={alert.severity}
              icon={alert.severity === 'warning' ? <WarningAmberIcon /> : undefined}
            >
              {alert.message}
            </Alert>
          ))}
        </Stack>
      )}
      
      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total movimientos hoy" value={kpis.totalHoy ?? '—'} helper="Registrados en el sistema" tone="primary.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Volumen total" value={kpis.volumenTotal.toFixed(2)} helper="Unidades procesadas" tone="info.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Facturación total" value={formatCurrency(kpis.facturacionTotal)} helper="Ingresos del día" tone="success.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Con errores" value={kpis.conErrores} helper="Registros incompletos" tone={kpis.conErrores > 0 ? 'warning.main' : 'primary.main'} />
        </Grid>
      </Grid>
      
      {/* Top 5 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, border: `1px solid ${tokens.borderCard}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Top 5 Propietarios
            </Typography>
            <Stack spacing={1}>
              {topPropietarios.map((prop, idx) => (
                <TopBar
                  key={idx}
                  label={prop.nombre}
                  valueLabel={formatCurrency(prop.total)}
                  pct={(prop.total / maxFacturacion) * 100}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, border: `1px solid ${tokens.borderCard}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Top 5 VTAs
            </Typography>
            <Stack spacing={1}>
              {topVtas.map((vta, idx) => (
                <TopBar
                  key={idx}
                  label={vta.nombre}
                  valueLabel={vta.volumen.toFixed(2)}
                  pct={(vta.volumen / maxVolumen) * 100}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Actividad Reciente */}
      <DashboardRecentActivityTable
        items={items}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        filters={filters}
      />
    </>
  );
}

export default DashboardPage;
```

---

## PASO 5: Verificar Instalación

### Comando de instalación:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Verificar que funcionó:

```bash
npm list @tanstack/react-query
# Debe mostrar: @tanstack/react-query@X.X.X
```

---

## PASO 6: Testing Rápido

Abre Chrome DevTools y verifica:

1. **Network Tab**: Solo 1 call a `/listOwners`
2. **React DevTools → Profiler**: Menos renders
3. **React Query DevTools** (abajo a la derecha): Cache visible

---

## ¿Qué hace cada hook?

| Hook | Propósito | Cache |
|------|-----------|-------|
| `useOwnersQuery` | Obtener lista de propietarios | 5 min |
| `useVtasByOwnerQuery` | VTAs de un propietario | 5 min |
| `useTarifaQuery` | Tarifa de propietario+vta | 10 min |
| `useMovimientosListQuery` | Lista con paginación | 1 min |
| `useCreateMovimientoMutation` | Crear movimiento + invalidar | N/A |
| `useUpdateMovimientoMutation` | Actualizar movimiento | N/A |

---

## Próximo paso:

¿Deseas que implemente esto ahora en tu aplicación?

**Tiempo estimado:** 30-45 minutos (copiar y pegar, sin debugging)

