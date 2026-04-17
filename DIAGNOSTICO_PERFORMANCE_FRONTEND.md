# Diagnóstico y Estrategia de Optimización: Frontend Performance

**Fecha:** 2026-04-17  
**Arquitecto:** Senior Frontend Performance Specialist  
**Aplicación:** Dashboard Operativo - Movimientos

---

## PARTE 1: DIAGNÓSTICO TÉCNICO

### 1.1 Problemas Identificados

#### 🔴 CRÍTICO: Duplicación de Llamadas API

**Ubicación:** `DashboardPage.jsx` vs `MovimientosPage.jsx`

```
Flujo actual:
┌─────────────────────────────────────────────────────────────────┐
│ Usuario abre app                                                │
├─────────────────────────────────────────────────────────────────┤
│ DashboardPage monta                                             │
│  → useEffect []  → movimientosService.listOwners() ❌ CALL #1  │
│  → useEffect [propietarioId] → movimientosService...() ❌ #2   │
├─────────────────────────────────────────────────────────────────┤
│ Usuario navega a Movimientos                                    │
│  → MovimientosPage monta                                        │
│  → deduplicatedFetch('owners') → movimientosService...() ⚠️ #3 │
│     (sin cache compartido, hace de nuevo)                      │
├─────────────────────────────────────────────────────────────────┤
│ Usuario vuelve a Dashboard (tab)                                │
│  → React.StrictMode en desarrollo → efecto se ejecuta 2x ❌    │
│  → movimientosService.listOwners() ❌ CALLS #4, #5             │
│  → Sin AbortController en algunos lugares                       │
├─────────────────────────────────────────────────────────────────┤
│ TOTAL: 5+ llamadas innecesarias                                │
│ Backend: 304 Not Modified (caché HTTP activado) ⚠️             │
│ PROBLEMA: Bandwidth, CPU del cliente, batería                  │
└─────────────────────────────────────────────────────────────────┘
```

**Causa raíz:**
- ✗ Caché local no compartida entre páginas
- ✗ Sin deduplicación en `DashboardPage` (solo en `MovimientosPage`)
- ✗ React.StrictMode duplica efectos en desarrollo
- ✗ Sin AbortController en todos los lugares
- ✗ `movimientosStore` es custom y no tiene subscribers en todos lados

---

#### 🟠 ALTO: Renders Innecesarios

**Archivo:** `DashboardPage.jsx` línea 130-136

```javascript
// ❌ PROBLEMA: Se ejecuta en CADA cambio de filters
useEffect(() => {
  if (movimientosData) {
    loadInitialData();  // Causa re-render del dashboard + tabla
  }
}, [filters]);  // Peligroso: Object reference changes = re-ejecución
```

**Síntomas:**
- Al cambiar fecha en filtros → `loadInitialData()` se ejecuta inmediatamente
- Sin debounce → múltiples requests simultáneamente
- La tabla se re-renderiza aunque los datos sean iguales

**Causa raíz:**
- No hay `useDebouncedValue` en DashboardPage (existe en MovimientosPage)
- Falta memoización de `filters` object
- Falta `useCallback` con dependencias correctas

---

#### 🟠 ALTO: Gestión de Estado Global Deficiente

**Archivo:** `MovimientosPage.jsx` línea 31 + `DashboardPage.jsx` línea 21

```javascript
// movimientosStore es un patrón custom
export const movimientosStore = (() => {
  let data = null;
  const subscribers = [];
  
  return {
    get: () => data,
    set: (newData) => { data = newData; /* notify */ },
    subscribe: (fn) => { /* ... */ }
  };
})();
```

**Problemas:**
- ✗ No hay invalidación automática de caché (TTL manual)
- ✗ No hay mecanismo de "stale-while-revalidate"
- ✗ No hay refetch automático al regain focus
- ✗ No hay normalización de datos
- ✗ Incompatible con React DevTools
- ✗ Difícil debuguear en equipo

