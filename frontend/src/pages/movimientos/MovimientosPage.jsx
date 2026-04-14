import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { movimientosService } from '../../services/movimientosService';
import { createTtlCache } from '../../utils/cache';
import { deduplicatedFetch } from '../../utils/requestDeduplicator';
import { movimientosStore } from '../../utils/movimientosStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, getAllowedMovimientoDates, getTodayDate } from '../../utils/date';
import { tokens } from '../../styles/theme';

const ownersCache = createTtlCache();
const vtasCache = createTtlCache();
const tarifasCache = createTtlCache();

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
  const [owners, setOwners] = useState([]);
  const [formVtas, setFormVtas] = useState([]);
  const [filterVtas, setFilterVtas] = useState([]);
  const [tarifa, setTarifa] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters, 450);
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loadingTable, setLoadingTable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyMovement, setHistoryMovement] = useState(null);
  const [editingMovement, setEditingMovement] = useState(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);
  const closeToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const formDataRef = useRef();
  const loadMovimientosAbortRef = useRef(null);
  // Previene que loadMovimientos corra en el primer mount (ya cubierto por /init)
  const initDoneRef = useRef(false);

  // ── Grid state ────────────────────────────────────────────────────────────
  const [density, setDensity] = useState('compact');
  const [visibleColumnIds, setVisibleColumnIds] = useState(null); // null = todas
  const [colAnchor, setColAnchor] = useState(null);

  const effectiveVisible = useMemo(
    () => visibleColumnIds ?? toggleableCols.map((c) => c.id),
    [visibleColumnIds]
  );

  const handleDensityChange = useCallback((_, v) => { if (v) setDensity(v); }, []);
  const handleOpenColMenu = useCallback((e) => setColAnchor(e.currentTarget), []);
  const handleCloseColMenu = useCallback(() => setColAnchor(null), []);
  const handleToggleColumn = useCallback((colId, checked) => {
    setVisibleColumnIds((prev) => {
      const current = prev ?? toggleableCols.map((c) => c.id);
      const next = checked
        ? [...current, colId]
        : current.filter((id) => id !== colId);
      return next.length === toggleableCols.length ? null : next;
    });
  }, []);

  const loadOwners = async () => {
    const cachedOwners = ownersCache.get('owners');

    if (cachedOwners) {
      setOwners(cachedOwners);
      return;
    }

    const response = await deduplicatedFetch('owners', () => movimientosService.listOwners());
    ownersCache.set('owners', response.items || []);
    setOwners(response.items || []);
  };

  const loadVtas = async (propietarioId, target) => {
    if (!propietarioId) {
      if (target === 'form') {
        setFormVtas([]);
      } else {
        setFilterVtas([]);
      }
      return;
    }

    const cacheKey = `owner-${propietarioId}`;
    const cached = vtasCache.get(cacheKey);
    const assign = target === 'form' ? setFormVtas : setFilterVtas;

    if (cached) {
      assign(cached);
      return;
    }

    const response = await deduplicatedFetch(
      `vtas:${propietarioId}`,
      () => movimientosService.listVtasByOwner(propietarioId)
    );
    vtasCache.set(cacheKey, response.items || []);
    assign(response.items || []);
  };

  const loadTarifa = async (propietarioId, vtaId) => {
    if (!propietarioId || !vtaId) {
      setTarifa(null);
      return;
    }

    const cacheKey = `${propietarioId}:${vtaId}`;
    if (tarifasCache.has(cacheKey)) {
      setTarifa(tarifasCache.get(cacheKey));
      return;
    }

    const response = await deduplicatedFetch(
      `tarifa:${propietarioId}:${vtaId}`,
      () => movimientosService.getRate(propietarioId, vtaId)
    );
    tarifasCache.set(cacheKey, response.tarifa);
    setTarifa(response.tarifa);
  };

  const loadMovimientos = useCallback(async () => {
    // Cancelar request anterior si sigue en vuelo
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
        showToast(getApiErrorMessage(requestError, 'No fue posible cargar movimientos'), 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingTable(false);
      }
    }
  }, [debouncedFilters, order, orderBy, page, rowsPerPage]);

  formDataRef.current = { form, editingMovement, formVtas, loadMovimientos };

  useEffect(() => {
    // deduplicatedFetch garantiza 1 sola llamada a /init aunque StrictMode duplique el efecto.
    // La clave se limpia automáticamente tras resolver → re-navegación obtiene datos frescos.
    deduplicatedFetch('movimientos:page:init', () =>
      movimientosService.init({
        ...initialFilters,
        sortBy: 'fecha',
        sortDir: 'desc',
        limit: 10,
        offset: 0
      })
    ).then((initData) => {
      const ownersList = initData.propietarios || [];
      ownersCache.set('owners', ownersList);
      setOwners(ownersList);
      setItems(initData.movimientos?.items || []);
      setTotal(initData.movimientos?.pagination?.total || 0);
      setLoadingTable(false);
      initDoneRef.current = true;
      // Publicar al store compartido para que DashboardPage no necesite sus propias llamadas
      movimientosStore.set(initData.movimientos);
    }).catch((requestError) => {
      showToast(getApiErrorMessage(requestError, 'No fue posible cargar los datos iniciales'), 'error');
      setLoadingTable(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Salta la ejecución del mount: el /init ya cargó la primera página
    if (!initDoneRef.current) return;
    loadMovimientos();
  }, [loadMovimientos]);

  useEffect(() => {
    loadVtas(filters.propietarioId, 'filter').catch((requestError) => {
      showToast(getApiErrorMessage(requestError, 'No fue posible cargar VTAs de filtro'), 'error');
    });
  }, [filters.propietarioId]);

  useEffect(() => {
    loadVtas(form.propietarioId, 'form').catch((requestError) => {
      setFormError(getApiErrorMessage(requestError, 'No fue posible cargar VTAs'));
    });
  }, [form.propietarioId]);

  useEffect(() => {
    loadTarifa(form.propietarioId, form.vtaId).catch((requestError) => {
      setFormError(getApiErrorMessage(requestError, 'No fue posible consultar la tarifa'));
    });
  }, [form.propietarioId, form.vtaId]);

  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters((current) => {
      if (field === 'propietarioId') {
        return {
          ...current,
          propietarioId: value,
          vtaId: ''
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  }, []);

  const handleApplyFilters = useCallback((partial) => {
    setPage(0);
    setFilters((current) => ({ ...current, ...partial }));
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setFormError('');
    setForm((current) => {
      if (field === 'fecha') {
        const nextDate = value;
        const currentMonthKey = current.decada?.slice(0, 7);
        const nextMonthKey = nextDate?.slice(0, 7);

        return {
          ...current,
          fecha: nextDate,
          decada: currentMonthKey === nextMonthKey ? current.decada : nextDate
        };
      }

      if (field === 'propietarioId') {
        return {
          ...current,
          propietarioId: value,
          vtaId: ''
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await movimientosService.exportExcel({
        ...debouncedFilters,
        sortBy: orderBy,
        sortDir: order
      });
      showToast('Archivo descargado correctamente');
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, 'No fue posible generar el archivo Excel'), 'error');
    } finally {
      setExporting(false);
    }
  }, [debouncedFilters, orderBy, order, showToast]);

  const handleSort = useCallback((column) => {
    setOrder((prevOrder) => {
      const isAsc = orderBy === column && prevOrder === 'asc';
      return isAsc ? 'desc' : 'asc';
    });
    setOrderBy(column);
    setPage(0);
  }, [orderBy]);

  const handleResetFilters = useCallback(() => { setFilters(initialFilters); setPage(0); }, []);

  const resetForm = useCallback(() => {
    setEditingMovement(null);
    setTarifa(null);
    setForm(initialForm);
    setFormError('');
  }, []);

  const handleRowsPerPageChange = useCallback((value) => { setRowsPerPage(value); setPage(0); }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryMovement(null);
    setHistoryItems([]);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const { form, editingMovement, formVtas, loadMovimientos } = formDataRef.current;

    const allowedDates = new Set(getAllowedMovimientoDates());
    if (!allowedDates.has(form.fecha)) {
      setFormError('La fecha solo puede ser hoy, ayer o hace dos dias.');
      return;
    }
    if (!form.decada || form.decada.slice(0, 7) !== form.fecha.slice(0, 7)) {
      setFormError('La decada debe pertenecer al mismo mes y anio de la fecha.');
      return;
    }
    if (!form.propietarioId) {
      setFormError('Debes seleccionar un propietario.');
      return;
    }
    if (!form.vtaId) {
      setFormError('Debes seleccionar una VTA.');
      return;
    }
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
        fecha: form.fecha,
        decada: form.decada,
        propietarioId: Number(form.propietarioId),
        vtaId: Number(form.vtaId),
        cantidad: Number(form.cantidad),
        tipovta: form.tipovta || null,
        observaciones: form.observaciones?.trim() || null
      };

      const response = editingMovement
        ? await movimientosService.update(editingMovement.id, {
            ...payload,
            version: editingMovement.version
          })
        : await movimientosService.create(payload);

      showToast(response.message || 'Movimiento guardado correctamente');
      // Invalidar caché de tarifas: pueden cambiar tras save (nuevo propietario/VTA)
      tarifasCache.clear();
      resetForm();
      await loadMovimientos();
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        setFormError('Este movimiento fue modificado por otro usuario. Se recargarán los datos.');
        resetForm();
        await loadMovimientos();
      } else {
        setFormError(getApiErrorMessage(requestError, 'No fue posible guardar el movimiento'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [showToast, resetForm]);

  const handleEdit = useCallback((item) => {
    setFormError('');
    // Usa los datos del row de la tabla — ya incluyen 'version' para optimistic locking
    setEditingMovement(item);
    setForm({
      fecha: item.fecha,
      decada: item.decada,
      propietarioId: String(item.propietarioId),
      vtaId: String(item.vtaId),
      cantidad: String(item.cantidad),
      tipovta: item.tipovta || '',
      observaciones: item.observaciones || ''
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

  const pageCantidadTotal = useMemo(() => items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0), [items]);

  return (
    <Box sx={{ height: '100%', pt: 0.5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {editingMovement ? (
        <Chip label={`Editando #${editingMovement.id}`} size="small" color="secondary" variant="outlined" sx={{ mb: 1, alignSelf: 'flex-start' }} />
      ) : null}

      {/* Snackbar toast */}
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

      {/* Two-column layout */}
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

        {/* RIGHT — Filters + Toolbar + Bulk bar + Table */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Filter bar */}
          <MovimientosFilters
            filters={filters}
            owners={owners}
            vtas={filterVtas}
            activeCount={activeFilterCount}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            onApplyFilters={handleApplyFilters}
          />

          {/* Toolbar: summary | density | columns | export */}
          <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: 'nowrap' }}>
            {/* Summary */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', flexShrink: 0 }}>
              {loadingTable ? 'Cargando...' : `${total} resultado${total !== 1 ? 's' : ''}`}
            </Typography>
            {!loadingTable && items.length > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                · &nbsp;{formatCurrency(pageCantidadTotal)} (pág.)
              </Typography>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Density toggle */}
            <ToggleButtonGroup
              value={density}
              exclusive
              size="small"
              onChange={handleDensityChange}
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.72rem', height: 30, textTransform: 'none', borderColor: tokens.borderStrong } }}
            >
              <ToggleButton value="compact">
                <Tooltip title="Vista compacta">
                  <ViewHeadlineIcon sx={{ fontSize: '16px' }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="comfortable">
                <Tooltip title="Vista cómoda">
                  <TableRowsOutlinedIcon sx={{ fontSize: '16px' }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Column selector */}
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

            {/* Export */}
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

          {/* Column selector popover */}
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

          {/* Table */}
          <MovimientosTable
            items={items}
            loading={loadingTable}
            page={page}
            rowsPerPage={rowsPerPage}
            total={total}
            order={order}
            orderBy={orderBy}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPageChange}
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
