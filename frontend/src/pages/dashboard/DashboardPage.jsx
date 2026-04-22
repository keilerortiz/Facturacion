import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh'; // ✓ Valid icon
import { tokens } from '../../styles/theme';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import DashboardRecentActivityTable from '../../components/dashboard/DashboardRecentActivityTable';
import KPIGrid from '../../components/dashboard/KPISection/KPIGrid';
import HorizontalBarChart from '../../components/dashboard/ChartsSection/HorizontalBarChart';
import DonutChart from '../../components/dashboard/ChartsSection/DonutChart';
import ComboChart from '../../components/dashboard/ChartsSection/ComboChart';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDate } from '../../utils/date';
import { useFilterState } from '../../hooks/filters/useFilterState';
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';
import { useDashboardChartData } from '../../hooks/useDashboardChartData';
// ── DashboardPage ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useAuth();

  // ── Filtros ───────────────────────────────────────────────────────────────
  // Todos los campos del Dashboard son inmediatos (fechas + selects), por lo
  // que usamos applyField/applyPartial directamente sin separación draft/query.
  const {
    draft:   filters,     // alias semántico para la UI
    applied: appliedFilters,
    applyField,
    applyPartial,
    resetFilters,
  } = useFilterState({
    fechaDesde:    getTodayDate(),
    fechaHasta:    getTodayDate(),
    propietarioId: '',
    vtaId:         '',
  });
  const [page, setPage]  = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Queries (caché compartida con MovimientosPage) ────────────────────────
  // Propietarios: React Query deduplica automáticamente → 0 llamadas extra
  const { data: owners = [], isLoading: loadingOwners } = useOwnersQuery();

  // VTAs: solo fetch cuando hay propietarioId
  const { data: filterVtas = [] } = useVtasByOwnerQuery(filters.propietarioId);

  // Movimientos del dashboard (filtros + paginación)
  // Usa appliedFilters (no el draft) para que la query sea estable.
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

  // ── Derivados ─────────────────────────────────────────────────────────────
  const items      = movimientosData?.items      ?? [];
  const pagination = movimientosData?.pagination ?? null;

  const kpis                         = useDashboardKPIs(items, pagination);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);
  const { ingresosPorTipo, ingresosPorCeco, ingresosPorDia, sparklineData } = useDashboardChartData(items);

  // ── Handlers ──────────────────────────────────────────────────────────────
  // Cambio de un campo individual (fecha o select) → aplica inmediatamente
  const handleFilterChange = useCallback((key, value) => {
    setPage(0);
    applyField(key, value);
  }, [applyField]);

  // Cambio de múltiples campos a la vez (atajos rápidos de fecha)
  // → evita dos queries consecutivas; aplica todo en un solo estado
  const handleApplyPartial = useCallback((partial) => {
    setPage(0);
    applyPartial(partial);
  }, [applyPartial]);

  const handleClearFilters = useCallback(() => {
    setPage(0);
    resetFilters();
  }, [resetFilters]);

  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);

  // ── Estado vacío / carga inicial ──────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!movimientosData) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 5, textAlign: 'center', border: `1px solid ${tokens.borderLight}`, borderRadius: 2 }}
      >
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Sin datos operativos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No hay movimientos registrados.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Actualizar datos
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      {/* ── Filtros + Botón Actualizar ────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
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
          startIcon={isFetching ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
          size="small"
          sx={{ mt: 0.5 }}
        >
          {isFetching ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </Stack>

      {/* ── KPI Grid (5 tarjetas principales) ──────────────────────────────── */}
      <KPIGrid
        totalMovimientos={kpis.totalHoy}
        ticketPromedio={formatCurrency(kpis.ticketPromedio)}
        facturacionTotal={formatCurrency(kpis.facturacionTotal)}
        cantidadTotal={items.reduce((sum, item) => sum + (item.cantidad || 0), 0)}
        sparklineData={sparklineData}
      />

      {/* ── Charts Section ────────────────────────────────────────────────────── */}
      {/* Fila 1: Top Propietarios + Donuts */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <HorizontalBarChart
            title="Top Propietarios"
            subtitle="Facturación (últimos registros)"
            data={topPropietarios.map((p) => ({
              name: p.propietario,
              value: p.total,
            }))}
            nameKey="name"
            dataKey="value"
            barColor="#1976d2"
            showValues
            showPercentage
            height={300}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3.5}>
          <DonutChart
            title="Ingresos por Tipo"
            data={ingresosPorTipo}
            dataKey="value"
            nameKey="name"
            colors={['#1976d2', '#4caf50', '#ff9800', '#f44336', '#2196f3']}
            height={300}
            showLegend
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3.5}>
          <DonutChart
            title="Ingresos por CECO"
            data={ingresosPorCeco}
            dataKey="value"
            nameKey="name"
            colors={['#1976d2', '#4caf50', '#ff9800', '#f44336', '#2196f3', '#81c784', '#66bb6a', '#43a047', '#388e3c', '#e91e63', '#9c27b0', '#00bcd4', '#ffeb3b', '#8bc34a']}
            height={300}
            showLegend
          />
        </Grid>
      </Grid>

      {/* Fila 2: Top VTA + Combo Chart */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <HorizontalBarChart
            title="Top VTA"
            subtitle="Ingresos (últimos registros)"
            data={topVtas.map((v) => ({
              name: `${v.vta} - ${v.nombre}`,
              value: v.ingresos,
            }))}
            nameKey="name"
            dataKey="value"
            barColor="#2196f3"
            showValues
            showPercentage
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <ComboChart
            title="Ingresos × Día"
            subtitle="Barras: ingresos | Línea: cantidad"
            data={ingresosPorDia}
            barKey="ingresos"
            lineKey="cantidad"
            barColor="#1976d2"
            lineColor="#4caf50"
            barLabel="Ingresos ($)"
            lineLabel="Cantidad"
            height={300}
          />
        </Grid>
      </Grid>

      {/* ── Actividad reciente ────────────────────────────────────────────── */}
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
