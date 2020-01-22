import path from 'path';
import fs from 'fs';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';

// == Actions

const CHANGE_PATH = 'filebrowser/CHANGE_PATH';
const SET_ENTRIES = 'filebrowser/SET_ENTRIES';

// == Reducer

function defaultState() {
  return {
    root: path.parse(process.cwd()).root,
    currentPath: '',
    entries: [],
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
      };
    case SET_ENTRIES:
      return {
        ...filebrowser,
        entries: action.entries.map(entry => ({...entry})),
        loading: false,
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
  return state.filebrowser.root;
}

export function getCurrentPathSegments(state) {
  const segments = (
    path.normalize(getCurrentPath(state))
      .split(/[/\\]/)
      .filter(name => name && name !== '.')
      .map((name, index, segmentNames) => ({
        name,
        path: segmentNames.slice(0, index + 1).join(path.sep),
      }))
  );

  const root = getRoot(state);
  segments.unshift({
    name: root,
    path: root,
  });

  return segments;
}

export function getFullCurrentPath(state) {
  return path.join(getRoot(state), getCurrentPath(state));
}

export function getEntries(state) {
  return state.filebrowser.entries;
}

// == Action Creators

export function changeFullPath(newFullPath) {
  return async (dispatch, getState) => {
    const state = getState();
    const root = getRoot(state);

    const parsed = path.parse(newFullPath);
    if (parsed.root !== root) {
      throw new Error('Multiple root directories not yet supported.');
    }

    const newPath = newFullPath.slice(root.length);
    dispatch(changePath(newPath));
  };
}

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

    const fullCurrentPath = getFullCurrentPath(state);
    const currentPath = getCurrentPath(state);
    const dirEntries = await fs.promises.readdir(fullCurrentPath, {withFileTypes: true});
    const entries = dirEntries.map(dirEnt => {
      return {
        fullPath: path.join(fullCurrentPath, dirEnt.name),
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
