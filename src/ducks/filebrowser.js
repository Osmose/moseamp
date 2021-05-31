import path from 'path';
import fs from 'fs';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';

// == Actions

const CHANGE_PATH = 'filebrowser/CHANGE_PATH';
const SET_ENTRIES = 'filebrowser/SET_ENTRIES';
const HISTORY_BACK = 'filebrowser/HISTORY_BACK';
const HISTORY_FORWARD = 'filebrowser/HISTORY_FORWARD';
const SET_SEARCH = 'filebrowser/SET_SEARCH';

// == Reducer

function defaultState() {
  return {
    currentPath: process.cwd(),
    entries: [],
    history: [],
    search: null,
    forwardHistory: [],
    loading: false,
  };
}

export default function reducer(filebrowser = defaultState(), action = {}) {
  switch (action.type) {
    case CHANGE_PATH:
      return {
        ...filebrowser,
        currentPath: action.path,
        loading: true,
        history: filebrowser.history.concat([filebrowser.currentPath]).slice(-100),
        forwardHistory: [],
      };
    case HISTORY_BACK:
      if (filebrowser.history.length < 1) {
        return filebrowser;
      }

      const backPath = filebrowser.history[filebrowser.history.length - 1];
      return {
        ...filebrowser,
        currentPath: backPath,
        history: filebrowser.history.slice(0, -1),
        forwardHistory: filebrowser.forwardHistory.concat([filebrowser.currentPath]),
      };
    case HISTORY_FORWARD:
      if (filebrowser.forwardHistory.length < 1) {
        return filebrowser;
      }

      const forwardPath = filebrowser.forwardHistory[filebrowser.forwardHistory.length - 1];
      return {
        ...filebrowser,
        currentPath: forwardPath,
        history: filebrowser.history.concat([filebrowser.currentPath]),
        forwardHistory: filebrowser.forwardHistory.slice(0, -1),
      };
    case SET_ENTRIES:
      return {
        ...filebrowser,
        entries: action.entries.map((entry) => ({ ...entry })),
        loading: false,
      };
    case SET_SEARCH:
      return {
        ...filebrowser,
        search: action.search,
      };
    case LOAD_PREFS:
      return {
        ...filebrowser,
        currentPath: action.prefs.filebrowserCurrentPath || '',
      };
    default:
      return filebrowser;
  }
}

// == Selectors

export function getCurrentPath(state) {
  return state.filebrowser.currentPath;
}

export function getLoading(state) {
  return state.filebrowser.loading;
}

export function getRoot(state) {
  const parsed = path.parse(getCurrentPath(state));
  return parsed.root;
}

export function getSearch(state) {
  return state.filebrowser.search;
}

export function getCurrentPathSegments(state) {
  const root = getRoot(state);
  const rootlessPath = getCurrentPath(state).slice(root.length);
  const segments = path
    .normalize(rootlessPath)
    .split(/[/\\]/)
    .filter((name) => name && name !== '.')
    .map((name, index, segmentNames) => {
      return {
        name,
        path: path.join(...[root, ...segmentNames.slice(0, index + 1)]),
      };
    });

  segments.unshift({
    name: root,
    path: root,
  });

  return segments;
}

export function getEntries(state) {
  return state.filebrowser.entries;
}

// == Action Creators

export function changePath(newPath) {
  return async (dispatch) => {
    dispatch({
      type: CHANGE_PATH,
      path: newPath,
    });
    dispatch(loadEntries());

    setPref('filebrowserCurrentPath', newPath);
  };
}

export function loadEntries() {
  return async (dispatch, getState) => {
    const state = getState();

    const currentPath = getCurrentPath(state);
    const dirEntries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    const entries = dirEntries.map((dirEnt) => {
      return {
        path: path.join(currentPath, dirEnt.name),
        ext: path.extname(dirEnt.name),
        name: dirEnt.name,
        type: dirEnt.isDirectory() ? 'directory' : 'file',
      };
    });
    entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    dispatch({
      type: SET_ENTRIES,
      entries,
    });
  };
}

export function historyBack() {
  return (dispatch) => {
    dispatch({
      type: HISTORY_BACK,
    });
    dispatch(loadEntries());
  };
}

export function historyForward() {
  return (dispatch) => {
    dispatch({
      type: HISTORY_FORWARD,
    });
    dispatch(loadEntries());
  };
}

export function setSearch(search) {
  return {
    type: SET_SEARCH,
    search,
  };
}
