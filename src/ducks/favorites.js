import cloneDeep from 'lodash.clonedeep';
import uuidv4 from 'uuid/v4';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';

// == Actions

const ADD_ENTRY = 'favorites/ADD_ENTRY';
const REMOVE_ENTRY = 'favorites/REMOVE_ENTRY';
const REORDER_ENTRIES = 'favorites/REORDER_ENTRIES';

// == Reducer

function defaultState() {
  return {
    entries: [],
  };
}

export default function reducer(favorites = defaultState(), action = {}) {
  switch (action.type) {
    case ADD_ENTRY:
      return {
        ...favorites,
        entries: favorites.entries.concat(action.entry),
      };
    case REMOVE_ENTRY:
      return {
        ...favorites,
        entries: favorites.entries.filter(entry => entry.id !== action.entryId),
      };
    case REORDER_ENTRIES:
      const reorderedEntries = [...favorites.entries];
      const [removed] = reorderedEntries.splice(action.fromIndex, 1);
      reorderedEntries.splice(action.toIndex, 0, removed);
      return {
        ...favorites,
        entries: reorderedEntries,
      };
    case LOAD_PREFS:
      return {
        ...favorites,
        entries: cloneDeep(action.prefs.favoritesEntries) || favorites.entries,
      };
    default:
      return favorites;
  }
}

// == Selectors

export function getEntries(state) {
  return state.favorites.entries;
}

// == Action Creators

export function addEntry(name, path) {
  return (dispatch, getState) => {
    dispatch({
      type: ADD_ENTRY,
      entry: {
        id: uuidv4(),
        name,
        path,
      },
    });
    const state = getState();
    setPref('favoritesEntries', getEntries(state));
  };
}

export function removeEntry(entryId) {
  return (dispatch, getState) => {
    dispatch({
      type: REMOVE_ENTRY,
      entryId,
    });
    const state = getState();
    setPref('favoritesEntries', getEntries(state));
  };
}

export function reorderEntries(fromIndex, toIndex) {
  return (dispatch, getState) => {
    dispatch({
      type: REORDER_ENTRIES,
      fromIndex,
      toIndex,
    });
    const state = getState();
    setPref('favoritesEntries', getEntries(state));
  };
}
