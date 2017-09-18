import { Map } from 'immutable';

import { createEntries, getCategoryInfo } from 'moseamp/drivers';

const CREATE_ENTRIES = 'library/CREATE_ENTRIES';
const SET_SELECTED_CATEGORY = 'library/SET_SELECTED_CATEGORY';
const SET_SELECTED_ENTRY = 'library/SET_SELECTED_ENTRY';
const SKIP = 'library/SKIP';

function defaultState() {
  return new Map({
    selectedCategory: 'audio',
    selectedEntryId: null,
    entries: new Map(),
  });
}

export default function reducer(state = defaultState(), action = {}) {
  switch (action.type) {
    case CREATE_ENTRIES:
      return state.withMutations(ctx => {
        for (const entry of action.entries) {
          ctx.setIn(['entries', entry.get('id')], entry);
        }
      });
    case SET_SELECTED_CATEGORY:
      return state.set('selectedCategory', action.category);
    case SET_SELECTED_ENTRY:
      const id = action.entry && action.entry.get('id');
      return state.set('selectedEntryId', id);
    default:
      return state;
  }
}

export function createLibraryEntry(filename) {
  const entries = createEntries(filename);
  if (!entries) {
    return { type: SKIP };
  }

  return {
    type: CREATE_ENTRIES,
    entries,
  };
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
    entry,
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
  return entry || null;
}

export function getAllEntries(state) {
  return state.getIn(['library', 'entries']).valueSeq();
}

export function getFilteredEntries(state) {
  let entries = state.getIn(['library', 'entries']).valueSeq();

  const category = state.getIn(['library', 'selectedCategory']);
  if (category) {
    const info = getCategoryInfo(category);
    entries = entries.filter(entry => entry.get('category') === category).sort((a, b) => {
      for (const attr of info.sort) {
        if (a.get(attr) > b.get(attr)) {
          return 1;
        } else if (b.get(attr) > a.get(attr)) {
          return -1;
        }
      }

      return 0;
    });
  }

  return entries;
}

export function getAvailableCategories(state) {
  const entries = state.getIn(['library', 'entries']).valueSeq();
  const categories = entries.map(entry => entry.get('category')).toSet();
  return categories.add('audio').sort();
}
