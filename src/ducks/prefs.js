import Store from 'electron-store';

import player from 'moseamp/player';

const prefs = new Store({
  accessPropertiesByDotNotation: false,
});

// == Actions

export const LOAD_PREFS = 'prefs/LOAD_PREFS';

// == Action Creators

export function loadPrefs() {
  return async (dispatch, getState) => {
    dispatch({
      type: LOAD_PREFS,
      prefs: prefs.store,
    });

    // Volume needs to be set manually after loading the value from prefs
    if (Number.isFinite(prefs.store.volume)) {
      player.setVolume(prefs.store.volume);
    }
  };
}

export function setPref(name, value) {
  prefs.set(name, value);
}
