import { memo, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/date';
import { tokens } from '../../styles/theme';

// ─── Constantes ──────────────────────────────────────────────────────────────
const LS_KEY = 'movimientos_col_widths';
const MIN_COL_WIDTH = 60;

const HEAD_CELL_BASE_STYLE = { minWidth: MIN_COL_WIDTH, position: 'sticky', top: 0, zIndex: 3, userSelect: 'none', padding: '10px 12px' };

export const COLUMNS = [
  { id: 'fecha',         label: 'Fecha',       align: 'left',  defaultWidth: 90,  toggleable: true  },
  { id: 'decada',        label: 'Década',      align: 'left',  defaultWidth: 90,  toggleable: true  },
  { id: 'propietario',   label: 'Propietario', align: 'left',  defaultWidth: 150, toggleable: true  },
  { id: 'vtaCodigo',     label: 'VTA',         align: 'left',  defaultWidth: 150, toggleable: true  },
  { id: 'ceco',          label: 'CECO',        align: 'left',  defaultWidth: 100, sortable: false,  toggleable: true  },
  { id: 'tipovta',       label: 'Tipo',        align: 'left',  defaultWidth: 100, sortable: false,  toggleable: true  },
  { id: 'cantidad',      label: 'Cantidad',    align: 'right', defaultWidth: 90,  toggleable: true  },
  { id: 'total',         label: 'Total',       align: 'right', defaultWidth: 110, sortable: false,  toggleable: true  },
  { id: 'observaciones', label: 'Observaciones', align: 'left', defaultWidth: 200, sortable: false, toggleable: true },
  { id: 'usuario',       label: 'Usuario',     align: 'left',  defaultWidth: 110, sortable: false,  toggleable: true  },
  { id: 'acciones',      label: '',            align: 'right', defaultWidth: 76,  sortable: false,  noResize: true, toggleable: false },
];

function loadSavedWidths() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Subcomponente: cabecera redimensionable ──────────────────────────────────
const ResizableHead = memo(function ResizableHead({ columns, order, orderBy, onSort, columnWidths, onResizeStart, onResizeDblClick }) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((col) => {
          const width = columnWidths[col.id] ?? col.defaultWidth;
          return (
            <TableCell
              key={col.id}
              align={col.align}
              sortDirection={orderBy === col.id ? order : false}
              style={{ ...HEAD_CELL_BASE_STYLE, width }}
              sx={{
                backgroundColor: 'primary.main',
                borderBottom: '3px solid',
                borderBottomColor: tokens.sidebarDivider,
                boxShadow: '0 3px 6px rgba(0,0,0,0.22)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: tokens.sidebarText,
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s',
                '&:hover': { backgroundColor: 'primary.light' },
              }}
            >
              {col.sortable !== false ? (
                <TableSortLabel
                  active={orderBy === col.id}
                  direction={orderBy === col.id ? order : 'asc'}
                  onClick={() => onSort(col.id)}
                  hideSortIcon={orderBy !== col.id}
                  sx={{
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    letterSpacing: 'inherit',
                    textTransform: 'inherit',
                    color: 'inherit',
                    '&.Mui-active': { color: '#fff' },
                    '& .MuiTableSortLabel-icon': { fontSize: '13px', color: tokens.sidebarMuted },
                    '&:hover': { color: '#fff' },
                  }}
                >
                  {col.label}
                </TableSortLabel>
              ) : (
                col.label
              )}

              {/* Handle de redimensionamiento */}
              {!col.noResize && (
                <Box
                  component="span"
                  onMouseDown={(e) => onResizeStart(e, col.id)}
                  onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onResizeDblClick(col.id); }}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'col-resize',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::after': {
                      content: '""',
                      display: 'block',
                      width: '2px',
                      height: '45%',
                      backgroundColor: 'transparent',
                      borderRadius: '1px',
                      transition: 'background-color 0.18s',
                    },
                    '&:hover::after, &:active::after': {
                      backgroundColor: 'rgba(25,118,210,0.7)',
                    },
                  }}
                />
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
});