---

#### 🟡 MEDIO: useEffect Dependencies Incorrectas

**Archivo:** `DashboardPage.jsx` línea 129

```javascript
// ❌ Dependencia faltante
useEffect(() => {
  if (!movimientosData) {
    loadInitialData();  // Pero loadInitialData usa `filters`
  }
}, []);  // 🚨 Falta [movimientosData, filters]
```

**Impacto:**
- Si `filters` cambia, el efecto no se re-ejecuta
- Data queda inconsistente con filtros
- Potencial para bugs sutiles

---

#### 🟡 MEDIO: Falta de Cancelación de Requests

**Archivo:** `DashboardPage.jsx`

```javascript
// ❌ Sin AbortController
const loadInitialData = async () => {
  setLoading(true);
  try {
    const response = await movimientosService.list({ ... });
    // Si el usuario navega antes de que responda → memoria leak
    // Si el usuario recarga → request anterior aún se procesa
    setMovimientosData(response);
  } catch (error) { ... }
};
```

**Comparación:**
- ✅ MovimientosPage SÍ tiene AbortController (línea 183)
- ❌ DashboardPage NO tiene AbortController

---

#### 🟡 MEDIO: Recreación de Objetos en Render

**Archivo:** `MovimientosPage.jsx` línea 72

```javascript
// ❌ initialFilters se crea en cada render
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

// Luego usado como parámetro
const debouncedFilters = useDebouncedValue(filters, 450);
// Si filters object reference cambia → debounce se resetea
```

---

### 1.2 Cómo Detectar Estos Problemas

#### En Development:

**1. Chrome DevTools - Network Tab**
```javascript
// Abrir: DevTools → Network
// Filtrar: Fetch/XHR
// Acción: 
//   1. Abrir app
//   2. Navegar entre Movimientos ↔ Dashboard
//   3. Cambiar filtros en Dashboard

// Debe verse: ✅ Máximo 1 llamada a /listOwners()
// Si ves: ❌ 2+ llamadas → hay duplicación
```

**2. React DevTools - Profiler**
```javascript
// Abrir: DevTools → Profiler tab
// Acción: Cambiar filtro en Dashboard
// Buscar:
//   - Cuántos renders se disparan
//   - Cuánto tiempo toma cada componente
//   - Si hay renders repetidos

// Esperado: ✅ 1-2 renders
// Si ves: ❌ 5+ renders → problema
```

**3. Network Throttling**
```javascript
// DevTools → Network → Throttle: "Slow 3G"
// Acción: Navegar entre páginas
// Resultado: Si se vuelve muy lento → hay sobre-requests
```

**4. React.StrictMode en Development**
```javascript
// En main.jsx:
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>  {/* Esto causa doble-ejecución de efectos */}
    <App />
  </React.StrictMode>,
);
```

**Esto es NORMAL en desarrollo, pero cuidado con:**
- Efectos sin cleanup
- Efectos que hacen requests sin deduplicación

---

#### En Producción:

**1. Monitoreo de Network**
```javascript
// En httpClient.js, agregar:
const requests = [];

httpClient.interceptors.request.use((config) => {
  const req = {
    url: config.url,
    method: config.method,
    timestamp: Date.now()
  };
  requests.push(req);
  
  // Log duplicados en últimos 500ms
  const recent = requests.filter(r => 
    Date.now() - r.timestamp < 500
  );
  if (recent.length > 1) {
    console.warn('⚠️ Posible duplicación:', recent);
  }
  
  return config;
});
```

**2. Métricas con analytics**
```javascript
// Registrar en Google Analytics o similar:
// - Cuántos requests por sesión
// - Tiempo hasta First Contentful Paint
// - Tiempo de carga promedio por página
```

---

## PARTE 2: ESTRATEGIA DE OPTIMIZACIÓN

### 2.1 Enfoque Recomendado

