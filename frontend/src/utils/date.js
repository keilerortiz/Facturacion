function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return toDateInputValue(date);
}

export function getTodayDate() {
  return getDateDaysAgo(0);
}

export function getAllowedMovimientoDates() {
  return [getDateDaysAgo(2), getDateDaysAgo(1), getTodayDate()];
}

export function getMonthBounds(value) {
  const input = toDateInputValue(value) || getTodayDate();
  const [year, month] = input.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  return {
    min: toDateInputValue(firstDay),
    max: toDateInputValue(lastDay)
  };
}

export function formatDate(value) {
  if (!value) {
    return '-';
  }

  // Date-only string (YYYY-MM-DD): parse as local date to avoid any tz shift
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
      new Date(year, month - 1, day)
    );
  }

  // ISO string or Date object from DB (stored as UTC midnight): extract UTC parts
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  // Use UTC date components to prevent local timezone from shifting the day
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatCurrency(value, currency = 'COP') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}
