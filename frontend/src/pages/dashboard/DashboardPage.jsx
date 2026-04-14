import { useCallback, useEffect, useState } from 'react';
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
import { movimientosStore } from '../../utils/movimientosStore';
import { formatCurrency, getTodayDate } from '../../utils/date';
import { movimientosService } from '../../services/movimientosService';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAlerts } from '../../hooks/useDashboardAlerts';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';

// ── Barra de proporción para Top 5 ───────────────────────────────────────────

function TopBar({ label, valueLabel, pct }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: '60%', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
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
  const navigate = useNavigate();

  const [movimientosData, setMovimientosData] = useState(() => movimientosStore.get());
  const [loading, setLoading] = useState(!movimientosData);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({
    fechaDesde: getTodayDate(),
    fechaHasta: getTodayDate(),
    propietarioId: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Cargar propietarios
  useEffect(() => {
    const loadOwners = async () => {
      try {
        const response = await movimientosService.listOwners();
        setOwners(response.items || []);
      } catch (error) {
        console.error('Error cargando propietarios:', error);
      }
    };
    loadOwners();
  }, []);

  // Función para cargar datos con filtros
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const response = await movimientosService.list({
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        propietarioId: filters.propietarioId
      });
      setMovimientosData(response);
      movimientosStore.set(response);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial: si no hay datos en el store, cargar automáticamente
  useEffect(() => {
    if (!movimientosData) {
      loadInitialData();
    }
  }, []);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    if (movimientosData) {
      loadInitialData();
    }
  }, [filters]);

  // Suscripción reactiva: se actualiza cuando MovimientosPage resuelve /init
  useEffect(() => {
    return movimientosStore.subscribe(setMovimientosData);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleClearFilters = useCallback(() => {
    setFilters({
      fechaDesde: getTodayDate(),
      fechaHasta: getTodayDate(),
      propietarioId: ''
    });
    setPage(0);
  }, []);

  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);

  const items      = movimientosData?.items      ?? [];
  const pagination = movimientosData?.pagination ?? null;

  const kpis                      = useDashboardKPIs(items, pagination);
  const alerts                    = useDashboardAlerts(items);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);

  const maxFacturacion = topPropietarios[0]?.total   ?? 1;
  const maxVolumen     = topVtas[0]?.volumen          ?? 1;

  // ── Estado vacío ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!movimientosData) {
    return (
      <>
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
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={loadInitialData}
            >
              Actualizar datos
            </Button>
          </Stack>
        </Paper>
      </>
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
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadInitialData}
          disabled={loading}
          size="small"
          sx={{ mt: 0.5 }}
        >
          Actualizar datos
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

      {/* ── Alertas operativas (solo si hay) ──────────────────────────────── */}
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

      {/* ── Análisis operativo: Top 5 ─────────────────────────────────────── */}
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
                    label={v.nombre ? `${v.vta} · ${v.nombre}` : v.vta}
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
      />
    </>
  );
}

export default DashboardPage;