**Opción A: React Query (RECOMENDADO)**
- Manejo de caché automático
- Deduplicación out-of-the-box
- Invalidación automática
- Sincronización entre tabs
- 30KB gzipped, ROI altísimo

**Opción B: SWR (Alternativa ligera)**
- Más simple que React Query
- Mejor para dashboards simples
- 5KB gzipped

**Opción C: Custom Hook + Context (Actual)**
- ❌ Alto mantenimiento
- ❌ Propenso a bugs
- ❌ Difícil debuguear

### 2.2 Implementación Recomendada

**FASE 1: Uso de React Query (2-3 horas)**
```
1. Instalar: npm install @tanstack/react-query
2. Configurar en main.jsx
3. Crear hooks personalizados para cada endpoint
4. Reemplazar llamadas en MovimientosPage
5. Reemplazar llamadas en DashboardPage
6. Testing en desarrollo
```

**FASE 2: Limpiar código custom (1-2 horas)**
```
1. Eliminar movimientosStore
2. Eliminar createTtlCache
3. Simplificar deduplicatedFetch (React Query lo hace)
4. Actualizar servicios si es necesario
```

**FASE 3: Optimizar componentes (2-3 horas)**
```
1. Agregar useMemo en componentes que calculan derivados
2. Agregar useCallback en handlers
3. Memoizar componentes child (React.memo)
4. Revisar dependencias de useEffect
```

---

## PARTE 3: GESTIÓN DE DATOS Y CACHÉ

### 3.1 Configuración Recomendada con React Query

```javascript
// 1. Crear QueryClient con configuración óptima
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cuánto tiempo los datos se consideran "fresh"
      staleTime: 5 * 60 * 1000,  // 5 minutos
      
      // Cuánto tiempo el caché persiste en memoria
      cacheTime: 10 * 60 * 1000, // 10 minutos
      
      // No refetch automáticamente al montar si ya tenemos datos
      refetchOnMount: false,
      
      // No refetch automáticamente cuando la ventana regain focus
      refetchOnWindowFocus: false,
      
      // Reintentos en caso de error
      retry: 1,
      
      // Tiempo de espera para cancelar requests obsoletos
      staleTime: 0,  // Investigar si cambiar a 5min
    },
    mutations: {
      // Después de mutación exitosa, invalidar queries relacionadas
      retry: 1,
    }
  }
});
```

### 3.2 Estrategia de Invalidación

```javascript
// Cuando creas un movimiento, invalida automáticamente:
const createMovimiento = useMutation({
  mutationFn: (payload) => movimientosService.create(payload),
  
  onSuccess: () => {
    // Invalida la lista de movimientos
    queryClient.invalidateQueries({ queryKey: ['movimientos', 'list'] });
    
    // Invalida el dashboard data
    queryClient.invalidateQueries({ queryKey: ['movimientos', 'init'] });
    
    // Invalida tarifas (pueden haber cambiado)
    queryClient.invalidateQueries({ queryKey: ['tarifas'] });
  }
});
```

### 3.3 Niveles de Caché (Estrategia "Stale-While-Revalidate")

```
Cliente ─────────────► React Query ─────────────► Backend
         (1-5 min)       Cache            (HTTP 304/200)
         "fresco"        TTL: 10 min
         
Flujo de datos:
1. Data en cache y "fresh" → respuesta inmediata (0ms)
2. Data en cache pero "stale" → respuesta inmediata + refetch silencioso
3. Data no en cache → fetch from backend
4. Cambio en backend → invalidate → refetch
```

---

## PARTE 4: CONTROL DE LLAMADAS API

### 4.1 Deduplicación (Automática con React Query)

**Problema actual:**
```javascript
// Dos componentes llaman al mismo endpoint simultáneamente
const users1 = await movimientosService.listOwners(); // CALL #1
const users2 = await movimientosService.listOwners(); // CALL #2 (innecesario)
```

