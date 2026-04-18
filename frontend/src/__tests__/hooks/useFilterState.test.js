import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '../../hooks/filters/useFilterState';

const initialFilters = {
  fechaDesde: '2026-04-17',
  fechaHasta: '2026-04-17',
  propietarioId: '',
  vtaId: '',
};

describe('useFilterState', () => {
  it('debería inicializar con filtros iniciales', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    expect(result.current.draft).toEqual(initialFilters);
    expect(result.current.applied).toEqual(initialFilters);
  });

  it('debería actualizar draft sin afectar applied', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.setDraftField('propietarioId', '1');
    });

    expect(result.current.draft.propietarioId).toBe('1');
    expect(result.current.applied.propietarioId).toBe('');
  });

  it('debería aplicar un campo individual', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.applyField('propietarioId', '2');
    });

    expect(result.current.draft.propietarioId).toBe('2');
    expect(result.current.applied.propietarioId).toBe('2');
  });

  it('debería resetear vtaId al cambiar propietarioId', () => {
    const filters = { ...initialFilters, propietarioId: '1', vtaId: '11' };
    const { result } = renderHook(() => useFilterState(filters));

    act(() => {
      result.current.setDraftField('propietarioId', '2');
    });

    expect(result.current.draft.propietarioId).toBe('2');
    expect(result.current.draft.vtaId).toBe('');
  });

  it('debería detectar cambios con isDirty', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setDraftField('usuario', 'test');
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('debería no ser dirty después de applyFilters', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.setDraftField('usuario', 'test');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.isDirty).toBe(false);
  });

  it('debería aplicar múltiples campos con applyPartial', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.applyPartial({
        fechaDesde: '2026-04-10',
        fechaHasta: '2026-04-20',
      });
    });

    expect(result.current.applied.fechaDesde).toBe('2026-04-10');
    expect(result.current.applied.fechaHasta).toBe('2026-04-20');
    expect(result.current.draft.fechaDesde).toBe('2026-04-10');
    expect(result.current.draft.fechaHasta).toBe('2026-04-20');
    expect(result.current.isDirty).toBe(false);
  });

  it('debería resetear a valores iniciales', () => {
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.applyField('propietarioId', '1');
      result.current.setDraftField('usuario', 'test');
    });

    expect(result.current.draft.propietarioId).toBe('1');
    expect(result.current.applied.propietarioId).toBe('1');

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.draft).toEqual(initialFilters);
    expect(result.current.applied).toEqual(initialFilters);
  });

  it('debería manejar applyField con reseteo de vtaId', () => {
    const filters = { ...initialFilters, propietarioId: '1', vtaId: '11' };
    const { result } = renderHook(() => useFilterState(filters));

    act(() => {
      result.current.applyField('propietarioId', '2');
    });

    expect(result.current.draft.propietarioId).toBe('2');
    expect(result.current.draft.vtaId).toBe('');
    expect(result.current.applied.propietarioId).toBe('2');
    expect(result.current.applied.vtaId).toBe('');
  });

  it('debería aplicar vtaId sin resetear si propietarioId no cambia', () => {
    const filters = { ...initialFilters, propietarioId: '1' };
    const { result } = renderHook(() => useFilterState(filters));

    act(() => {
      result.current.applyField('vtaId', '11');
    });

    expect(result.current.applied.vtaId).toBe('11');
    expect(result.current.applied.propietarioId).toBe('1');
  });
});

describe('useFilterState - Parámetros vacíos', () => {
  it('debería funcionar con undefined como inicial', () => {
    const { result } = renderHook(() => useFilterState());
    expect(result.current.draft).toEqual({});
    expect(result.current.applied).toEqual({});
  });

  it('debería aceptar objeto vacío', () => {
    const { result } = renderHook(() => useFilterState({}));
    expect(result.current.draft).toEqual({});
  });
});

describe('useFilterState - isDirty con normalización', () => {
  it('debería ignorar orden de claves en isDirty', () => {
    const { result } = renderHook(() =>
      useFilterState({ a: 'val', b: 'val2' })
    );

    act(() => {
      result.current.setDraftField('b', 'val2');
      result.current.setDraftField('a', 'val');
    });

    expect(result.current.isDirty).toBe(false);
  });

  it('debería ignorar parámetros vacíos en isDirty', () => {
    const { result } = renderHook(() =>
      useFilterState({ a: 'val', b: '' })
    );

    act(() => {
      result.current.setDraftField('b', 'new_value');
      result.current.setDraftField('b', ''); // Volver a vacío
    });

    expect(result.current.isDirty).toBe(false);
  });
});
