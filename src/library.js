import { basename, extname } from 'path';
import { List, Map } from 'immutable';

import { digitalAudioEntry } from './audio';
import { gmeEntry } from './gme';

export const CATEGORY_AUDIO = 'audio';
export const CATEGORY_NES = 'nes';
export const CATEGORY_PS1 = 'ps1';

const EXTENSION_CATEGORIES = {
  '.mp3': CATEGORY_AUDIO,
  '.psf': CATEGORY_PS1,
  '.nsf': CATEGORY_NES,
};
const ENTRY_BUILDERS = {
  [CATEGORY_AUDIO]: digitalAudioEntry,
  [CATEGORY_NES]: gmeEntry,
};

const CREATE_ENTRY = 'library/CREATE_ENTRY';
const CREATE_ENTRIES = 'library/CREATE_ENTRIES';
const SET_SELECTED_CATEGORY = 'library/SET_SELECTED_CATEGORY';
const SET_SELECTED_ENTRY = 'library/SET_SELECTED_ENTRY';

export function getCategory(filename) {
  return EXTENSION_CATEGORIES[extname(filename)] || null;
}

function defaultState() {
  return new Map({
    selectedCategory: CATEGORY_AUDIO,
    selectedEntryId: null,
    entries: new Map(),
  });
}

export default function reducer(state = defaultState(), action = {}) {
  switch (action.type) {
    case CREATE_ENTRY:
      const entry = action.entry;
      return state.setIn(['entries', entry.id], new Map(entry));
    case CREATE_ENTRIES:
      return state.withMutations(ctx => {
        for (const entry of action.entries) {
          ctx.setIn(['entries', entry.id], new Map(entry));
        }
      });
    case SET_SELECTED_CATEGORY:
      return state.set('selectedCategory', action.category);
    case SET_SELECTED_ENTRY:
      const id = action.entry && action.entry.id;
      return state.set('selectedEntryId', id);
    default:
      return state;
  }
}

export function createLibraryEntry(filename) {
  const category = getCategory(filename);
  const entry = ENTRY_BUILDERS[category](filename);
  if (Array.isArray(entry)) {
    for (const e of entry) {
      e.category = category;
    }
    return {
      type: CREATE_ENTRIES,
      entries: entry,
    };
  } else {
    entry.category = category;
    return {
      type: CREATE_ENTRY,
      entry,
    };
  }
}

export function setSelectedCategory(category) {
  return {
    type: SET_SELECTED_CATEGORY,
    category,
  };
}

export function setSelectedEntry(entry) {
  return {
    type: SET_SELECTED_ENTRY,
    entry: entry,
  };
}

export function getSelectedCategory(state) {
  return state.getIn(['library', 'selectedCategory']);
}

export function getSelectedEntry(state) {
  let entry = null;
  const id = state.getIn(['library', 'selectedEntryId']);
  if (id) {
    entry = state.getIn(['library', 'entries', id]);
  }
  return entry ? entry.toJS() : null;
}

export function getAllEntries(state) {
  return state.getIn(['library', 'entries']).valueSeq().toJS();
}

export function getFilteredEntries(state) {
  let entries = state.getIn(['library', 'entries']).valueSeq();

  const category = state.getIn(['library', 'selectedCategory']);
  if (category) {
    entries = entries.filter(entry => entry.get('category') === category);
  }

  return entries.toJS();
}
