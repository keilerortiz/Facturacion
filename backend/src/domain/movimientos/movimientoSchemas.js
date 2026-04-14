import { z } from 'zod';

const movementSortColumns = [
  'fecha',
  'decada',
  'propietario',
  'vtaCodigo',
  'cantidad',
  'usuario',
  'fechaCreacion'
];

export const movimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  decada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La decada debe tener formato YYYY-MM-DD'),
  propietarioId: z.coerce.number().int().positive(),
  vtaId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  tipovta: z.enum(['CARGUE', 'DESCARGUE']).optional().nullable(),
  observaciones: z.string().trim().max(4000).optional().nullable()
});

export const movimientoUpdateSchema = z
  .object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    decada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    propietarioId: z.coerce.number().int().positive().optional(),
    vtaId: z.coerce.number().int().positive().optional(),
    cantidad: z.coerce.number().positive().optional(),
    tipovta: z.enum(['CARGUE', 'DESCARGUE']).optional().nullable(),
    observaciones: z.string().trim().max(4000).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar'
  });

export const movimientoFiltersSchema = z
  .object({
    fechaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fechaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    propietarioId: z.coerce.number().int().positive().optional(),
    vtaId: z.coerce.number().int().positive().optional(),
    cantidad: z.coerce.number().positive().optional(),
    cantidadMin: z.coerce.number().nonnegative().optional(),
    cantidadMax: z.coerce.number().nonnegative().optional(),
    usuario: z.string().trim().optional(),
    observaciones: z.string().trim().optional(),
    sortBy: z.enum(movementSortColumns).default('fecha'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0)
  })
  .refine(
    (value) => !(value.fechaDesde && value.fechaHasta) || value.fechaDesde <= value.fechaHasta,
    {
      path: ['fechaHasta'],
      message: 'La fecha final no puede ser anterior a la fecha inicial'
    }
  )
  .refine(
    (value) =>
      value.cantidad === undefined ||
      value.cantidadMin === undefined ||
      value.cantidadMax === undefined ||
      value.cantidadMin <= value.cantidadMax,
    {
      path: ['cantidadMax'],
      message: 'La cantidad maxima no puede ser menor que la minima'
    }
  );

export const propietarioQuerySchema = z.object({
  propietarioId: z.coerce.number().int().positive()
});

export const tarifaQuerySchema = z.object({
  propietarioId: z.coerce.number().int().positive(),
  vtaId: z.coerce.number().int().positive()
});
