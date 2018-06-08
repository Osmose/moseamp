import immutable, { Map } from 'immutable';
import glob from 'glob-promise';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { createSelector } from 'reselect';
import _ from 'lodash';

import { createEntries, getCategoryInfo } from 'moseamp/drivers';

const SET_ENTRIES = 'library/SET_ENTRIES';
const SET_SELECTED_CATEGORY = 'library/SET_SELECTED_CATEGORY';
const SET_SELECTED_ENTRY = 'library/SET_SELECTED_ENTRY';
const SET_ALL_ENTRIES = 'library/SET_ALL_ENTRIES';
const SET_SEARCH_QUERY = 'library/SET_SEARCH_QUERY';
const SKIP = 'library/SKIP';

function defaultState() {
  return new Map({
    searchQuery: '',
    selectedCategory: 'audio',
    selectedEntryId: null,
    entries: new Map(),
  });
}

export default function reducer(state = defaultState(), action = {}) {
  switch (action.type) {
    case SET_ENTRIES:
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
    case SET_ALL_ENTRIES:
      return state.set('entries', action.entries);
    case SET_SEARCH_QUERY:
      return state.set('searchQuery', action.query);
    default:
      return state;
  }
}

async function _createEntries(filenames) {
  const files = [];
  const directories = [];
  const stats = await Promise.all(filenames.map(fn => fs.stat(fn).catch(() => null)));
  for (let k = 0; k < filenames.length; k++) {
    if (stats[k] && stats[k].isDirectory()) {
      directories.push(filenames[k]);
    } else {
      files.push(filenames[k]);
    }
  }

  // I dunno, this sucks, but is super async? Whatever.
  const globs = await Promise.all(directories.map(dirname => glob(`${dirname}/**/*`)));
  const expandedFilenames = globs.reduce(
    (acc, globFilenames) => acc.concat(globFilenames),
    files,
  );

  const entryPromises = expandedFilenames.map(fn => {
    return createEntries(fn).catch(err => {
      console.error(err);
      return [];
    });
  });
  const entries = _.flatten(await Promise.all(entryPromises));
  return entries.filter(e => e);
}

export function createLibraryEntries(filenames) {
  return async dispatch => {
    const entries = await _createEntries(filenames);
    if (!entries) {
      dispatch({ type: SKIP });
    }

    dispatch({
      type: SET_ENTRIES,
      entries,
    });
  };
}

export function rescanLibrary() {
  return async (dispatch, getState) => {
    const oldEntries = getState().getIn(['library', 'entries']).valueSeq();
    const filenames = oldEntries.map(e => e.get('filename')).toSet();
    const newEntries = await _createEntries(filenames.toJS());
    if (!newEntries) {
      dispatch({ type: SKIP });
    }

    dispatch({
      type: SET_ENTRIES,
      entries: newEntries,
    });
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

export function setSearchQuery(query) {
  return {
    type: SET_SEARCH_QUERY,
    query,
  };
}

export function getSelectedCategory(state) {
  return state.getIn(['library', 'selectedCategory']);
}

export function getSelectedEntryId(state) {
  return state.getIn(['library', 'selectedEntryId']);
}

export function getEntryMap(state) {
  return state.getIn(['library', 'entries']);
}

export function getSearchQuery(state) {
  return state.getIn(['library', 'searchQuery']);
}

export const getSelectedEntry = createSelector(
  getSelectedEntryId,
  getEntryMap,
  (id, entries) => {
    return entries.get(id, null);
  },
);

export const getAllEntries = createSelector(
  getEntryMap,
  entries => {
    return entries.valueSeq();
  },
);

export const getFilteredEntries = createSelector(
  getAllEntries,
  getSelectedCategory,
  (entries, category) => {
    const info = getCategoryInfo(category);
    return entries.filter(entry => entry.get('category') === category).sort((a, b) => {
      for (const attr of info.sort) {
        if (a.get(attr) > b.get(attr)) {
          return 1;
        } else if (b.get(attr) > a.get(attr)) {
          return -1;
        }
      }

      return 0;
    });
  },
);

export const getFilteredSearchResults = createSelector(
  getFilteredEntries,
  getSearchQuery,
  getSelectedCategory,
  (entries, query, category) => {
    const info = getCategoryInfo(category);
    const transformedQuery = query.toLowerCase();
    if (query) {
      return entries.filter(
        entry => info.searchFields.some(
          field => entry.get(field).toLowerCase().includes(transformedQuery),
        ),
      );
    }

    return entries;
  },
);

export function getAvailableCategories(state) {
  const entries = state.getIn(['library', 'entries']).valueSeq();
  const categories = entries.map(entry => entry.get('category')).toSet();
  return categories.add('audio').sort();
}

export function loadEntries() {
  return async dispatch => {
    const filename = path.resolve(os.homedir(), '.moseamp', 'library.json');
    try {
      const data = JSON.parse(await fs.readFile(filename));
      dispatch({
        type: SET_ALL_ENTRIES,
        entries: immutable.fromJS(data),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };
}

export const saveEntriesMiddleware = store => next => action => {
  const result = next(action);
  if (action.type === SET_ENTRIES) {
    const data = getEntryMap(store.getState()).toJS();
    (async () => {
      const filename = path.resolve(os.homedir(), '.moseamp', 'library.json');
      await fs.ensureDir(path.dirname(filename));

      try {
        await fs.writeFile(filename, JSON.stringify(data));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    })();
  }
  return result;
};
