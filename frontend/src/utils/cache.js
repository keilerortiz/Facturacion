export function createTtlCache(ttlMs = Number(import.meta.env.VITE_CACHE_TTL_MS || 300000)) {
  const store = new Map();
  const getValidItem = (key) => {
    const item = store.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      store.delete(key);
      return null;
    }

    return item;
  };

  return {
    get(key) {
      return getValidItem(key)?.value ?? null;
    },
    has(key) {
      return Boolean(getValidItem(key));
    },
    set(key, value) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
      });
    },
    clear(key) {
      if (key) {
        store.delete(key);
        return;
      }

      store.clear();
    }
  };
}
