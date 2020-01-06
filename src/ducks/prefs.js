import Store from 'electron-store';

const prefs = new Store({
  accessPropertiesByDotNotation: false,
});

// == Actions

export const LOAD_PREFS = 'prefs/LOAD_PREFS';

// == Action Creators

export function loadPrefs() {
  return {
    type: LOAD_PREFS,
    prefs: prefs.store,
  };
}

export function setPref(name, value) {
  prefs.set(name, value);
}
