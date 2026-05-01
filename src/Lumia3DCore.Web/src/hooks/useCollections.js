// Collections + favorites store, persisted to localStorage.
// Collections are user-defined groupings (à la playlists) that hold model IDs.
// Favorites is a single built-in collection with id = '__favorites'.

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const FAV_ID = '__favorites';

const DEFAULT_STATE = {
  favorites: [],            // [modelId, ...]
  collections: [             // [{id, name, color, modelIds}]
    { id: 'c-print', name: 'Para imprimir', color: '#FFA85F', modelIds: [3, 7, 12] },
    { id: 'c-wip',   name: 'Em revisão',    color: '#5BD68D', modelIds: [5, 9] },
  ],
};

export function useCollections() {
  const [state, setState] = useLocalStorage('collections', DEFAULT_STATE);

  const isFavorite = useCallback((id) => state.favorites.includes(id), [state.favorites]);

  const toggleFavorite = useCallback((id) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  }, [setState]);

  const createCollection = useCallback((name, color = '#9097A0') => {
    const id = `c-${Date.now().toString(36)}`;
    setState((s) => ({
      ...s,
      collections: [...s.collections, { id, name, color, modelIds: [] }],
    }));
    return id;
  }, [setState]);

  const renameCollection = useCallback((id, name) => {
    setState((s) => ({
      ...s,
      collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  }, [setState]);

  const deleteCollection = useCallback((id) => {
    setState((s) => ({ ...s, collections: s.collections.filter((c) => c.id !== id) }));
  }, [setState]);

  const addToCollection = useCallback((collectionId, modelId) => {
    if (collectionId === FAV_ID) return toggleFavorite(modelId);
    setState((s) => ({
      ...s,
      collections: s.collections.map((c) =>
        c.id === collectionId && !c.modelIds.includes(modelId)
          ? { ...c, modelIds: [...c.modelIds, modelId] }
          : c
      ),
    }));
  }, [setState, toggleFavorite]);

  const removeFromCollection = useCallback((collectionId, modelId) => {
    if (collectionId === FAV_ID) {
      setState((s) => ({ ...s, favorites: s.favorites.filter((x) => x !== modelId) }));
      return;
    }
    setState((s) => ({
      ...s,
      collections: s.collections.map((c) =>
        c.id === collectionId
          ? { ...c, modelIds: c.modelIds.filter((x) => x !== modelId) }
          : c
      ),
    }));
  }, [setState]);

  const getCollection = useCallback((id) => {
    if (id === FAV_ID) return { id: FAV_ID, name: 'Favoritos', color: '#FFA85F', modelIds: state.favorites };
    return state.collections.find((c) => c.id === id) || null;
  }, [state]);

  return {
    favorites: state.favorites,
    collections: state.collections,
    isFavorite,
    toggleFavorite,
    createCollection,
    renameCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollection,
    FAV_ID,
  };
}
