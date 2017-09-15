import { remote } from 'electron';
import { basename, extname } from 'path';
import { List, Map } from 'immutable';

import * as audio from './audio';
import * as aosdk from './aosdk';
import * as gme from './gme';
import { CATEGORY_AUDIO } from './categories';

const { dialog } = remote;

const ENTRY_BUILDERS = [
  audio.entryBuilder,
  gme.entryBuilder,
  aosdk.entryBuilder,
];

const CREATE_ENTRY = 'library/CREATE_ENTRY';
const CREATE_ENTRIES = 'library/CREATE_ENTRIES';
const SET_SELECTED_CATEGORY = 'library/SET_SELECTED_CATEGORY';
const SET_SELECTED_ENTRY = 'library/SET_SELECTED_ENTRY';

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
  let entry;
  for (const builder of ENTRY_BUILDERS) {
    if (builder.canHandle(filename)) {
      entry = builder.build(filename);
      break;
    }
  }

  if (!entry) {
    dialog.showMessageBox({
      type: 'error',
      message: 'Could not open: format not supported.',
    });
    return;
  }

  if (Array.isArray(entry)) {
    return {
      type: CREATE_ENTRIES,
      entries: entry,
    };
  } else {
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

export function getAvailableCategories(state) {
  const entries = state.getIn(['library', 'entries']).valueSeq();
  const categories = entries.map(entry => entry.get('category')).toSet();
  return categories.add(CATEGORY_AUDIO).sort().toJS();
}
