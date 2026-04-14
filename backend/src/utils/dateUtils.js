function isDateOnlyString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toUtcDateOnly(value) {
  if (!value || !isDateOnlyString(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnly(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' && isDateOnlyString(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function assertDateOnly(value) {
  const formatted = formatDateOnly(value);
  return formatted && isDateOnlyString(formatted) ? formatted : null;
}

export function isAllowedMovimientoDate(value, now = new Date()) {
  const normalized = assertDateOnly(value);

  if (!normalized) {
    return false;
  }

  const allowed = new Set();

  for (let days = 0; days <= 2; days += 1) {
    const reference = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    reference.setUTCDate(reference.getUTCDate() - days);
    allowed.add(reference.toISOString().slice(0, 10));
  }

  return allowed.has(normalized);
}

export function isSameMonthAndYear(fecha, decada) {
  const fechaDate = toUtcDateOnly(assertDateOnly(fecha));
  const decadaDate = toUtcDateOnly(assertDateOnly(decada));

  if (!fechaDate || !decadaDate) {
    return false;
  }

  return (
    fechaDate.getUTCFullYear() === decadaDate.getUTCFullYear() &&
    fechaDate.getUTCMonth() === decadaDate.getUTCMonth()
  );
}
