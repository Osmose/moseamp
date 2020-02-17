// == Constants

export const MODE_FILEBROWSER = 'filebrowser';
export const MODE_VISUALIZER = 'visualizer';

// == Actions

const SET_MODE = 'app/SET_MODE';

// == Reducer

function defaultState() {
  return {
    mode: MODE_FILEBROWSER,
  };
}

export default function reducer(app = defaultState(), action = {}) {
  switch (action.type) {
    case SET_MODE:
      return {
        ...app,
        mode: action.mode,
      };
    default:
      return app;
  }
}

// == Selectors

export function getMode(state) {
  return state.app.mode;
}

// == Action Creators

export function setMode(mode) {
  return {
    type: SET_MODE,
    mode,
  };
}
