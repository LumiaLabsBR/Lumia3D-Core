/**
 * Wrapper sobre window.external.sendMessage / receiveMessage (Photino IPC).
 *
 * Em desenvolvimento (Vite dev server), as chamadas são mockadas a partir de
 * src/data.js até a janela Photino estar disponível.
 *
 * Protocolo:
 *   Request : { action: string, payload?: object }
 *   Response: { success: bool, data?: any, error?: string }
 */

const IS_PHOTINO = typeof window !== 'undefined' && typeof window.external?.sendMessage === 'function';

// Fila de callbacks para associar respostas com requests (Photino não tem IDs nativos)
let _pendingCallbacks = [];

if (IS_PHOTINO) {
  window.external.receiveMessage((responseJson) => {
    const callback = _pendingCallbacks.shift();
    if (callback) {
      try {
        callback(null, JSON.parse(responseJson));
      } catch (e) {
        callback(e, null);
      }
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
    // Dev mock: retorna dados do módulo data.js
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
    default:
      return Promise.resolve(null);
  }
}

// ── API pública ────────────────────────────────────────────────────────────
export const api = {
  getObjects:      (categoryId = null, tagId = null) => send('getObjects', { categoryId, tagId }),
  searchObjects:   (term, categoryId = null, tagId = null) => send('searchObjects', { term, categoryId, tagId }),
  getCategories:   () => send('getCategories'),
  getTags:         () => send('getTags'),
  getAttachments:  (objectId) => send('getAttachments', { objectId }),

  // Fase 2+: chamadas de mutação (ainda não wired no IpcBridge)
  importFile:      (filePath, categoryId = null) => send('importFile', { filePath, categoryId }),
  importFolder:    (folderPath, parentCategoryId = null) => send('importFolder', { folderPath, parentCategoryId }),
  deleteObject:    (id) => send('deleteObject', { id }),
  updateObject:    (id, name, description) => send('updateObject', { id, name, description }),
  addTagToObject:  (objectId, tagId) => send('addTagToObject', { objectId, tagId }),
  removeTagFromObject: (objectId, tagId) => send('removeTagFromObject', { objectId, tagId }),
  createCategory:  (name, parentCategoryId = null) => send('createCategory', { name, parentCategoryId }),
  deleteCategory:  (id) => send('deleteCategory', { id }),
  addAttachment:   (objectId, filePath) => send('addAttachment', { objectId, filePath }),
  deleteAttachment:(id) => send('deleteAttachment', { id }),
  regenerateThumbnail: (objectId) => send('regenerateThumbnail', { objectId }),
  getSettings:     () => send('getSettings'),
  saveSettings:    (settings) => send('saveSettings', { settings }),
  checkForUpdate:  () => send('checkForUpdate'),
};
