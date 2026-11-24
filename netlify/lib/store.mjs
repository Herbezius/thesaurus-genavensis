// Accès au stockage : Netlify Blobs en production, mémoire pour les tests locaux.
import { getStore } from "@netlify/blobs";

const mem = new Map();
const memStore = {
  async get(key) { return mem.has(key) ? JSON.parse(mem.get(key)) : null; },
  async setJSON(key, val) { mem.set(key, JSON.stringify(val)); },
  async delete(key) { mem.delete(key); },
  async list({ prefix = "" } = {}) {
    return { blobs: [...mem.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })) };
  },
};

export function store() {
  if (process.env.TG_MEMORY_STORE === "1") return memStore;
  const s = getStore({ name: "thesaurus", consistency: "strong" });
  return {
    get: key => s.get(key, { type: "json" }),
    setJSON: (key, val) => s.setJSON(key, val),
    delete: key => s.delete(key),
    list: opts => s.list(opts),
  };
}
