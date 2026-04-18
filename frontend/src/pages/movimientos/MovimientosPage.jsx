import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFilterState } from '../../hooks/filters/useFilterState';
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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import MovimientoForm from '../../components/movimientos/MovimientoForm';
import MovimientosFilters from '../../components/movimientos/MovimientosFilters';
import MovimientosTable, { COLUMNS as TABLE_COLUMNS } from '../../components/movimientos/MovimientosTable';
import HistorialDialog from '../../components/movimientos/HistorialDialog';
import { useOwnersQuery } from '../../hooks/queries/useOwnersQuery';
import { useVtasByOwnerQuery } from '../../hooks/queries/useVtasByOwnerQuery';
import { useTarifaQuery } from '../../hooks/queries/useTarifaQuery';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { usePaginationState } from '../../hooks/filters/usePaginationState';
import { movimientosService } from '../../services/movimientosService';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, getAllowedMovimientoDates, getTodayDate } from '../../utils/date';
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
  const queryClient = useQueryClient();

  // ── Filtros: draft (UI) vs applied (API) ────────────────────────────────
  // draft   = lo que el usuario está editando (no dispara query)
  // applied = lo que se envía al backend (cambia solo en eventos explícitos)
  //
  // Selects y fechas (propietarioId, vtaId, fechaDesde, fechaHasta):
  //   → applyField: escribe en draft y applied simultáneamente → query inmediata
  //
  // Inputs de texto (usuario, cantidadMin, cantidadMax, observaciones):
  //   → setDraftField: solo escribe en draft → query NO se dispara mientras escribe
  //   → La query se dispara cuando el botón "Aplicar" llama a applyPartial
  const {
    draft: filters,
    applied: appliedFilters,
    setDraftField,
    applyField,
    applyPartial,
    resetFilters: doResetFilters,
  } = useFilterState(initialFilters);

  // ── Estado local (solo UI) ────────────────────────────────────────────────
  const [form, setForm]                 = useState(initialForm);
  const [order, setOrder]               = useState('desc');
  const [orderBy, setOrderBy]           = useState('fecha');
  const [submitting, setSubmitting]     = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMovement, setHistoryMovement] = useState(null);
  const [editingMovement, setEditingMovement] = useState(null);
  const [formError, setFormError]       = useState('');
  const [toast, setToast]               = useState({ open: false, message: '', severity: 'success' });
  const [density, setDensity]           = useState('compact');
  const [visibleColumnIds, setVisibleColumnIds] = useState(null);
  const [colAnchor, setColAnchor]       = useState(null);

  const { page, rowsPerPage, setPage, handlePageChange, handleRowsPerPageChange } =
    usePaginationState(10);

  // Ref para acceder al estado más reciente desde callbacks no-reactivos
  const stateRef = useRef();
  stateRef.current = { form, editingMovement, formVtas: null };

  // ── Queries (React Query) ─────────────────────────────────────────────────
  const { data: owners = [] } = useOwnersQuery();

  const { data: filterVtas = [] } = useVtasByOwnerQuery(appliedFilters.propietarioId);

  const { data: formVtas = [] } = useVtasByOwnerQuery(form.propietarioId);
  stateRef.current.formVtas = formVtas;

  const { data: tarifa = null } = useTarifaQuery({
    propietarioId: form.propietarioId,
    vtaId: form.vtaId,
  });

  const {
    data: movimientosData,
    isFetching: loadingTable,
  } = useMovimientosListQuery({
    filters: appliedFilters,   // solo el estado confirmado (sin campos vacíos internamente)
    page,
    rowsPerPage,
    sortBy: orderBy,
    sortDir: order,
  });

  const items = movimientosData?.items ?? [];
  const total = movimientosData?.pagination?.total ?? 0;

  // ── Derived ───────────────────────────────────────────────────────────────
  // activeFilterCount refleja los applied (lo que realmente filtra el backend)
  const activeFilterCount  = Object.values(appliedFilters).filter(Boolean).length;
  const effectiveVisible   = useMemo(
    () => visibleColumnIds ?? toggleableCols.map((c) => c.id),
    [visibleColumnIds]
  );
  const pageCantidadTotal  = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0),
    [items]
  );

  // ── Invalidar lista (equivalente a loadMovimientos) ───────────────────────
  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['movimientos', 'list'] });
  }, [queryClient]);

  // ── Handlers de UI ────────────────────────────────────────────────────────
  const showToast  = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);
  const closeToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);

  // Campos que deben ejecutar la query de inmediato al cambiar
  // (selects con valor definido, fechas).
  // Los inputs de texto van al draft y se aplican solo desde el botón "Aplicar".
  const IMMEDIATE_FILTER_FIELDS = useMemo(
    () => new Set(['fechaDesde', 'fechaHasta', 'propietarioId', 'vtaId']),
    []
  );

  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    if (IMMEDIATE_FILTER_FIELDS.has(field)) {
      applyField(field, value);   // draft + applied → query se ejecuta ya
    } else {
      setDraftField(field, value); // solo draft → sin query todavía
    }
  }, [IMMEDIATE_FILTER_FIELDS, applyField, setDraftField, setPage]);

  const handleApplyFilters = useCallback((partial) => {
    setPage(0);
    applyPartial(partial);         // aplica filtros avanzados (botón "Aplicar")
  }, [applyPartial, setPage]);

  const handleFormChange = useCallback((field, value) => {
    setFormError('');
    setForm((current) => {
      if (field === 'fecha') {
        const currentMonthKey = current.decada?.slice(0, 7);
        const nextMonthKey    = value?.slice(0, 7);
        return { ...current, fecha: value, decada: currentMonthKey === nextMonthKey ? current.decada : value };
      }
      if (field === 'propietarioId') return { ...current, propietarioId: value, vtaId: '' };
      return { ...current, [field]: value };
    });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await movimientosService.exportExcel({ ...appliedFilters, sortBy: orderBy, sortDir: order });
      showToast('Archivo descargado correctamente');
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, 'No fue posible generar el archivo Excel'), 'error');
    } finally {
      setExporting(false);
    }
  }, [appliedFilters, orderBy, order, showToast]);

  const handleSort = useCallback((column) => {
    setOrder((prev) => (orderBy === column && prev === 'asc' ? 'desc' : 'asc'));
    setOrderBy(column);
    setPage(0);
  }, [orderBy, setPage]);

  const handleResetFilters  = useCallback(() => { doResetFilters(); setPage(0); }, [doResetFilters, setPage]);
  const handleRowsPerChange = useCallback((value) => handleRowsPerPageChange(value), [handleRowsPerPageChange]);

  const resetForm = useCallback(() => {
    setEditingMovement(null);
    setForm(initialForm);
    setFormError('');
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryMovement(null);
    setHistoryItems([]);
  }, []);

  const handleDensityChange  = useCallback((_, v) => { if (v) setDensity(v); }, []);
  const handleOpenColMenu    = useCallback((e) => setColAnchor(e.currentTarget), []);
  const handleCloseColMenu   = useCallback(() => setColAnchor(null), []);
  const handleToggleColumn   = useCallback((colId, checked) => {
    setVisibleColumnIds((prev) => {
      const current = prev ?? toggleableCols.map((c) => c.id);
      const next    = checked ? [...current, colId] : current.filter((id) => id !== colId);
      return next.length === toggleableCols.length ? null : next;
    });
  }, []);

  // ── Submit (crear / actualizar) ───────────────────────────────────────────
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const { form, editingMovement, formVtas } = stateRef.current;

    // Validaciones
    const allowedDates = new Set(getAllowedMovimientoDates());
    if (!allowedDates.has(form.fecha)) {
      setFormError('La fecha solo puede ser hoy, ayer o hace dos dias.');
      return;
    }
    if (!form.decada || form.decada.slice(0, 7) !== form.fecha.slice(0, 7)) {
      setFormError('La decada debe pertenecer al mismo mes y anio de la fecha.');
      return;
    }
    if (!form.propietarioId) { setFormError('Debes seleccionar un propietario.'); return; }
    if (!form.vtaId)         { setFormError('Debes seleccionar una VTA.');         return; }

    const selectedVta = formVtas.find((v) => String(v.id) === String(form.vtaId));
    if (selectedVta?.requiereTipo && !form.tipovta) {
      setFormError('Debes seleccionar el tipo de movimiento (CARGUE o DESCARGUE) para esta VTA.');
      return;
    }
    if (!form.cantidad || Number(form.cantidad) <= 0) {
      setFormError('La cantidad debe ser mayor a cero.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fecha:         form.fecha,
        decada:        form.decada,
        propietarioId: Number(form.propietarioId),
        vtaId:         Number(form.vtaId),
        cantidad:      Number(form.cantidad),
        tipovta:       form.tipovta || null,
        observaciones: form.observaciones?.trim() || null,
      };

      const response = editingMovement
        ? await movimientosService.update(editingMovement.id, { ...payload, version: editingMovement.version })
        : await movimientosService.create(payload);

      showToast(response.message || 'Movimiento guardado correctamente');

      // Invalida tarifas (pueden cambiar tras guardar) y la lista
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'tarifa'] });
      invalidateList();
      resetForm();
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        setFormError('Este movimiento fue modificado por otro usuario. Se recargarán los datos.');
        resetForm();
        invalidateList();
      } else {
        setFormError(getApiErrorMessage(requestError, 'No fue posible guardar el movimiento'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [showToast, resetForm, invalidateList, queryClient]);

  const handleEdit = useCallback((item) => {
    setFormError('');
    setEditingMovement(item);
    setForm({
      fecha:         item.fecha,
      decada:        item.decada,
      propietarioId: String(item.propietarioId),
      vtaId:         String(item.vtaId),
      cantidad:      String(item.cantidad),
      tipovta:       item.tipovta || '',
      observaciones: item.observaciones || '',
    });
  }, []);

  const handleOpenHistory = useCallback(async (item) => {
    setHistoryMovement(item);
    setHistoryItems([]);
    setLoadingHistory(true);
    try {
      const response = await movimientosService.history(item.id);
      setHistoryItems(response.items || []);
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, 'No fue posible cargar el historial'), 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100%', pt: 0.5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {editingMovement ? (
        <Chip label={`Editando #${editingMovement.id}`} size="small" color="secondary" variant="outlined" sx={{ mb: 1, alignSelf: 'flex-start' }} />
      ) : null}

      <Snackbar
        open={toast.open}
        autoHideDuration={toast.severity === 'error' ? 6000 : 3500}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ minWidth: 280, boxShadow: 4 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', gap: 2.5, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT — Form panel */}
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: '310px', lg: '330px', xl: '360px' }, display: 'flex', flexDirection: 'column' }}>
          <MovimientoForm
            values={form}
            owners={owners}
            vtas={formVtas}
            tarifa={tarifa}
            submitting={submitting}
            editing={Boolean(editingMovement)}
            error={formError}
            onChange={handleFormChange}
            onCancel={resetForm}
            onSubmit={handleSubmit}
          />
        </Box>

        {/* RIGHT — Filters + Toolbar + Table */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          <MovimientosFilters
            filters={filters}
            owners={owners}
            vtas={filterVtas}
            activeCount={activeFilterCount}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            onApplyFilters={handleApplyFilters}
          />

          {/* Toolbar */}
          <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: 'nowrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', flexShrink: 0 }}>
              {loadingTable ? 'Cargando...' : `${total} resultado${total !== 1 ? 's' : ''}`}
            </Typography>
            {!loadingTable && items.length > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                · &nbsp;{formatCurrency(pageCantidadTotal)} (pág.)
              </Typography>
            )}

            <Box sx={{ flex: 1 }} />

            <ToggleButtonGroup
              value={density}
              exclusive
              size="small"
              onChange={handleDensityChange}
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.72rem', height: 30, textTransform: 'none', borderColor: tokens.borderStrong } }}
            >
              <ToggleButton value="compact">
                <Tooltip title="Vista compacta"><ViewHeadlineIcon sx={{ fontSize: '16px' }} /></Tooltip>
              </ToggleButton>
              <ToggleButton value="comfortable">
                <Tooltip title="Vista cómoda"><TableRowsOutlinedIcon sx={{ fontSize: '16px' }} /></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Columnas visibles">
              <IconButton
                size="small"
                onClick={handleOpenColMenu}
                sx={{
                  border: `1px solid ${tokens.borderStrong}`, borderRadius: '6px', p: '5px',
                  color: colAnchor ? 'primary.main' : 'text.secondary',
                  bgcolor: colAnchor ? tokens.bgLight : 'transparent',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <ViewColumnOutlinedIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              disabled={exporting || loadingTable}
              startIcon={exporting
                ? <CircularProgress size={13} color="inherit" />
                : <FileDownloadOutlinedIcon sx={{ fontSize: '16px !important' }} />}
              sx={{ flexShrink: 0, fontSize: '0.8rem', textTransform: 'none', borderColor: tokens.borderStrong }}
            >
              {exporting ? 'Exportando...' : 'Excel'}
            </Button>
          </Stack>

          <Popover
            open={Boolean(colAnchor)}
            anchorEl={colAnchor}
            onClose={handleCloseColMenu}
            anchorOrigin={COL_POPOVER_ANCHOR}
            transformOrigin={COL_POPOVER_TRANSFORM}
            PaperProps={COL_POPOVER_PAPER}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}>
              Columnas visibles
            </Typography>
            {toggleableCols.map((col) => (
              <FormControlLabel
                key={col.id}
                label={<Typography sx={{ fontSize: '0.82rem' }}>{col.label}</Typography>}
                control={
                  <Checkbox
                    size="small"
                    checked={effectiveVisible.includes(col.id)}
                    onChange={(e) => handleToggleColumn(col.id, e.target.checked)}
                    sx={{ p: '4px' }}
                  />
                }
                sx={{ display: 'flex', m: 0, '&:hover': { bgcolor: tokens.bgSubtle, borderRadius: '6px' } }}
              />
            ))}
          </Popover>

          <MovimientosTable
            items={items}
            loading={loadingTable}
            page={page}
            rowsPerPage={rowsPerPage}
            total={total}
            order={order}
            orderBy={orderBy}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onHistory={handleOpenHistory}
            density={density}
            visibleColumnIds={visibleColumnIds}
          />
        </Box>
      </Box>

      <HistorialDialog
        open={historyMovement !== null}
        movement={historyMovement}
        items={historyItems}
        loading={loadingHistory}
        onClose={handleCloseHistory}
      />
    </Box>
  );
}

export default MovimientosPage;
