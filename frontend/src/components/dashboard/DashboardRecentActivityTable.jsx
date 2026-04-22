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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { formatCurrency, formatDate } from '../../utils/date';
import { tokens } from '../../styles/theme';
import { movimientosService } from '../../services/movimientosService';
import { getApiErrorMessage } from '../../utils/apiError';

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
      await movimientosService.exportExcel(filters);
      // Toast de éxito (opcional - el servicio descarga automáticamente)
    } catch (requestError) {
      console.error('Error exportando:', getApiErrorMessage(requestError));
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const handleRowsPerPageChange = useCallback((event) => {
    const newValue = Number(event.target.value);
    onRowsPerPageChange?.(newValue);
  }, [onRowsPerPageChange]);

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${tokens.borderCard}`, borderRadius: 2, bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, pt: 2.5, pb: 2, bgcolor: 'rgba(0, 0, 0, 0.01)', borderBottom: `1px solid ${tokens.borderCard}` }}>
        <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Actividad reciente
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
              últimos {items.length} registros del día
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            startIcon={exporting
              ? <CircularProgress size={13} color="inherit" />
              : <FileDownloadIcon sx={{ fontSize: '16px !important' }} />}
            sx={{ flexShrink: 0, fontSize: '0.8rem', textTransform: 'none', borderColor: tokens.borderStrong }}
          >
            {exporting ? 'Exportando...' : 'Excel'}
          </Button>
        </Stack>
      </Box>

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
                  {['Fecha', 'Propietario · VTA', 'CECO', 'Tipo', 'Cantidad', 'Total'].map((h) => (
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
                      <Box component="td" sx={{ px: 2, py: 1.25, fontSize: '0.82rem' }}>
                        {item.ceco ? (
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>{item.ceco}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
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
