import path from 'path';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';

// == Actions

const CHANGE_PATH = 'filebrowser/CHANGE_PATH';

// == Reducer

function defaultState() {
  return {
    root: path.parse(process.cwd()).root,
    currentPath: '',
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
  return async (dispatch, getState) => {
    dispatch({
      type: CHANGE_PATH,
      path: newPath,
    });

    const state = getState();
    setPref('filebrowserCurrentPath', getCurrentPath(state));
  };
}
