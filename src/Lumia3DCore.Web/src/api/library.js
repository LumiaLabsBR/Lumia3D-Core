// Library API — interface async esperada pelos componentes da UI.
//
// Hoje (Fase 10B): usa LUMIA_DATA como fonte, simulando latência via delay().
// Amanhã (Fase 10C): cada método será reescrito para chamar `client.js`
//   (IPC Photino → backend C# → SQLite real). A interface é estável, então a
//   troca não exige mudanças nos componentes.

import { LUMIA_DATA } from '../data.js';

const LATENCY = 120; // ms — simulated network round-trip

const delay = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms + Math.random() * 80));

// In-memory clone so mutations don't leak back to the seed data.
const db = {
  models: LUMIA_DATA.models.map((m) => ({ ...m, tags: [...m.tags] })),
  categories: LUMIA_DATA.categories,
  tags: LUMIA_DATA.tags,
};

export const api = {
  async listCategories() {
    await delay();
    return db.categories;
  },

  async listTags() {
    await delay();
    return db.tags;
  },

  async listModels({ catId = null, tags = [], query = '', sort = 'date' } = {}) {
    await delay();
    const allCatIds = (id) => {
      if (!id) return null;
      const cat = db.categories.find((c) => c.id === id);
      if (cat?.children) return new Set([id, ...cat.children.map((c) => c.id)]);
      return new Set([id]);
    };
    const catSet = allCatIds(catId);
    const tagSet = new Set(tags);
    let list = db.models.filter((m) => {
      if (catSet && !catSet.has(m.cat)) return false;
      if (tagSet.size > 0 && !m.tags.some((t) => tagSet.has(t))) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.tags.join(' ').toLowerCase().includes(q) &&
          !m.file.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    if (sort === 'date') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'size') list.sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  },

  async getModel(id) {
    await delay(60);
    return db.models.find((m) => m.id === id) || null;
  },

  async updateModel(id, patch) {
    await delay(80);
    const idx = db.models.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    db.models[idx] = { ...db.models[idx], ...patch };
    return db.models[idx];
  },

  async addTag(modelId, tag) {
    await delay(60);
    const m = db.models.find((x) => x.id === modelId);
    if (!m) return null;
    if (!m.tags.includes(tag)) m.tags.push(tag);
    return m;
  },

  async removeTag(modelId, tag) {
    await delay(60);
    const m = db.models.find((x) => x.id === modelId);
    if (!m) return null;
    m.tags = m.tags.filter((t) => t !== tag);
    return m;
  },

  async importFiles(files, onProgress) {
    // Simulated import pipeline: hash → metadata → thumbnail → index
    const stages = ['hash', 'metadata', 'thumbnail', 'index'];
    for (let i = 0; i <= 100; i += 4 + Math.random() * 6) {
      const stage = stages[Math.min(stages.length - 1, Math.floor((i / 100) * stages.length))];
      onProgress?.({ progress: Math.min(100, i), stage, count: files?.length ?? 1 });
      await delay(70);
    }
    onProgress?.({ progress: 100, stage: 'done', count: files?.length ?? 1 });
    return { imported: files?.length ?? 1, duplicates: 0 };
  },

  async stats() {
    await delay(40);
    const totalKB = db.models.reduce((s, m) => s + m.sizeKB, 0);
    return {
      count: db.models.length,
      sizeMB: totalKB / 1024,
      indexed: true,
    };
  },
};
