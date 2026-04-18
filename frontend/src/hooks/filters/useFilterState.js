import { useCallback, useMemo, useState } from 'react';
import { canonicalParams } from '../../utils/normalizeParams';

/**
 * Gestiona el ciclo de vida completo de los filtros de búsqueda.
 *
 * Patrón: draft → apply → fetch
 * ─────────────────────────────────────────────────────────────────────
 *  draftFilters   = estado de la UI (lo que el usuario está editando)
 *  appliedFilters = estado enviado a la API (solo cambia al aplicar)
 *
 * Por qué importa la separación:
 *  Sin separación: cada keystroke en "usuario" dispara una nueva query
 *  (incluso con debounce en React Query, cada render cambia el objeto
 *  filters y genera un nuevo queryKey).
 *
 *  Con separación: el usuario escribe libremente en draftFilters.
 *  La query solo se ejecuta cuando se llama a applyFilters() —ya sea
 *  por botón explícito o por un debounce sobre la llamada a apply.
 *
 * Dos estrategias de uso:
 *
 * A) BOTÓN EXPLÍCITO (recomendado para filtros con muchos campos):
 *    → El usuario edita draftFilters libremente
 *    → Presiona "Aplicar" → llama a applyFilters()
 *    → La query se ejecuta una sola vez
 *
 * B) CAMPOS MIXTOS (comportamiento actual mejorado):
 *    → Selects (propietarioId, vtaId): aplican inmediatamente con applyField()
 *    → Inputs de texto: se debouncea la llamada a applyFilters() externamente
 *
 * Ejemplo de uso con botón:
 *   const { draft, applied, setDraftField, applyFilters, resetFilters } =
 *     useFilterState(initialFilters);
 *
 *   // UI edita draft, query usa applied
 *   useMovimientosListQuery({ filters: applied });
 */
export function useFilterState(initialFilters = {}) {
  const [draftFilters,   setDraftFilters]   = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // Editar un campo del draft sin afectar la query
  const setDraftField = useCallback((field, value) => {
    setDraftFilters((prev) => {
      // Reset de vtaId al cambiar propietario
      if (field === 'propietarioId') {
        return { ...prev, propietarioId: value, vtaId: '' };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  // Aplicar el draft completo → dispara la query
  const applyFilters = useCallback(() => {
    setAppliedFilters((prev) => ({ ...prev, ...draftFilters }));
  }, [draftFilters]);

  // Aplicar un campo específico inmediatamente (para selects y fechas)
  const applyField = useCallback((field, value) => {
    setDraftFilters((prev) => {
      const next = field === 'propietarioId'
        ? { ...prev, propietarioId: value, vtaId: '' }
        : { ...prev, [field]: value };
      // Aplicar también en applied para que la query se ejecute ya
      setAppliedFilters(next);
      return next;
    });
  }, []);

  // Aplicar cambios parciales (para atajos como "fechas de hoy")
  const applyPartial = useCallback((partial) => {
    setDraftFilters((prev) => {
      const next = { ...prev, ...partial };
      setAppliedFilters(next);
      return next;
    });
  }, []);

  // Resetear ambos estados
  const resetFilters = useCallback(() => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  // Saber si el draft difiere del applied (para habilitar botón "Aplicar")
  const isDirty = useMemo(() => {
    const normalDraft   = canonicalParams(draftFilters);
    const normalApplied = canonicalParams(appliedFilters);
    return JSON.stringify(normalDraft) !== JSON.stringify(normalApplied);
  }, [draftFilters, appliedFilters]);

  return {
    draft:         draftFilters,
    applied:       appliedFilters,
    setDraftField,
    applyFilters,
    applyField,
    applyPartial,
    resetFilters,
    isDirty,
  };
}
