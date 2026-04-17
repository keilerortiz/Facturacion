import { useCallback, useState } from 'react';

/**
 * Gestiona page + rowsPerPage con reset automático al cambiar rowsPerPage.
 */
export function usePaginationState(initialRowsPerPage = 10) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handlePageChange = useCallback((newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue);
    setPage(0);
  }, []);

  const resetPage = useCallback(() => setPage(0), []);

  return { page, rowsPerPage, setPage, handlePageChange, handleRowsPerPageChange, resetPage };
}
