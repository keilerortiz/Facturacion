import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { tokens } from '../../styles/theme';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import DashboardRecentActivityTable from '../../components/dashboard/DashboardRecentActivityTable';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDate } from '../../utils/date';
import { useFilterState } from '../../hooks/filters/useFilterState';
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAlerts } from '../../hooks/useDashboardAlerts';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';

// ── Barra de proporción para Top 5 ───────────────────────────────────────────

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

// ── DashboardPage ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

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
  const alerts                       = useDashboardAlerts(items);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);

  const maxFacturacion = topPropietarios[0]?.total   ?? 1;
  const maxVolumen     = topVtas[0]?.volumen          ?? 1;

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

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total movimientos hoy"
            value={kpis.totalHoy ?? '—'}
            helper="Registrados en el sistema"
            tone="primary.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Volumen acumulado"
            value={kpis.volumenTotal.toFixed(2)}
            helper="Σ cantidad · vista actual"
            tone="secondary.main"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            label="Facturación"
            value={formatCurrency(kpis.facturacionTotal)}
            helper="Σ total · vista actual"
            tone="success.main"
          />
        </Grid>
      </Grid>

      {/* ── Alertas operativas ────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {alerts.map((a) => (
            <Alert
              key={a.id}
              severity={a.severity}
              icon={a.severity === 'error' ? <ErrorOutlineIcon /> : <WarningAmberIcon />}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => navigate('/movimientos')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Ver detalle
                </Button>
              }
              sx={{ borderRadius: 2 }}
            >
              {a.label}
            </Alert>
          ))}
        </Stack>
      )}

      {/* ── Top 5 ─────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, border: `1px solid ${tokens.borderCard}`, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Top propietarios · facturación
            </Typography>
            {topPropietarios.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin datos</Typography>
            ) : (
              <Stack spacing={1.5}>
                {topPropietarios.map((p, idx) => (
                  <TopBar
                    key={`propietario-${idx}`}
                    label={p.propietario}
                    valueLabel={formatCurrency(p.total)}
                    pct={(p.total / maxFacturacion) * 100}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, border: `1px solid ${tokens.borderCard}`, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Top VTA · volumen
            </Typography>
            {topVtas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin datos</Typography>
            ) : (
              <Stack spacing={1.5}>
                {topVtas.map((v, idx) => (
                  <TopBar
                    key={`vta-${idx}`}
                    label={`${v.vta} · ${v.nombre} (${v.propietario})`}
                    valueLabel={`${v.volumen.toFixed(2)} ${v.udmvta}`}
                    pct={(v.volumen / maxVolumen) * 100}
                  />
                ))}
              </Stack>
            )}
          </Paper>
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
