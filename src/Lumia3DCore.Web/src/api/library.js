// Library API — interface async esperada pelos componentes da UI.
//
// Detecta IS_PHOTINO em runtime:
//   - Photino  → chama IPC real (client.js → backend C# → SQLite)
//   - dev/web  → usa LUMIA_DATA mock com delay() simulando latência
//
// Componentes consomem essa interface estável independente do modo.

import { LUMIA_DATA } from '../data.js';
import { api as ipc } from './client.js';

const IS_PHOTINO = typeof window !== 'undefined' && typeof window.external?.sendMessage === 'function';

const LATENCY = 120;
const delay = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms + Math.random() * 80));

// ── Adapters: backend Object3D → modelo da UI ──────────────────────────────
//
// Backend retorna (camelCase via JsonNamingPolicy):
//   { id, name, description, mainFilePath, fileType, thumbnailPath, hash, categoryId, createdAt }
// UI espera (compatível com LUMIA_DATA mock):
//   { id, name, file, format, url, shape, cat, tags, sizeKB, polys, dims, date, hash, attachments, dup, thumbnailUrl }

function fileToUrl(absolutePath) {
  if (!absolutePath) return null;
  // Photino WebView2 entende file:/// para arquivos locais
  return 'file:///' + absolutePath.replace(/\\/g, '/');
}

function adaptObject(o) {
  const ext = (o.fileType || '').replace('.', '').toLowerCase();
  const fileName = (o.mainFilePath || '').split(/[\\/]/).pop() || '';
  return {
    id:           o.id,
    name:         o.name || fileName,
    description:  o.description || '',
    file:         fileName,
    format:       ext || 'stl',
    url:          fileToUrl(o.mainFilePath),
    thumbnailUrl: fileToUrl(o.thumbnailPath),
    hash:         o.hash || '',
    cat:          o.categoryId || null,
    date:         (o.createdAt || '').slice(0, 10),
    // Campos que o backend ainda não computa — defaults seguros (TODO Fase 11):
    shape:        'cube',
    tags:         [],
    sizeKB:       0,
    polys:        0,
    dims:         '—',
    attachments:  0,
    dup:          null,
  };
}

function adaptCategory(c) {
  return {
    id:       c.id,
    name:     c.name,
    count:    c.count ?? 0,
    children: c.children?.map(adaptCategory),
  };
}

function adaptTag(t) {
  return {
    id:    t.id,
    name:  t.name,
    color: t.color || '#9097A0',
    count: t.count ?? 0,
  };
}

// ── Modo Photino (IPC real) ────────────────────────────────────────────────

const photinoApi = {
  async listCategories() {
    const cats = await ipc.getCategories();
    return (cats || []).map(adaptCategory);
  },

  async listTags() {
    const tags = await ipc.getTags();
    return (tags || []).map(adaptTag);
  },

  async listModels({ catId = null, tags = [], query = '', sort = 'date' } = {}) {
    // Filtro server-side: categoryId + tagId (apenas o primeiro tag por agora)
    // TODO: backend precisa suportar múltiplas tags simultâneas (Fase 11).
    const tagId = tags.length > 0 ? tags[0] : null;
    const objs = query
      ? await ipc.searchObjects(query, catId, tagId)
      : await ipc.getObjects(catId, tagId);

    let list = (objs || []).map(adaptObject);

    // Sort no frontend (o backend já retorna em ordem de relevância para FTS)
    if (sort === 'date') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'size') list.sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  },

  async getModel(id) {
    const objs = await ipc.getObjects();
    const found = (objs || []).find((m) => m.id === id);
    return found ? adaptObject(found) : null;
  },

  async updateModel(id, patch) {
    await ipc.updateObject(id, patch.name, patch.description ?? '', patch.cat ?? null);
    return { id, ...patch };
  },

  async addTag(modelId, tagId) {
    await ipc.addTagToObject(modelId, tagId);
    return null;
  },

  async removeTag(modelId, tagId) {
    await ipc.removeTagFromObject(modelId, tagId);
    return null;
  },

  async importFiles(files, onProgress) {
    // Photino: importa cada arquivo via IPC. Para drag-and-drop nativo, o file path
    // precisa ser absoluto (File.path no Photino traz o caminho real, ao contrário
    // do navegador que esconde por segurança).
    const total = files?.length || 0;
    let done = 0;
    for (const f of files || []) {
      const path = f.path || f.name;
      onProgress?.({ progress: (done / total) * 100, stage: 'hash', count: total });
      try { await ipc.importFile(path, null); }
      catch (e) { console.warn('[Lumia3D] importFile falhou', path, e); }
      done++;
      onProgress?.({ progress: (done / total) * 100, stage: 'index', count: total });
    }
    onProgress?.({ progress: 100, stage: 'done', count: total });
    return { imported: done, duplicates: 0 };
  },

  async stats() {
    return await ipc.getStats();
  },
};

// ── Modo dev (mock async) ──────────────────────────────────────────────────

const db = {
  models: LUMIA_DATA.models.map((m) => ({ ...m, tags: [...m.tags] })),
  categories: LUMIA_DATA.categories,
  tags: LUMIA_DATA.tags,
};

const mockApi = {
  async listCategories() { await delay(); return db.categories; },
  async listTags()       { await delay(); return db.tags; },

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
        ) return false;
      }
      return true;
    });
    if (sort === 'date') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'size') list.sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  },

  async getModel(id) { await delay(60); return db.models.find((m) => m.id === id) || null; },

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
    return { count: db.models.length, sizeMB: totalKB / 1024, indexed: true };
  },
};

export const api = IS_PHOTINO ? photinoApi : mockApi;