**Con React Query:**
```javascript
// Ambos componentes usan el mismo hook
const { data: users1 } = useQuery({
  queryKey: ['movimientos', 'owners'],
  queryFn: () => movimientosService.listOwners()
});

const { data: users2 } = useQuery({
  queryKey: ['movimientos', 'owners'],
  queryFn: () => movimientosService.listOwners()
});

// Resultado: Solo 1 CALL backend (deduplicación automática)
// React Query mantiene 1 promise en vuelo
```

### 4.2 Cancelación de Requests

**Con React Query (automático):**
```javascript
// Cuando el componente se desmonta, la query se cancela automáticamente
useEffect(() => {
  return () => {
    // Si el request aún está en vuelo, se cancela
    // No ocurre setState en unmounted component
  };
}, []);
```

**Manual si es necesario:**
```javascript
const { cancel } = useQuery({
  queryKey: ['movimientos'],
  queryFn: ({ signal }) => 
    // signal es un AbortSignal que React Query maneja
    movimientosService.list({...}, { signal })
});

// Cancelar manualmente
cancel();
```

### 4.3 Debounce / Throttle para Filtros

**Recomendado: Debounce en la query**
```javascript
const [filters, setFilters] = useState(initialFilters);
const debouncedFilters = useDebouncedValue(filters, 500);

const { data } = useQuery({
  queryKey: ['movimientos', 'list', debouncedFilters],
  queryFn: () => movimientosService.list(debouncedFilters),
  
  // Solo ejecuta cuando debouncedFilters cambia
  // No en cada keystroke del input
});
```

---

## PARTE 5: ARQUITECTURA RECOMENDADA

### 5.1 Estructura de Hooks Personalizados

```
frontend/src/hooks/
├── queries/
│   ├── useMovimientosListQuery.js
│   ├── useMovimientosInitQuery.js
│   ├── useOwnersQuery.js
│   ├── useVtasByOwnerQuery.js
│   ├── useTarifaQuery.js
│   └── useMovimientoDetailQuery.js
├── mutations/
│   ├── useCreateMovimientoMutation.js
│   ├── useUpdateMovimientoMutation.js
│   └── useDeleteMovimientoMutation.js
├── filters/
│   ├── useDebouncedFilters.js
│   └── usePaginationState.js
└── utils/
    ├── useDashboardKPIs.js
    ├── useDashboardAlerts.js
    └── useDashboardAggregations.js
```

### 5.2 Patrón de Hook Reutilizable

```javascript
// hooks/queries/useOwnersQuery.js
import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

export function useOwnersQuery(options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'owners'],
    queryFn: () => movimientosService.listOwners(),
    staleTime: 5 * 60 * 1000,  // 5 min
    cacheTime: 10 * 60 * 1000, // 10 min
    ...options
  });
}

// Uso en componentes
function MyComponent() {
  const { data: owners, isLoading, error } = useOwnersQuery();
  
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  
  return <SelectOwner items={owners} />;
}
```

### 5.3 Gestión de Filtros y Paginación

```javascript
// hooks/filters/usePaginationState.js
export function usePaginationState(initialPage = 0) {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const handlePageChange = useCallback((newPage) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);
  
  return {
    page,
    rowsPerPage,
    handlePageChange,
    handleRowsPerPageChange,
    reset: () => { setPage(0); setRowsPerPage(10); }
  };
}

// En el componente
function MovimientosPage() {
  const { page, rowsPerPage, handlePageChange } = usePaginationState();
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 500);
  
  const { data: movimientos } = useQuery({
    queryKey: ['movimientos', 'list', debouncedFilters, page, rowsPerPage],
    queryFn: () => movimientosService.list({
      ...debouncedFilters,
      offset: page * rowsPerPage,
      limit: rowsPerPage
    })
  });
  
  return (
    <>
      <MovimientosTable 
        items={movimientos?.items}
        page={page}
        onPageChange={handlePageChange}
      />
    </>
  );
}
```

