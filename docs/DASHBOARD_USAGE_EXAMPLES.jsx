/**
 * EJEMPLOS DE USO - Dashboard Rediseño
 * 
 * Este archivo muestra cómo utilizar cada componente en contexto
 * y cómo integrar datos reales del backend.
 */

// ════════════════════════════════════════════════════════════════════════════════
// 1. EJEMPLO: EnhancedKPICard
// ════════════════════════════════════════════════════════════════════════════════

import EnhancedKPICard from '@/components/dashboard/KPISection/EnhancedKPICard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

function KPIExample() {
  // Simular datos del hook
  const sparklineData = [
    { value: 10000 },
    { value: 12000 },
    { value: 11500 },
    { value: 13000 },
    { value: 14200 },
    { value: 13800 },
    { value: 15200 },
  ];

  return (
    <>
      {/* KPI con sparkline y variación positiva */}
      <EnhancedKPICard
        icon={AttachMoneyIcon}
        label="Facturación Total"
        value="$125,450.50"
        change="+12.5%"
        changeType="positive"
        sparklineData={sparklineData}
        tone="success"
        subtitle="Últimos 7 días"
      />

      {/* KPI sin sparkline */}
      <EnhancedKPICard
        icon={TrendingUpIcon}
        label="Ticket Promedio"
        value="$2,780"
        change="-3.2%"
        changeType="negative"
        tone="info"
        subtitle="Por movimiento"
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. EJEMPLO: HorizontalBarChart
// ════════════════════════════════════════════════════════════════════════════════

import HorizontalBarChart from '@/components/dashboard/ChartsSection/HorizontalBarChart';
import { useDashboardAggregations } from '@/hooks/useDashboardAggregations';

function BarChartExample({ items }) {
  // Usar hook existente para obtener top propietarios
  const { topPropietarios } = useDashboardAggregations(items);

  // Transformar formato para el gráfico
  const chartData = topPropietarios.map((p) => ({
    name: p.propietario,
    value: p.total,
  }));

  return (
    <HorizontalBarChart
      title="Top 5 Propietarios"
      subtitle="Por facturación total"
      data={chartData}
      nameKey="name"
      dataKey="value"
      barColor="#1976d2"
      showValues
      showPercentage
      height={280}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 3. EJEMPLO: DonutChart - Ingresos por Tipo
// ════════════════════════════════════════════════════════════════════════════════

import DonutChart from '@/components/dashboard/ChartsSection/DonutChart';

function DonutChartExample({ items }) {
  // Agrupar movimientos por tipo
  const tipoMap = new Map();
  
  for (const item of items) {
    const tipo = item.tipo || 'SIN_TIPO';
    const valor = item.total || 0;
    
    if (!tipoMap.has(tipo)) {
      tipoMap.set(tipo, { name: tipo, value: 0 });
    }
    tipoMap.get(tipo).value += valor;
  }
  
  const ingresosPorTipo = [...tipoMap.values()]
    .sort((a, b) => b.value - a.value);

  // Asignar colores por tipo
  const colorMap = {
    'CARGUE': '#1976d2',      // Azul
    'DESCARGUE': '#4caf50',   // Verde
    'TRANSFERENCIA': '#ff9800', // Naranja
  };

  const colors = ingresosPorTipo.map((item) => 
    colorMap[item.name] || '#2196f3'
  );

  return (
    <DonutChart
      title="Ingresos por Tipo de Movimiento"
      data={ingresosPorTipo}
      dataKey="value"
      nameKey="name"
      colors={colors}
      height={280}
      showLegend={true}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 4. EJEMPLO: ComboChart - Ingresos × Día
// ════════════════════════════════════════════════════════════════════════════════

import ComboChart from '@/components/dashboard/ChartsSection/ComboChart';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';

function ComboChartExample({ items }) {
  // Usar el hook para obtener datos transformados
  const { ingresosPorDia } = useDashboardChartData(items);

  return (
    <ComboChart
      title="Evolución Diaria: Ingresos & Cantidad"
      subtitle="Barras: ingresos totales | Línea: cantidad de movimientos"
      data={ingresosPorDia}
      barKey="ingresos"
      lineKey="cantidad"
      barColor="#1976d2"      // Azul para ingresos
      lineColor="#4caf50"     // Verde para cantidad
      barLabel="Ingresos ($)"
      lineLabel="Cantidad (unidades)"
      height={300}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 5. EJEMPLO: KPIGrid - Grid de 5 KPIs
// ════════════════════════════════════════════════════════════════════════════════

import KPIGrid from '@/components/dashboard/KPISection/KPIGrid';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';
import { formatCurrency } from '@/utils/date';

function KPIGridExample({ items, pagination }) {
  // Obtener KPIs con hook existente
  const kpis = useDashboardKPIs(items, pagination);
  
  // Obtener sparkline data con nuevo hook
  const { sparklineData } = useDashboardChartData(items);

  // Calcular cantidad total
  const cantidadTotal = items.reduce((sum, item) => 
    sum + (item.cantidad || 0), 0
  );

  return (
    <KPIGrid
      totalMovimientos={kpis.totalHoy}
      ticketPromedio={formatCurrency(kpis.ticketPromedio)}
      facturacionTotal={formatCurrency(kpis.facturacionTotal)}
      cantidadTotal={Math.round(cantidadTotal)}
      variacion={{
        value: '+12.5%',
        change: '+15%',
        changeType: 'positive',
      }}
      sparklineData={sparklineData}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 6. EJEMPLO COMPLETO: DashboardPage con todos los gráficos
// ════════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import KPIGrid from '@/components/dashboard/KPISection/KPIGrid';
import HorizontalBarChart from '@/components/dashboard/ChartsSection/HorizontalBarChart';
import DonutChart from '@/components/dashboard/ChartsSection/DonutChart';
import ComboChart from '@/components/dashboard/ChartsSection/ComboChart';
import DashboardRecentActivityTable from '@/components/dashboard/DashboardRecentActivityTable';

// Hooks
import { useFilterState } from '@/hooks/filters/useFilterState';
import { useOwnersQuery } from '@/hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '@/hooks/queries/useVtasByOwnerQuery';
import { useMovimientosListQuery } from '@/hooks/queries/useMovimientosListQuery';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useDashboardAggregations } from '@/hooks/useDashboardAggregations';
import { useDashboardChartData } from '@/hooks/useDashboardChartData';

import { formatCurrency, getTodayDate } from '@/utils/date';

function DashboardPageComplete() {
  // Estado de filtros y paginación (exactamente igual que antes)
  const {
    draft: filters,
    applied: appliedFilters,
    applyField,
    applyPartial,
    resetFilters,
  } = useFilterState({
    fechaDesde: getTodayDate(),
    fechaHasta: getTodayDate(),
    propietarioId: '',
    vtaId: '',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Queries (exactamente igual que antes)
  const { data: owners = [] } = useOwnersQuery();
  const { data: filterVtas = [] } = useVtasByOwnerQuery(filters.propietarioId);
  const {
    data: movimientosData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useMovimientosListQuery({
    filters: appliedFilters,
    page,
    rowsPerPage,
  });

  // Derivados (datos listos para usar)
  const items = movimientosData?.items ?? [];
  const pagination = movimientosData?.pagination ?? null;

  // TODOS estos hooks pueden convivir sin conflictos
  const kpis = useDashboardKPIs(items, pagination);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);
  const {
    ingresosPorTipo,
    ingresosPorCeco,
    ingresosPorDia,
    sparklineData,
  } = useDashboardChartData(items);

  // Handlers (exactamente igual que antes)
  const handleFilterChange = useCallback(
    (key, value) => {
      setPage(0);
      applyField(key, value);
    },
    [applyField]
  );

  const handleApplyPartial = useCallback(
    (partial) => {
      setPage(0);
      applyPartial(partial);
    },
    [applyPartial]
  );

  const handleClearFilters = useCallback(() => {
    setPage(0);
    resetFilters();
  }, [resetFilters]);

  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render
  return (
    <>
      {/* Filtros */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1.5 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DashboardFilters
            filters={filters}
            owners={owners}
            vtas={filterVtas}
            onFilterChange={handleFilterChange}
            onApplyPartial={handleApplyPartial}
            onClearFilters={handleClearFilters}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={isFetching ? <CircularProgress size={14} /> : <RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
          size="small"
          sx={{ mt: 0.5 }}
        >
          {isFetching ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Stack>

      {/* KPI Grid (5 tarjetas) */}
      <KPIGrid
        totalMovimientos={kpis.totalHoy}
        ticketPromedio={formatCurrency(kpis.ticketPromedio)}
        facturacionTotal={formatCurrency(kpis.facturacionTotal)}
        cantidadTotal={items.reduce((sum, item) => sum + (item.cantidad || 0), 0)}
        sparklineData={sparklineData}
      />

      {/* Gráficos - Fila 1 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <HorizontalBarChart
            title="Top Propietarios"
            subtitle="Facturación"
            data={topPropietarios.map((p) => ({
              name: p.propietario,
              value: p.total,
            }))}
            nameKey="name"
            dataKey="value"
            barColor="#1976d2"
            showValues
            showPercentage
            height={260}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3.5}>
          <DonutChart
            title="Ingresos por Tipo"
            data={ingresosPorTipo}
            dataKey="value"
            nameKey="name"
            colors={['#1976d2', '#4caf50', '#ff9800']}
            height={260}
            showLegend
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3.5}>
          <DonutChart
            title="Ingresos por CECO"
            data={ingresosPorCeco}
            dataKey="value"
            nameKey="name"
            colors={['#81c784', '#66bb6a', '#4caf50']}
            height={260}
            showLegend
          />
        </Grid>
      </Grid>

      {/* Gráficos - Fila 2 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <HorizontalBarChart
            title="Top VTA"
            subtitle="Ingresos"
            data={topVtas.map((v) => ({
              name: `${v.vta} - ${v.nombre}`,
              value: v.ingresos,
            }))}
            nameKey="name"
            dataKey="value"
            barColor="#2196f3"
            showValues
            showPercentage
            height={260}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <ComboChart
            title="Evolución Diaria"
            subtitle="Barras: ingresos | Línea: cantidad"
            data={ingresosPorDia}
            barKey="ingresos"
            lineKey="cantidad"
            barColor="#1976d2"
            lineColor="#4caf50"
            barLabel="Ingresos ($)"
            lineLabel="Cantidad"
            height={260}
          />
        </Grid>
      </Grid>

      {/* Tabla de actividad reciente */}
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

export default DashboardPageComplete;

// ════════════════════════════════════════════════════════════════════════════════
// DATOS SIMULADOS PARA TESTING
// ════════════════════════════════════════════════════════════════════════════════

export const MOCK_ITEMS = [
  {
    id: 1,
    fecha: '2026-04-21T10:30:00',
    propietarioId: 1,
    propietario: 'Propietario A',
    vtaId: 1,
    vtaCodigo: 'VTA-001',
    vtaNombre: 'Bodega Central',
    ceco: 'CECO-001',
    tipo: 'CARGUE',
    cantidad: 125,
    total: 12500,
    tipovta: 'ENTRADA',
  },
  {
    id: 2,
    fecha: '2026-04-21T14:15:00',
    propietarioId: 2,
    propietario: 'Propietario B',
    vtaId: 2,
    vtaCodigo: 'VTA-002',
    vtaNombre: 'Sucursal Sur',
    ceco: 'CECO-002',
    tipo: 'DESCARGUE',
    cantidad: 85,
    total: 8500,
    tipovta: 'SALIDA',
  },
  {
    id: 3,
    fecha: '2026-04-21T16:45:00',
    propietarioId: 1,
    propietario: 'Propietario A',
    vtaId: 3,
    vtaCodigo: 'VTA-003',
    vtaNombre: 'Bodega Norte',
    ceco: 'CECO-001',
    tipo: 'CARGUE',
    cantidad: 200,
    total: 20000,
    tipovta: 'ENTRADA',
  },
  // ... más items
];

export const MOCK_PAGINATION = {
  total: 45,
  limit: 10,
  offset: 0,
};
