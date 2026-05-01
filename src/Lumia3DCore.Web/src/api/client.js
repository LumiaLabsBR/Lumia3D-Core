/**
 * Wrapper sobre window.external.sendMessage / receiveMessage (Photino IPC).
 *
 * Em desenvolvimento (Vite dev server), as chamadas são mockadas a partir de
 * src/data.js até a janela Photino estar disponível.
 *
 * Protocolo:
 *   Request : { action: string, payload?: object }
 *   Response: { success: bool, data?: any, error?: string }
 *   Push    : { event: string, ...campos }  (C# → frontend, sem request correspondente)
 */

const IS_PHOTINO = typeof window !== 'undefined' && typeof window.external?.sendMessage === 'function';

// Fila de callbacks para associar respostas com requests (Photino não tem IDs nativos)
let _pendingCallbacks = [];

// Listeners para eventos push (C# → frontend)
const _eventListeners = {};

function _emitEvent(eventName, data) {
  (_eventListeners[eventName] ?? []).forEach((fn) => fn(data));
}

function _onEvent(eventName, fn) {
  if (!_eventListeners[eventName]) _eventListeners[eventName] = [];
  _eventListeners[eventName].push(fn);
  // Retorna função para remover o listener
  return () => {
    _eventListeners[eventName] = (_eventListeners[eventName] ?? []).filter((f) => f !== fn);
  };
}

if (IS_PHOTINO) {
  window.external.receiveMessage((responseJson) => {
    try {
      const msg = JSON.parse(responseJson);
      if (msg.event) {
        // Evento push sem request correspondente
        _emitEvent(msg.event, msg);
      } else {
        // Resposta a um request pendente
        const callback = _pendingCallbacks.shift();
        if (callback) callback(null, msg);
      }
    } catch (e) {
      const callback = _pendingCallbacks.shift();
      if (callback) callback(e, null);
    }
  });
}

/**
 * Envia uma action para o backend C# e retorna uma Promise com a resposta.
 * @param {string} action
 * @param {object} [payload={}]
 * @returns {Promise<any>} data da resposta em caso de sucesso
 */
function send(action, payload = {}) {
  if (!IS_PHOTINO) {
    return import('../data.js').then((m) => devMock(action, payload, m));
  }

  return new Promise((resolve, reject) => {
    _pendingCallbacks.push((err, response) => {
      if (err) return reject(err);
      if (!response.success) return reject(new Error(response.error ?? 'IPC error'));
      resolve(response.data);
    });
    window.external.sendMessage(JSON.stringify({ action, payload }));
  });
}

// ── Mock de desenvolvimento ────────────────────────────────────────────────
function devMock(action, payload, data) {
  const models = data.LUMIA_DATA?.models ?? [];
  const categories = data.LUMIA_DATA?.categories ?? [];
  const tags = data.LUMIA_DATA?.tags ?? [];

  switch (action) {
    case 'getObjects':
      return Promise.resolve(models);
    case 'searchObjects':
      return Promise.resolve(
        models.filter((o) =>
          o.name?.toLowerCase().includes((payload.term ?? '').toLowerCase())
        )
      );
    case 'getCategories':
      return Promise.resolve(categories);
    case 'getTags':
      return Promise.resolve(tags);
    case 'getAttachments':
      return Promise.resolve([]);
    case 'getStats':
      return Promise.resolve({ count: models.length, sizeMB: 0, indexed: true });
    case 'getAppInfo':
      return Promise.resolve({
        version: '0.1.0-alpha.1-dev',
        shortVersion: '0.1.0',
        buildDate: '2026-05-01',
        commit: 'dev',
        repoUrl: 'https://github.com/LumiaLabsBR/Lumia3D-Core',
      });
    case 'getSettings':
      return Promise.resolve({
        theme: 'dark', density: 'comfortable', viewMode: 'gallery', sortOrder: 'DateDesc',
        sidebarWidth: 260, autoCheckUpdates: false, includePreReleases: false,
        lastRepositoryPath: '', recentRepositories: [], thumbnailWorkerCount: null,
      });
    default:
      return Promise.resolve(null);
  }
}

// ── API pública ────────────────────────────────────────────────────────────
export const api = {
  // Leitura
  getObjects:          (categoryId = null, tagId = null) => send('getObjects', { categoryId, tagId }),
  searchObjects:       (term, categoryId = null, tagId = null) => send('searchObjects', { term, categoryId, tagId }),
  getCategories:       () => send('getCategories'),
  getTags:             () => send('getTags'),
  getAttachments:      (objectId) => send('getAttachments', { objectId }),
  getStats:            () => send('getStats'),
  getAppInfo:          () => send('getAppInfo'),
  getSettings:         () => send('getSettings'),

  // Import
  importFile:          (filePath, categoryId = null) => send('importFile', { filePath, categoryId }),
  importFolder:        (folderPath, parentCategoryId = null) => send('importFolder', { folderPath, parentCategoryId }),
  cancelImport:        () => send('cancelImport'),

  // Objetos
  deleteObject:        (id) => send('deleteObject', { id }),
  updateObject:        (id, name, description, categoryId) => send('updateObject', { id, name, description, categoryId }),

  // Tags
  addTagToObject:      (objectId, tagId) => send('addTagToObject', { objectId, tagId }),
  removeTagFromObject: (objectId, tagId) => send('removeTagFromObject', { objectId, tagId }),
  createTag:           (name, color = null) => send('createTag', { name, color }),
  updateTag:           (tagId, color) => send('updateTag', { tagId, color }),
  deleteTag:           (tagId) => send('deleteTag', { tagId }),

  // Categorias
  createCategory:      (name, parentCategoryId = null) => send('createCategory', { name, parentCategoryId }),
  updateCategory:      (id, name, parentCategoryId = null, sortOrder = 0) => send('updateCategory', { id, name, parentCategoryId, sortOrder }),
  deleteCategory:      (id) => send('deleteCategory', { id }),

  // Anexos
  addAttachment:       (objectId, filePath) => send('addAttachment', { objectId, filePath }),
  deleteAttachment:    (id) => send('deleteAttachment', { id }),

  // Thumbnails & configurações
  regenerateThumbnail: (objectId) => send('regenerateThumbnail', { objectId }),
  saveSettings:        (settings) => send('saveSettings', { settings }),
  checkForUpdate:      () => send('checkForUpdate'),
  downloadUpdate:      (installerUrl, sha256Url, installerSize) =>
                         send('downloadUpdate', { installerUrl, sha256Url, installerSize }),
  cancelDownload:      () => send('cancelDownload'),

  // Window controls (custom title bar)
  windowMinimize:  () => send('windowMinimize'),
  windowMaximize:  () => send('windowMaximize'),
  windowClose:     () => send('windowClose'),
  openExternal:    (url) => send('openExternal', { url }),

  // Eventos push (C# → frontend)
  on:  (eventName, handler) => _onEvent(eventName, handler),
};