---

## PARTE 6: EJEMPLO PRÁCTICO - ANTES Y DESPUÉS

### 6.1 ANTES (Código Problemático)

```javascript
// pages/movimientos/MovimientosPage.jsx - VERSIÓN ACTUAL
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { movimientosService } from '../../services/movimientosService';
import { createTtlCache } from '../../utils/cache';
import { deduplicatedFetch } from '../../utils/requestDeduplicator';

const ownersCache = createTtlCache();
const vtasCache = createTtlCache();
const tarifasCache = createTtlCache();

function MovimientosPage() {
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 450);
  const [items, setItems] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const loadMovimientosAbortRef = useRef(null);
  
  // ❌ PROBLEMA 1: Caché manual es propenso a errores
  const loadOwners = async () => {
    const cachedOwners = ownersCache.get('owners');
    if (cachedOwners) {
      setOwners(cachedOwners);
      return;
    }
    
    // ❌ PROBLEMA 2: Sin deduplicación aquí (solo en deduplicatedFetch)
    const response = await deduplicatedFetch('owners', 
      () => movimientosService.listOwners());
    ownersCache.set('owners', response.items || []);
    setOwners(response.items || []);
  };

  const loadMovimientos = useCallback(async () => {
    // ❌ PROBLEMA 3: AbortController solo aquí, no en otros métodos
    loadMovimientosAbortRef.current?.abort();
    const controller = new AbortController();
    loadMovimientosAbortRef.current = controller;

    setLoadingTable(true);

    try {
      const response = await movimientosService.list({
        ...debouncedFilters,
        sortBy: orderBy,
        sortDir: order,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      }, { signal: controller.signal });

      if (!controller.signal.aborted) {
        setItems(response.items || []);
        setTotal(response.pagination?.total || 0);
      }
    } catch (requestError) {
      if (!controller.signal.aborted) {
        showToast(getApiErrorMessage(requestError), 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingTable(false);
      }
    }
  }, [debouncedFilters, order, orderBy, page, rowsPerPage]);

  // ❌ PROBLEMA 4: Multiple useEffect con lógica compleja
  useEffect(() => {
    deduplicatedFetch('movimientos:page:init', () =>
      movimientosService.init({...initialFilters})
    ).then((initData) => {
      const ownersList = initData.propietarios || [];
      ownersCache.set('owners', ownersList);  // Duplicar en caché
      setOwners(ownersList);
      setItems(initData.movimientos?.items || []);
      setTotal(initData.movimientos?.pagination?.total || 0);
      setLoadingTable(false);
      initDoneRef.current = true;
      movimientosStore.set(initData.movimientos);
    }).catch((requestError) => {
      showToast(getApiErrorMessage(requestError), 'error');
      setLoadingTable(false);
    });
  }, []);  // ❌ Dependencies vacías (eslint-disable)

  useEffect(() => {
    if (!initDoneRef.current) return;
    loadMovimientos();
  }, [loadMovimientos]);

  // ❌ PROBLEMA 5: Múltiples efectos sin lógica clara
  useEffect(() => {
    loadVtas(filters.propietarioId, 'filter').catch(...)
  }, [filters.propietarioId]);

  useEffect(() => {
    loadVtas(form.propietarioId, 'form').catch(...)
  }, [form.propietarioId]);

  useEffect(() => {
    loadTarifa(form.propietarioId, form.vtaId).catch(...)
  }, [form.propietarioId, form.vtaId]);

  return (...);
}
```

### 6.2 DESPUÉS (Código Optimizado)

