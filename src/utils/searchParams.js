export function buildSearchParams(currentParams, updates) {
  const next = new URLSearchParams(currentParams);

  Object.entries(updates).forEach(([key, value]) => {
    const normalized = typeof value === 'string' ? value.trim() : value;

    if (
      normalized == null
      || normalized === ''
      || normalized === 'all'
      || normalized === false
    ) {
      next.delete(key);
      return;
    }

    if (normalized === true) {
      next.set(key, '1');
      return;
    }

    next.set(key, String(normalized));
  });

  return next;
}

export function readBooleanSearchParam(searchParams, key) {
  return searchParams.get(key) === '1';
}

export function readSearchParam(searchParams, key, fallback = 'all') {
  return searchParams.get(key) || fallback;
}
