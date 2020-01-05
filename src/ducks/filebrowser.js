import fs from 'fs';
import path from 'path';

// == Actions

const CHANGE_PATH = 'filebrowser/CHANGE_PATH';
const SET_CURRENT_ENTRIES = 'filebrowser/SET_CURRENT_ENTRIES';

// == Reducer

function defaultState() {
  return {
    root: path.parse(process.cwd()).root,
    currentPath: 'Users/osmose/Music',
    currentEntries: [],
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
    case SET_CURRENT_ENTRIES:
      return {
        ...filebrowser,
        currentEntries: action.entries,
        loading: false,
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

export function getCurrentEntries(state) {
  return state.filebrowser.currentEntries;
}

// == Action Creators

export function changePath(newPath) {
  return async dispatch => {
    dispatch({
      type: CHANGE_PATH,
      path: newPath,
    });
    dispatch(loadEntriesForCurrentPath());
  };
}

export function loadEntriesForCurrentPath() {
  return async (dispatch, getState) => {
    const state = getState();
    const currentPath = getCurrentPath(state);
    const fullNewPath = path.join(getRoot(state), currentPath);
    const dirEntries = await fs.promises.readdir(fullNewPath, {withFileTypes: true});
    const entries = dirEntries.map(dirEnt => {
      return {
        fullPath: path.join(fullNewPath, dirEnt.name),
        path: path.join(currentPath, dirEnt.name),
        ext: path.extname(dirEnt.name),
        name: dirEnt.name,
        type: dirEnt.isDirectory() ? 'directory' : 'file',
      };
    });
    entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    dispatch({
      type: SET_CURRENT_ENTRIES,
      entries,
    });
  };
}