```javascript
// pages/movimientos/MovimientosPage.jsx - VERSIÓN OPTIMIZADA
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useTarifaQuery } from '../../hooks/queries/useTarifaQuery';
import { usePaginationState } from '../../hooks/filters/usePaginationState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

function MovimientosPage() {
  const queryClient = useQueryClient();
  
  // ✅ VENTAJA 1: Estado simple solo para UI
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 500);
  const { page, rowsPerPage, handlePageChange, handleRowsPerPageChange } = 
    usePaginationState();
  
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  
  // ✅ VENTAJA 2: Caché automática con React Query
  const { data: owners, isLoading: loadingOwners } = useOwnersQuery();
  
  const { data: movimientos, isLoading: loadingMovimientos } = 
    useMovimientosListQuery({
      filters: debouncedFilters,
      page,
      rowsPerPage,
      sortBy: orderBy,
      sortDir: order
    });
  
  // ✅ VENTAJA 3: VTAs cargan automáticamente cuando propietarioId cambia
  const propietarioId = filters.propietarioId;
  const { data: filterVtas } = useVtasByOwnerQuery(propietarioId, {
    enabled: !!propietarioId  // Solo fetch si hay propietarioId
  });
  
  // ✅ VENTAJA 4: Tarifa se invalida automáticamente
  const { data: tarifa } = useTarifaQuery(
    { propietarioId: form.propietarioId, vtaId: form.vtaId },
    { enabled: !!form.propietarioId && !!form.vtaId }
  );
  
  // ✅ VENTAJA 5: Mutation maneja invalidación automática
  const createMovimientoMutation = useMutation({
    mutationFn: (payload) => movimientosService.create(payload),
    onSuccess: () => {
      // Invalida queries relacionadas automáticamente
      queryClient.invalidateQueries({ 
        queryKey: ['movimientos', 'list'] 
      });
      showToast('Movimiento creado exitosamente');
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error), 'error');
    }
  });
  
  // ✅ VENTAJA 6: Handlers con useCallback (memoizados)
  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters(current => ({
      ...current,
      [field === 'propietarioId' ? 'propietarioId' : field]: value,
      ...(field === 'propietarioId' ? { vtaId: '' } : {})
    }));
  }, []);
  
  const handleCreateMovimiento = useCallback(async (payload) => {
    await createMovimientoMutation.mutateAsync(payload);
  }, [createMovimientoMutation]);
  
  return (
    <Box>
      {/* Filtros */}
      <MovimientosFilters
        filters={filters}
        owners={owners || []}
        vtasList={filterVtas || []}
        onFilterChange={handleFilterChange}
        isLoading={loadingOwners}
      />
      
      {/* Tabla con paginación */}
      <MovimientosTable
        items={movimientos?.items || []}
        isLoading={loadingMovimientos}
        total={movimientos?.pagination?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      
      {/* Formulario */}
      <MovimientoForm
        onSubmit={handleCreateMovimiento}
        isSubmitting={createMovimientoMutation.isPending}
      />
    </Box>
  );
}

export default MovimientosPage;
```

### 6.3 Comparativa de Métricas

| Métrica | ANTES | DESPUÉS |
|---------|-------|---------|
| **Llamadas a `/listOwners` en mount** | 2-3 | 1 (deduplicado) |
| **Llamadas al navegar entre páginas** | 3-5 | 1 (caché compartida) |
| **Renderizaciones innecesarias** | 5-8 | 1-2 |
| **Tiempo de respuesta en filtros** | 450ms (debounce) | 500ms (debounce optimizado) |
| **Memory leak al desmontar** | Posible | No (cleanup automático) |
| **Complejidad de código** | Alta | Baja |
| **Mantenibilidad** | Baja | Alta |
| **Escalabilidad** | Baja | Alta |

---

## PARTE 7: CHECKLIST DE VALIDACIÓN

### 7.1 Verificación en Development

#### ✅ Chrome DevTools - Network
```
Ejecutar:
1. Abrir DevTools → Network tab
2. Filtrar: Fetch/XHR
3. Abrir aplicación
4. Navegar: Dashboard → Movimientos → Dashboard

Verificar:
□ Solo 1 llamada a /listOwners
□ Solo 1 llamada a /init
□ Sin llamadas duplicadas en los últimos 500ms
□ HTTP 304 en llamadas repetidas (caché servidor)
□ Cancelación de requests cuando navego rápido
```

