const isBrowser = typeof window !== "undefined";

function getStorage() {
  if (!isBrowser) return null;
  return window.localStorage;
}

export function getStoredValue(key) {
  const storage = getStorage();
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function setStoredValue(key, value) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(key, value);
}

export function removeStoredValue(key) {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(key);
}

export function getStoredJson(key) {
  const raw = getStoredValue(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    removeStoredValue(key);
    return null;
  }
}

export function setStoredJson(key, value) {
  setStoredValue(key, JSON.stringify(value));
}

export function clearStoredAuth(storageKeys) {
  Object.values(storageKeys).forEach(removeStoredValue);
}
