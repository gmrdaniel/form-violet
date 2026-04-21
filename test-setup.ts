// Minimal test setup — ensures localStorage works in jsdom for Vitest 4.

class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, value); }
}

if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", { value: new LocalStorageMock(), writable: true });
}
