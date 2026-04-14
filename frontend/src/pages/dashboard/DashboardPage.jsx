import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { tokens } from '../../styles/theme';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { movimientosStore } from '../../utils/movimientosStore';
import { formatCurrency, formatDate } from '../../utils/date';
import { useDashboardKPIs } from '../../hooks/useDashboardKPIs';
import { useDashboardAlerts } from '../../hooks/useDashboardAlerts';
import { useDashboardAggregations } from '../../hooks/useDashboardAggregations';

// ── Helpers de estado visual ──────────────────────────────────────────────────

function getItemStatus(item) {
  if (item.cantidad <= 0 || item.tarifa === null || item.tarifa === undefined || item.tarifa <= 0) {
    return 'error';
  }
  return 'ok';
}

const STATUS_CFG = {
  ok:      { label: 'OK',        color: '#2f855a', bg: 'rgba(47,133,90,0.10)'  },
  warning: { label: 'Pendiente', color: '#b7791f', bg: 'rgba(183,121,31,0.10)' },
  error:   { label: 'Error',     color: '#c05621', bg: 'rgba(192,86,33,0.10)'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        borderRadius: '4px',
        bgcolor: cfg.bg,
        color: cfg.color,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </Box>
  );
}

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

  // Suscripción reactiva: se actualiza cuando MovimientosPage resuelve /init
  useEffect(() => {
    return movimientosStore.subscribe(setMovimientosData);
  }, []);

  const items      = movimientosData?.items      ?? [];
  const pagination = movimientosData?.pagination ?? null;

  const kpis                      = useDashboardKPIs(items, pagination);
  const alerts                    = useDashboardAlerts(items);
  const { topPropietarios, topVtas } = useDashboardAggregations(items);

  const maxFacturacion = topPropietarios[0]?.total   ?? 1;
  const maxVolumen     = topVtas[0]?.volumen          ?? 1;

  // ── Estado vacío ─────────────────────────────────────────────────────────
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
            El dashboard se activa al cargar la sección de Movimientos.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/movimientos')}>
            Ir a Movimientos
          </Button>
        </Paper>
      </>
    );
  }

  return (
    <>
      {/* ── Acciones rápidas ─────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/movimientos')}
          size="small"
        >
          Nuevo movimiento
        </Button>
        <Button
          variant="outlined"
          startIcon={<ListAltIcon />}
          onClick={() => navigate('/movimientos')}
          size="small"
        >
          Consultar movimientos
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={() => navigate('/movimientos')}
          size="small"
        >
          Exportar información
        </Button>
      </Stack>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
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
        <Stack spacing={1} sx={{ mb: 3 }}>
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
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2.5, border: `1px solid ${tokens.borderCard}`, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Top propietarios · facturación
            </Typography>
            {topPropietarios.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin datos</Typography>
            ) : (
              <Stack spacing={1.75}>
                {topPropietarios.map((p) => (
                  <TopBar
                    key={p.propietario}
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
          <Paper elevation={1} sx={{ p: 2.5, border: `1px solid ${tokens.borderCard}`, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Top VTA · volumen
            </Typography>
            {topVtas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin datos</Typography>
            ) : (
              <Stack spacing={1.75}>
                {topVtas.map((v) => (
                  <TopBar
                    key={v.vta}
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
      <Paper elevation={1} sx={{ border: `1px solid ${tokens.borderCard}` }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Stack direction="row" alignItems="baseline" spacing={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Actividad reciente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              últimos {items.length} registros del día
            </Typography>
          </Stack>
        </Box>
        <Divider />
        {items.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">Sin registros disponibles.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: tokens.tableHeadBg }}>
                  {['Fecha', 'Propietario · VTA', 'Tipo', 'Cantidad', 'Total', 'Estado'].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        px: 2,
                        py: 1.25,
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: tokens.tableHeadColor,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        borderBottom: `1px solid ${tokens.tableHeadBorder}`,
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {items.map((item, idx) => (
                  <Box
                    component="tr"
                    key={item.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? 'background.paper' : tokens.bgSubtle,
                      '&:hover': { bgcolor: tokens.hoverRow },
                    }}
                  >
                    <Box component="td" sx={{ px: 2, py: 1.25, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatDate(item.fecha)}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {item.propietario}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.vtaCodigo}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.25 }}>
                      {item.tipovta ? (
                        <Chip label={item.tipovta} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.25, fontSize: '0.82rem', fontWeight: 600 }}>
                      {item.cantidad.toFixed(2)}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.25, fontSize: '0.82rem' }}>
                      {item.total != null ? formatCurrency(item.total) : '—'}
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.25 }}>
                      <StatusBadge status={getItemStatus(item)} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

    </>
  );
}

export default DashboardPage;
