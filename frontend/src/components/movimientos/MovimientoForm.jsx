import { memo } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { formatCurrency, getAllowedMovimientoDates, getMonthBounds } from '../../utils/date';
import { tokens } from '../../styles/theme';

const isIdEqual = (a, b) => String(a.id) === String(b.id);

function MovimientoForm({
  values,
  owners,
  vtas,
  tarifa,
  submitting,
  editing,
  error,
  onChange,
  onCancel,
  onSubmit
}) {
  const allowedDates = getAllowedMovimientoDates();
  const monthBounds = getMonthBounds(values.fecha);

  const selectedVta = vtas.find((v) => String(v.id) === String(values.vtaId));
  const udmvta = selectedVta?.udmvta ?? null;
  const requiereTipo = selectedVta?.requiereTipo ?? false;
  const total =
    tarifa && values.cantidad && Number(values.cantidad) > 0
      ? Number(values.cantidad) * tarifa.valor
      : null;

  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        border: `1px solid ${tokens.borderLight}`
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.25,
          pb: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          flexShrink: 0
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {editing ? 'Editar movimiento' : 'Registrar movimiento'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          {editing
            ? 'Modifica los campos necesarios y guarda los cambios.'
            : 'Completa el flujo: fecha → propietario → VTA → cantidad.'}
        </Typography>
      </Box>

      {/* Scrollable body + sticky footer */}
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Scrollable fields */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Fecha"
                type="date"
                value={values.fecha}
                onChange={(event) => onChange('fecha', event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText={`Permitidas: ${allowedDates.join(', ')}`}
                inputProps={{
                  min: allowedDates[0],
                  max: allowedDates[allowedDates.length - 1]
                }}
              />
              <TextField
                size="small"
                label="Decada"
                type="date"
                value={values.decada}
                onChange={(event) => onChange('decada', event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Debe pertenecer al mismo mes y anio de la fecha"
                inputProps={{
                  min: monthBounds.min,
                  max: monthBounds.max
                }}
              />
            </Stack>
            <Autocomplete
              size="small"
              options={owners}
              getOptionLabel={(o) => o.nombre ?? ''}
              isOptionEqualToValue={isIdEqual}
              value={owners.find((o) => String(o.id) === String(values.propietarioId)) ?? null}
              onChange={(_, newVal) => onChange('propietarioId', newVal ? newVal.id : '')}
              clearOnEscape
              blurOnSelect
              renderInput={(params) => (
                <TextField {...params} label="Propietario" />
              )}
            />
            <Autocomplete
              size="small"
              options={vtas}
              getOptionLabel={(v) => v.codigo ? `${v.codigo} — ${v.nombre}` : ''}
              isOptionEqualToValue={isIdEqual}
              value={vtas.find((v) => String(v.id) === String(values.vtaId)) ?? null}
              onChange={(_, newVal) => onChange('vtaId', newVal ? newVal.id : '')}
              disabled={!values.propietarioId}
              clearOnEscape
              blurOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="VTA"
                  helperText={
                    values.propietarioId
                      ? 'Se limpia automaticamente si cambias el propietario'
                      : 'Selecciona primero un propietario'
                  }
                />
              )}
            />
            {requiereTipo && (
              <TextField
                size="small"
                select
                SelectProps={{ native: true }}
                label="Tipo de movimiento"
                value={values.tipovta || ''}
                onChange={(event) => onChange('tipovta', event.target.value)}
                fullWidth
                required
                helperText="Requerido: CARGUE o DESCARGUE para esta VTA"
              >
                <option value="">Selecciona un tipo</option>
                <option value="CARGUE">CARGUE</option>
                <option value="DESCARGUE">DESCARGUE</option>
              </TextField>
            )}
            <TextField
              size="small"
              label="Cantidad"
              type="number"
              value={values.cantidad}
              onChange={(event) => onChange('cantidad', event.target.value)}
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />

            {/* Tarifa + UDM + Total en una fila de información */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
                p: 1.75,
                bgcolor: tokens.bgSubtle,
                border: `1px solid ${tokens.borderLight}`,
                borderRadius: '8px'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Tarifa vigente
                </Typography>
                <Chip
                  size="small"
                  color={tarifa ? 'success' : 'warning'}
                  variant={tarifa ? 'filled' : 'outlined'}
                  label={
                    tarifa
                      ? `${formatCurrency(tarifa.valor, tarifa.moneda)} ${tarifa.moneda}`
                      : 'Sin tarifa'
                  }
                  sx={{ fontSize: '0.73rem' }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  UDM
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: udmvta ? 'text.primary' : 'text.disabled' }}>
                  {udmvta ?? '—'}
                </Typography>
              </Box>
              {total !== null && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.25 }}>
                    Total calculado
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(total, tarifa?.moneda)} {tarifa?.moneda ?? ''}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {Number(values.cantidad).toFixed(2)} × {formatCurrency(tarifa.valor, tarifa.moneda)}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              size="small"
              label="Observaciones"
              value={values.observaciones}
              onChange={(event) => onChange('observaciones', event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </Box>

        {/* Sticky action footer */}
        <Box
          sx={{
            flexShrink: 0,
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderTopColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            fullWidth
            sx={{ fontWeight: 600 }}
          >
            {submitting
              ? editing
                ? 'Guardando cambios...'
                : 'Creando movimiento...'
              : editing
                ? 'Actualizar movimiento'
                : 'Registrar movimiento'}
          </Button>
          {editing ? (
            <Button variant="outlined" onClick={onCancel} fullWidth color="secondary">
              Cancelar edicion
            </Button>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}

export default memo(MovimientoForm);