#### ✅ React DevTools - Profiler
```
Ejecutar:
1. Abrir DevTools → Profiler
2. Iniciar recording
3. Cambiar filtro en Dashboard
4. Cambiar página en tabla de Movimientos
5. Detener recording

Verificar:
□ Menos de 3 renders totales
□ Cada render < 100ms
□ Components.jsx se renderiza solo cuando necesario
□ Table se renderiza solo cuando items cambian
```

#### ✅ React.StrictMode (Development)
```
Verificar:
□ Efectos se ejecutan 2x en strict mode (NORMAL)
□ Las 2 ejecuciones causan 1 sola llamada a backend
  (deduplicación working)
□ Sin warnings en console sobre missing dependencies
```

#### ✅ Monitoreo de Performance
```javascript
// En tu servicio de movimientos
const performanceMonitor = {
  metrics: {},
  
  measure(key, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.metrics[key]) {
      this.metrics[key] = { count: 0, totalMs: 0, avgMs: 0 };
    }
    
    this.metrics[key].count++;
    this.metrics[key].totalMs += duration;
    this.metrics[key].avgMs = this.metrics[key].totalMs / this.metrics[key].count;
    
    console.table(this.metrics);
    return result;
  }
};

// Uso
const data = await performanceMonitor.measure('listOwners', async () => {
  return await movimientosService.listOwners();
});
```

### 7.2 Métricas a Revisar

```
Core Web Vitals:
□ LCP (Largest Contentful Paint): < 2.5s
□ FID (First Input Delay): < 100ms
□ CLS (Cumulative Layout Shift): < 0.1

Performance:
□ Time to First Byte: < 600ms
□ First Contentful Paint: < 1.8s
□ Time to Interactive: < 3.8s

Network:
□ Total requests: < 10
□ Total size: < 500KB (sin images)
□ Unused JavaScript: < 30%
□ Unused CSS: < 20%

Cache:
□ Hit rate: > 70%
□ Cache size: < 50MB
□ Stale data: < 5 minutos
```

### 7.3 Testing del Comportamiento

```javascript
// tests/MovimientosPage.integration.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MovimientosPage from './MovimientosPage';

describe('MovimientosPage - Network Optimization', () => {
  let queryClient;
  let apiSpy;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    apiSpy = jest.spyOn(movimientosService, 'listOwners');
  });
  
  it('debe hacer solo 1 llamada a listOwners en mount', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  it('no debe hacer llamadas duplicadas en React.StrictMode', async () => {
    const { rerender } = render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <MovimientosPage />
        </QueryClientProvider>
      </React.StrictMode>
    );
    
    // StrictMode ejecuta 2x, pero deduplicación debe evitar 2 requests
    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  it('debe compartir caché entre MovimientosPage y DashboardPage', async () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
    });
    
    unmount();
    
    apiSpy.mockClear();
    
    // Re-render Dashboard que usa el mismo queryClient
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );
    
    // Debe reutilizar el caché, sin hacer nueva llamada
    await waitFor(() => {
      expect(apiSpy).not.toHaveBeenCalled();
    });
  });
  
  it('debe cancelar requests al desmontar', async () => {
    const abortSpy = jest.fn();
    
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <MovimientosPage />
      </QueryClientProvider>
    );
    
    // Desmontar inmediatamente (simular navigation)
    unmount();
    
    // Los requests en vuelo deben ser cancelados
    await waitFor(() => {
      expect(abortSpy).toHaveBeenCalled();
    });
  });
});
```

---

## PARTE 8: ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Setup de React Query (2-3 horas)

