import { memo, useCallback, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { tokens } from '../../styles/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtDateShort(str) {
  if (!str) return '';
  const [, mm, dd] = str.split('-');
  return `${dd} ${MONTHS_SHORT[Number(mm) - 1]}`;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function isoFirstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const QUICK_PRESETS = [
  { id: '7d',  label: '7 días',   get: () => ({ fechaDesde: isoOffset(-6),     fechaHasta: isoToday() }) },
  { id: 'mes', label: 'Este mes', get: () => ({ fechaDesde: isoFirstOfMonth(), fechaHasta: isoToday() }) },
];

// ─── Estilos compartidos ──────────────────────────────────────────────────────
const AUTOCOMPLETE_SX = {
  '& .MuiOutlinedInput-root': {
    py: '0px !important',
    fontSize: '0.82rem',
    '& .MuiAutocomplete-input': { py: '5px !important', px: '10px !important', fontSize: '0.82rem', minWidth: '60px !important' },
    '& fieldset': { borderColor: tokens.borderInput },
    '&:hover fieldset': { borderColor: tokens.hoverBorder },
  },
  '& .MuiAutocomplete-endAdornment': { right: '6px' },
};

const DATE_INPUT_STYLE = {
  border: 'none', outline: 'none', background: 'transparent',
  fontSize: '0.78rem', color: 'inherit', fontFamily: 'inherit',
  width: 96, cursor: 'pointer',
};

const isIdEqual = (a, b) => String(a.id) === String(b.id);

const POPOVER_ANCHOR = { vertical: 'bottom', horizontal: 'left' };
const POPOVER_TRANSFORM = { vertical: 'top', horizontal: 'left' };
const POPOVER_PAPER = { elevation: 3, sx: { p: 2, width: 260, mt: 0.5, borderRadius: '10px', border: `1px solid ${tokens.borderMedium}` } };

// ─── Componente ───────────────────────────────────────────────────────────────
function MovimientosFilters({ filters, owners, vtas, activeCount, onChange, onReset, onApplyFilters }) {
  const [moreAnchor, setMoreAnchor] = useState(null);
  const handleCloseMore = useCallback(() => setMoreAnchor(null), []);

  const secondaryCount = useMemo(
    () => [filters.usuario, filters.cantidadMin, filters.cantidadMax].filter(Boolean).length,
    [filters.usuario, filters.cantidadMin, filters.cantidadMax]
  );

  const activePreset = useMemo(
    () => QUICK_PRESETS.find((p) => {
      const { fechaDesde, fechaHasta } = p.get();
      return filters.fechaDesde === fechaDesde && filters.fechaHasta === fechaHasta;
    }),
    [filters.fechaDesde, filters.fechaHasta]
  );

  const chips = useMemo(() => {
    const result = [];
    if (filters.fechaDesde || filters.fechaHasta) {
      const d = filters.fechaDesde ? fmtDateShort(filters.fechaDesde) : '…';
      const h = filters.fechaHasta ? fmtDateShort(filters.fechaHasta) : '…';
      result.push({ id: 'dateRange', label: `${d} → ${h}`, clearKeys: ['fechaDesde', 'fechaHasta'] });
    }
    if (filters.propietarioId) {
      const o = owners.find((x) => String(x.id) === String(filters.propietarioId));
      result.push({ id: 'propietarioId', label: `Prop: ${o?.nombre ?? filters.propietarioId}`, clearKeys: ['propietarioId', 'vtaId'] });
    }
    if (filters.vtaId) {
      const v = vtas.find((x) => String(x.id) === String(filters.vtaId));
      result.push({ id: 'vtaId', label: `VTA: ${v?.codigo ?? filters.vtaId}`, clearKeys: ['vtaId'] });
    }
    if (filters.usuario)     result.push({ id: 'usuario',     label: `Usuario: ${filters.usuario}`,     clearKeys: ['usuario'] });
    if (filters.cantidadMin) result.push({ id: 'cantidadMin', label: `Min: ${filters.cantidadMin}`,     clearKeys: ['cantidadMin'] });
    if (filters.cantidadMax) result.push({ id: 'cantidadMax', label: `Max: ${filters.cantidadMax}`,     clearKeys: ['cantidadMax'] });
    return result;
  }, [filters, owners, vtas]);

  const handleChipDelete = useCallback((clearKeys) => {
    clearKeys.forEach((k) => onChange(k, ''));
  }, [onChange]);

  return (
    <Box>
      {/* ── Barra principal ────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" sx={{ gap: 0.5, flexWrap: 'nowrap', overflow: 'hidden' }}>

        {/* Quick presets */}
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          {QUICK_PRESETS.map((p) => {
            const active = activePreset?.id === p.id;
            return (
              <Chip
                key={p.id}
                label={p.label}
                size="small"
                onClick={() => onApplyFilters(p.get())}
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                sx={{
                  fontSize: '0.72rem', height: 26, borderRadius: '6px', cursor: 'pointer',
                  borderColor: active ? undefined : tokens.borderStrong,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              />
            );
          })}
        </Stack>

        {/* Separator */}
        <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', flexShrink: 0, mx: 0.25 }} />

        {/* Date range unified */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            border: `1px solid ${tokens.borderInput}`, borderRadius: '8px',
            bgcolor: 'background.paper', height: 34, px: 1.25, flexShrink: 0,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 2px ${tokens.focusRing}` },
          }}
        >
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => onChange('fechaDesde', e.target.value)}
            style={DATE_INPUT_STYLE}
          />
          <Typography component="span" sx={{ fontSize: '0.68rem', color: 'text.disabled', userSelect: 'none', flexShrink: 0 }}>→</Typography>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => onChange('fechaHasta', e.target.value)}
            style={DATE_INPUT_STYLE}
          />
        </Box>

        {/* Propietario */}
        <Autocomplete
          size="small"
          options={owners}
          getOptionLabel={(o) => o.nombre ?? ''}
          isOptionEqualToValue={isIdEqual}
          value={owners.find((o) => String(o.id) === String(filters.propietarioId)) ?? null}
          onChange={(_, newVal) => onChange('propietarioId', newVal ? newVal.id : '')}
          renderInput={(params) => (
            <TextField {...params} placeholder="Propietario" sx={{ '& .MuiInputBase-input::placeholder': { fontSize: '0.82rem' } }} />
          )}
          renderOption={(props, o) => (
            <MenuItem {...props} key={o.id} sx={{ fontSize: '0.82rem' }}>{o.nombre}</MenuItem>
          )}
          clearOnEscape
          blurOnSelect
          sx={{ width: 140, flexShrink: 1, ...AUTOCOMPLETE_SX }}
          slotProps={{ paper: { sx: { fontSize: '0.82rem' } } }}
        />

        {/* VTA */}
        <Autocomplete
          size="small"
          options={vtas}
          getOptionLabel={(v) => v.codigo ? `${v.codigo} — ${v.nombre}` : ''}
          isOptionEqualToValue={isIdEqual}
          value={vtas.find((v) => String(v.id) === String(filters.vtaId)) ?? null}
          onChange={(_, newVal) => onChange('vtaId', newVal ? newVal.id : '')}
          disabled={!filters.propietarioId}
          renderInput={(params) => (
            <TextField {...params} placeholder="VTA" sx={{ '& .MuiInputBase-input::placeholder': { fontSize: '0.82rem' } }} />
          )}
          renderOption={(props, v) => (
            <MenuItem {...props} key={v.id} sx={{ fontSize: '0.82rem' }}>{v.codigo} — {v.nombre}</MenuItem>
          )}
          clearOnEscape
          blurOnSelect
          sx={{ width: 110, flexShrink: 1, ...AUTOCOMPLETE_SX }}
          slotProps={{ paper: { sx: { fontSize: '0.82rem' } } }}
        />

        {/* Más filtros (secondary) */}
        <Button
          size="small"
          variant={secondaryCount > 0 ? 'contained' : 'outlined'}
          color={secondaryCount > 0 ? 'primary' : 'inherit'}
          startIcon={<TuneIcon sx={{ fontSize: '14px !important' }} />}
          onClick={(e) => setMoreAnchor(e.currentTarget)}
          sx={{
            fontSize: '0.78rem', fontWeight: 500, textTransform: 'none', flexShrink: 0,
            whiteSpace: 'nowrap', borderColor: tokens.borderInput,
            color: secondaryCount > 0 ? undefined : 'text.secondary', px: 1.25,
          }}
        >
          {secondaryCount > 0 ? `Más (${secondaryCount})` : 'Más'}
        </Button>

        {/* Restablecer */}
        {activeCount > 0 && (
          <Tooltip title="Restablecer filtros">
            <IconButton
              size="small"
              onClick={onReset}
              sx={{
                flexShrink: 0,
                color: 'text.secondary',
                '&:hover': { color: 'error.main', bgcolor: 'rgba(211,47,47,0.06)' },
              }}
            >
              <FilterAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* ── Popover "Más filtros" ─────────────────────────────────────────── */}
      <Popover
        open={Boolean(moreAnchor)}
        anchorEl={moreAnchor}
        onClose={handleCloseMore}
        anchorOrigin={POPOVER_ANCHOR}
        transformOrigin={POPOVER_TRANSFORM}
        PaperProps={POPOVER_PAPER}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
          Filtros adicionales
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField
            size="small" label="Usuario" value={filters.usuario}
            onChange={(e) => onChange('usuario', e.target.value)}
            fullWidth inputProps={{ style: { fontSize: '0.82rem' } }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              size="small" label="Cant. mín" type="number" value={filters.cantidadMin}
              onChange={(e) => onChange('cantidadMin', e.target.value)}
              inputProps={{ min: 0, step: '0.01', style: { fontSize: '0.82rem' } }} fullWidth
            />
            <TextField
              size="small" label="Cant. máx" type="number" value={filters.cantidadMax}
              onChange={(e) => onChange('cantidadMax', e.target.value)}
              inputProps={{ min: 0, step: '0.01', style: { fontSize: '0.82rem' } }} fullWidth
            />
          </Stack>
        </Stack>
      </Popover>

      {/* ── Chips activos ─────────────────────────────────────────────────── */}
      {chips.length > 0 && (
        <Stack direction="row" flexWrap="wrap" sx={{ mt: 0.75, gap: 0.75 }}>
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              size="small"
              onDelete={() => handleChipDelete(chip.clearKeys)}
              deleteIcon={<CloseIcon sx={{ fontSize: '11px !important' }} />}
              sx={{
                fontSize: '0.72rem', height: 24, borderRadius: '6px',
                bgcolor: tokens.bgChip, border: 'none',
                '& .MuiChip-deleteIcon': { color: 'text.secondary', ml: 0.25 },
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default memo(MovimientosFilters);