// ─── Función de renderizado de celda ──────────────────────────────────────────
function renderCell(colId, item, cellPad) {
  switch (colId) {
    case 'fecha':
      return (
        <TableCell key="fecha" sx={{ padding: cellPad, color: 'text.secondary', fontSize: '0.82rem' }}>
          {formatDate(item.fecha)}
        </TableCell>
      );
    case 'decada':
      return (
        <TableCell key="decada" sx={{ padding: cellPad, color: 'text.secondary', fontSize: '0.82rem' }}>
          {formatDate(item.decada)}
        </TableCell>
      );
    case 'propietario':
      return (
        <TableCell key="propietario" sx={{ padding: cellPad, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          <Tooltip title={item.propietario} placement="top-start">
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{item.propietario}</Typography>
          </Tooltip>
        </TableCell>
      );
    case 'vtaCodigo':
      return (
        <TableCell key="vtaCodigo" sx={{ padding: cellPad, maxWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.vtaCodigo}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.vtaNombre}</Typography>
        </TableCell>
      );
    case 'ceco':
      return (
        <TableCell key="ceco" sx={{ padding: cellPad, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          {item.ceco ? (
            <Tooltip title={item.ceco} placement="top-start">
              <Typography variant="caption" sx={{ fontWeight: 500 }} noWrap>{item.ceco}</Typography>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.secondary">—</Typography>
          )}
        </TableCell>
      );
    case 'tipovta':
      return (
        <TableCell key="tipovta" sx={{ padding: cellPad }}>
          {item.tipovta ? (
            <Chip size="small" label={item.tipovta}
              color={item.tipovta === 'CARGUE' ? 'primary' : 'default'} variant="outlined"
              sx={{ fontSize: '0.68rem', height: 20 }} />
          ) : null}
        </TableCell>
      );
    case 'cantidad':
      return (
        <TableCell key="cantidad" align="right" sx={{ padding: cellPad, fontWeight: 600, fontSize: '0.855rem' }}>
          {Number(item.cantidad).toFixed(2)}
        </TableCell>
      );
    case 'total':
      return (
        <TableCell key="total" align="right" sx={{ padding: cellPad, fontSize: '0.855rem' }}>
          {item.total != null ? formatCurrency(item.total) : <Typography variant="caption" color="text.secondary">—</Typography>}
        </TableCell>
      );
    case 'observaciones':
      return (
        <TableCell key="observaciones" sx={{ padding: cellPad, maxWidth: 0 }}>
          <Tooltip title={item.observaciones ?? ''} placement="top-start">
            <Typography variant="caption" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} noWrap>
              {item.observaciones ?? '—'}
            </Typography>
          </Tooltip>
        </TableCell>
      );
    case 'usuario':
      return (
        <TableCell key="usuario" sx={{ padding: cellPad, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          <Tooltip title={item.usuario ?? ''} placement="top-start">
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{item.usuario ?? '—'}</Typography>
          </Tooltip>
        </TableCell>
      );
    default:
      return null;
  }
}

// ─── Subcomponente: fila de datos memoizada ───────────────────────────────────
const MovimientoRow = memo(function MovimientoRow({ item, visibleCols, cellPad, rowH, onEdit, onHistory }) {
  const handleEdit = useCallback(() => onEdit(item), [onEdit, item]);
  const handleHistory = useCallback(() => onHistory(item), [onHistory, item]);

  return (
    <TableRow
      hover
      sx={{
        height: rowH,
        cursor: 'pointer',
        transition: 'background-color 0.12s',
        '&:hover': { backgroundColor: tokens.hoverRow },
      }}
    >
      {visibleCols.map((col) => {
        if (col.id === 'acciones') {
          return (
            <TableCell key="acciones" align="right" sx={{ padding: '4px 6px' }}>
              <Tooltip title="Editar">
                <IconButton size="small" color="primary" onClick={handleEdit}>
                  <EditOutlinedIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Historial">
                <IconButton size="small" color="default" onClick={handleHistory}>
                  <HistoryOutlinedIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
            </TableCell>
          );
        }
        return renderCell(col.id, item, cellPad);
      })}
    </TableRow>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────
function MovimientosTable({
  items,
  loading,
  page,
  rowsPerPage,
  total,
  order,
  orderBy,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  onEdit,
  onHistory,
  density = 'compact',
  visibleColumnIds,
}) {
  const [columnWidths, setColumnWidths] = useState(() => loadSavedWidths());
  const colWidthsRef = useRef(columnWidths);
  const resizeRef = useRef(null); // { colId, startX, startWidth }
  const tableRef = useRef(null);

  // Derive visible columns (memoized — stable during resize)
  const visibleCols = useMemo(
    () => visibleColumnIds
      ? COLUMNS.filter((c) => !c.toggleable || visibleColumnIds.includes(c.id))
      : COLUMNS,
    [visibleColumnIds]
  );

  // Row sizing by density
  const rowH    = density === 'comfortable' ? 52 : 42;
  const cellPad = density === 'comfortable' ? '10px 12px' : '6px 12px';

  // Skeleton row count (stable between renders)
  const skeletonCount = useMemo(() => Math.min(rowsPerPage, 10), [rowsPerPage]);

  // Pagination handlers (stable refs)
  const handlePageChange = useCallback((_event, nextPage) => onPageChange(nextPage), [onPageChange]);
  const handleRowsPerPageChange = useCallback((event) => onRowsPerPageChange(Number(event.target.value)), [onRowsPerPageChange]);

  // Mantener ref sincronizado para evitar stale closures en handleResizeStart
  useEffect(() => {
    colWidthsRef.current = columnWidths;
  }, [columnWidths]);

  // Callback estable — no depende de columnWidths gracias al ref
  const handleResizeStart = useCallback((e, colId) => {
    e.preventDefault();
    e.stopPropagation();
    const col = COLUMNS.find((c) => c.id === colId);
    const currentWidth = colWidthsRef.current[colId] ?? col?.defaultWidth ?? 100;
    resizeRef.current = { colId, startX: e.clientX, startWidth: currentWidth };
  }, []);

  // Doble clic en handle: auto-ajusta al contenido más ancho de la columna
  const handleResizeDblClick = useCallback((colId) => {
    if (!tableRef.current) return;
    const table = tableRef.current;
    const colIdx = visibleCols.findIndex((c) => c.id === colId);
    if (colIdx < 0) return;

    // Liberar el layout fijo para que el browser calcule anchos naturales
    // (operación síncrona — el browser no repinta entre pasos)
    table.style.tableLayout = 'auto';
    void table.offsetWidth; // forzar reflow

    let maxW = MIN_COL_WIDTH;
    table.querySelectorAll('thead tr, tbody tr').forEach((row) => {
      const cell = row.cells[colIdx];
      if (cell) maxW = Math.max(maxW, cell.offsetWidth);
    });

    table.style.tableLayout = ''; // restaurar (la clase CSS fixed vuelve a aplicar)

    const newWidth = maxW + 8;
    setColumnWidths((prev) => {
      const next = { ...prev, [colId]: newWidth };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, [visibleCols]);

  // Listeners globales de mouse (solo una vez)
  useEffect(() => {
    function onMouseMove(e) {
      if (!resizeRef.current) return;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const { colId, startX, startWidth } = resizeRef.current;
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + (e.clientX - startX));
      setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }));
    }

    function onMouseUp() {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem(LS_KEY, JSON.stringify(colWidthsRef.current)); } catch { /* noop */ }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <Paper
      elevation={1}
      sx={{
        overflow: 'hidden',
        border: `1px solid ${tokens.borderLight}`,
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ overflowX: 'auto', overflowY: 'auto', width: '100%', minWidth: 0, flex: 1, minHeight: 0 }}>
        <Table ref={tableRef} stickyHeader size="small" sx={{ width: '100%', minWidth: 780, tableLayout: 'fixed' }}>
          <ResizableHead
            columns={visibleCols}
            order={order}
            orderBy={orderBy}
            onSort={onSort}
            columnWidths={columnWidths}
            onResizeStart={handleResizeStart}
            onResizeDblClick={handleResizeDblClick}
          />
          <TableBody>
            {loading ? (
              // ── Skeleton rows ────────────────────────────────────────────
              Array.from({ length: skeletonCount }).map((_, idx) => (
                <TableRow key={idx} sx={{ height: rowH }}>
                  {visibleCols.map((col) => (
                    <TableCell key={col.id} sx={{ padding: cellPad }}>
                      <Skeleton
                        variant="text"
                        width={col.id === 'acciones' ? 52 : `${55 + (idx % 3) * 15}%`}
                        height={13}
                        sx={{ borderRadius: '4px' }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCols.length}>
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No hay movimientos para los filtros actuales.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <MovimientoRow
                  key={item.id}
                  item={item}
                  visibleCols={visibleCols}
                  cellPad={cellPad}
                  rowH={rowH}
                  onEdit={onEdit}
                  onHistory={onHistory}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        component="div"
        count={total}
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
    </Paper>
  );
}

export default memo(MovimientosTable);
