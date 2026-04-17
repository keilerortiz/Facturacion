import { memo, useMemo, useCallback, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { formatCurrency, formatDate } from '../../utils/date';
import { tokens } from '../../styles/theme';
import { movimientosService } from '../../services/movimientosService';
import { getApiErrorMessage } from '../../utils/apiError';

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

// ── Componente principal ─────────────────────────────────────────────────────

function DashboardRecentActivityTable({
  items = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  filters = {},
}) {
  const [exporting, setExporting] = useState(false);

  // Calcular items paginados
  const paginatedItems = useMemo(() => {
    return items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [items, page, rowsPerPage]);

  // Handlers
  const handlePageChange = useCallback((event, newPage) => {
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      console.log('[DashboardRecentActivityTable] Exporting with filters:', filters);
      await movimientosService.exportExcel(filters);
      // Toast de éxito (opcional - el servicio descarga automáticamente)
    } catch (requestError) {
      const errorMsg = getApiErrorMessage(requestError);
      console.error('[DashboardRecentActivityTable] Error exportando:', errorMsg);
      console.error('[DashboardRecentActivityTable] Error completo:', requestError);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const handleRowsPerPageChange = useCallback((event) => {
    const newValue = Number(event.target.value);
    onRowsPerPageChange?.(newValue);
  }, [onRowsPerPageChange]);

  return (
    <Paper elevation={1} sx={{ border: `1px solid ${tokens.borderCard}` }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" alignItems="baseline" spacing={1.5} justifyContent="space-between">
          <Stack direction="row" alignItems="baseline" spacing={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Actividad reciente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              últimos {items.length} registros del día
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            startIcon={exporting
              ? <CircularProgress size={13} color="inherit" />
              : <FileDownloadOutlinedIcon sx={{ fontSize: '16px !important' }} />}
            sx={{ flexShrink: 0, fontSize: '0.8rem', textTransform: 'none', borderColor: tokens.borderStrong }}
          >
            {exporting ? 'Exportando...' : 'Excel'}
          </Button>
        </Stack>
      </Box>
      <Divider />

      {/* Content */}
      {items.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Sin registros disponibles.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto', overflowY: 'auto', height: '500px', maxHeight: '60vh' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <Box component="tr" sx={{ bgcolor: tokens.tableHeadBg }}>
                  {['Fecha', 'Propietario · VTA', 'Tipo', 'Cantidad', 'Total', 'CECO'].map((h) => (
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
                {paginatedItems.map((item, relativeIdx) => {
                  const globalIdx = page * rowsPerPage + relativeIdx;
                  return (
                    <Box
                      component="tr"
                      key={item.id}
                      sx={{
                        bgcolor: globalIdx % 2 === 0 ? 'background.paper' : tokens.bgSubtle,
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
                          {item.vtaCodigo} {item.vtaNombre ? `- ${item.vtaNombre}` : ''}
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
                      <Box component="td" sx={{ px: 2, py: 1.25, fontSize: '0.82rem' }}>
                        {item.ceco ? (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.ceco}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* Paginación */}
          <TablePagination
            component="div"
            count={items.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Filas:"
            SelectProps={{ size: 'small' }}
            sx={{
              borderTop: '1px solid',
              borderTopColor: 'divider',
              '.MuiTablePagination-toolbar': { minHeight: 44 },
              '.MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel': {
                fontSize: '0.8rem'
              }
            }}
          />
        </>
      )}
    </Paper>
  );
}

export default memo(DashboardRecentActivityTable);