```
1. Instalar dependencias
   npm install @tanstack/react-query

2. Configurar en main.jsx
   - Crear QueryClient con opciones óptimas
   - Envolver <App /> con QueryClientProvider

3. Instalar React Query DevTools (opcional, para debugging)
   npm install @tanstack/react-query-devtools
```

### Fase 2: Crear Hooks Personalizados (3-4 horas)

```
Para cada endpoint, crear un hook:

✅ useOwnersQuery
   - queryKey: ['movimientos', 'owners']
   - staleTime: 5min
   - refetchOnWindowFocus: false

✅ useMovimientosInitQuery
   - queryKey: ['movimientos', 'init']
   - staleTime: 2min
   - Reemplaza /init del servicio

✅ useMovimientosListQuery
   - queryKey: ['movimientos', 'list', filters, page, rowsPerPage]
   - staleTime: 1min
   - Maneja paginación

✅ useVtasByOwnerQuery
   - queryKey: ['movimientos', 'vtas', propietarioId]
   - staleTime: 5min
   - enabled: !!propietarioId

✅ useTarifaQuery
   - queryKey: ['movimientos', 'tarifa', propietarioId, vtaId]
   - staleTime: 10min
   - enabled: !!propietarioId && !!vtaId

✅ useCreateMovimientoMutation
   - onSuccess: invalida ['movimientos', 'list']
   - onSuccess: invalida ['movimientos', 'init']
```

### Fase 3: Actualizar Componentes (4-5 horas)

```
MovimientosPage:
  ✅ Reemplazar useState + useEffect por hooks de React Query
  ✅ Simplificar lógica de loadOwners, loadVtas, loadTarifa
  ✅ Mantener misma UX/UI

DashboardPage:
  ✅ Usar los mismos hooks (caché compartida)
  ✅ Eliminar listOwners() manual
  ✅ Eliminar listVtasByOwner() manual
  ✅ Usar useQuery en lugar de fetchData manual
```

### Fase 4: Limpiar Código Legacy (1-2 horas)

```
Eliminar:
  ❌ movimientosStore.js (no necesario con React Query)
  ❌ cache.js (React Query maneja caché)
  ❌ requestDeduplicator.js (React Query deduplicaautomáticamente)
  ❌ createTtlCache (reemplazado por staleTime)

Simplificar:
  ✅ httpClient.js (dejar como está, sigue siendo útil)
  ✅ Servicios (no necesitan cambios)
```

### Fase 5: Testing y Validación (2-3 horas)

```
Pruebas manuales:
  □ Chrome DevTools - Network (sin duplicados)
  □ React DevTools - Profiler (renders optimizados)
  □ Performance en Slow 3G (debe ser rápido)
  □ Navegación rápida (cancelación de requests)

Pruebas automatizadas:
  □ Unit tests para hooks
  □ Integration tests para flujos
  □ Performance benchmarks

Documentación:
  □ Actualizar README de frontend
  □ Documentar patrones de React Query
  □ Ejemplos para nuevos desarrolladores
```

---

## RESUMEN EJECUTIVO

### Problemas Encontrados
- ✗ 5+ llamadas duplicadas a `/listOwners` en flujos normales
- ✗ Caché no compartida entre páginas
- ✗ Falta deduplicación en DashboardPage
- ✗ Renders innecesarios por recreación de objects
- ✗ Sin AbortController en algunos lugares

### Solución Recomendada
- ✅ React Query para gestión de caché automática
- ✅ Hooks personalizados reutilizables
- ✅ Deduplicación out-of-the-box
- ✅ Invalidación automática en mutations
- ✅ Código más mantenible y escalable

### Estimado de Esfuerzo
- **Total:** 12-18 horas (sin testing)
- **ROI:** Reducción de 80% en llamadas duplicadas
- **Valor:** Performance mejorada, mejor UX, menos bugs

---

**Próximo paso:** ¿Deseas que implemente la Fase 1 (setup de React Query) con ejemplos concretos?
