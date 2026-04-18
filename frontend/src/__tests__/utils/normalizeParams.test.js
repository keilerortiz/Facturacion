import { describe, it, expect } from 'vitest';
import { normalizeParams, canonicalParams } from '../../utils/normalizeParams';

describe('normalizeParams', () => {
  it('debería eliminar strings vacíos', () => {
    const input = { fechaDesde: '2026-04-17', usuario: '', observaciones: '' };
    const result = normalizeParams(input);
    expect(result).toEqual({ fechaDesde: '2026-04-17' });
  });

  it('debería eliminar null y undefined', () => {
    const input = { a: 'value', b: null, c: undefined, d: 0, e: false };
    const result = normalizeParams(input);
    expect(result).toEqual({ a: 'value', d: 0, e: false });
  });

  it('debería preservar valores falsy válidos (0, false)', () => {
    const input = { count: 0, active: false, name: '' };
    const result = normalizeParams(input);
    expect(result).toEqual({ count: 0, active: false });
  });

  it('debería retornar objeto vacío si todos son empty', () => {
    const input = { a: '', b: null, c: undefined };
    const result = normalizeParams(input);
    expect(result).toEqual({});
  });

  it('debería funcionar con objeto vacío', () => {
    const result = normalizeParams({});
    expect(result).toEqual({});
  });

  it('debería preservar valores especiales', () => {
    const input = {
      fecha: '2026-04-17',
      numero: 123,
      bool: true,
      array: [1, 2, 3], // objects se preservan
      obj: { nested: 'value' },
    };
    const result = normalizeParams(input);
    expect(result).toEqual(input);
  });
});

describe('canonicalParams', () => {
  it('debería ordenar claves alfabéticamente', () => {
    const input = { vtaId: '3', propietarioId: '1', fechaDesde: '2026-04-17' };
    const result = canonicalParams(input);
    expect(Object.keys(result)).toEqual(['fechaDesde', 'propietarioId', 'vtaId']);
  });

  it('debería normalizar y ordenar', () => {
    const input = { z: 'value', a: '', m: 'value2', b: null };
    const result = canonicalParams(input);
    expect(result).toEqual({ m: 'value2', z: 'value' });
  });

  it('debería producir hash idéntico para órdenes distintos', () => {
    const obj1 = { propietarioId: '1', vtaId: '3' };
    const obj2 = { vtaId: '3', propietarioId: '1' };

    const canonical1 = JSON.stringify(canonicalParams(obj1));
    const canonical2 = JSON.stringify(canonicalParams(obj2));

    expect(canonical1).toBe(canonical2);
  });

  it('debería funcionar como queryKey para React Query', () => {
    const filters1 = { propietarioId: '1', usuario: 'test', cantidadMin: '' };
    const filters2 = { usuario: 'test', propietarioId: '1', cantidadMin: '' };

    const queryKey1 = ['movimientos', canonicalParams(filters1)];
    const queryKey2 = ['movimientos', canonicalParams(filters2)];

    expect(JSON.stringify(queryKey1)).toBe(JSON.stringify(queryKey2));
  });
});

describe('canonicalParams - Casos extremos', () => {
  it('debería manejar números y strings mezclados', () => {
    const input = { id: 1, name: 'test', count: '5' };
    const result = canonicalParams(input);
    expect(result).toEqual({ count: '5', id: 1, name: 'test' });
  });

  it('debería preservar ceros y false', () => {
    const input = { count: 0, active: false, unused: '' };
    const result = canonicalParams(input);
    expect(result).toEqual({ active: false, count: 0 });
  });

  it('debería manejar muchas claves', () => {
    const input = {
      z: 'z', y: 'y', x: 'x', w: 'w', v: 'v',
      u: 'u', t: 't', s: 's', r: 'r', q: 'q',
    };
    const result = canonicalParams(input);
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort());
  });
});
