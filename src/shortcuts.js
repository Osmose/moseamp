import { ipcRenderer } from 'electron';
import Mousetrap from 'mousetrap';

import store from 'moseamp/store';
import {
  getPlayingEntry,
  getPlaying,
  play,
  pause,
  openEntry,
} from 'moseamp/ducks/player';
import {
  getAvailableCategories,
  getSelectedCategory,
  setSelectedCategory,
  getSelectedEntryId,
  getFilteredSearchResults,
  setSelectedEntry,
  getSelectedEntry,
} from 'moseamp/ducks/library';

function playPause() {
  const state = store.getState();
  if (!getPlayingEntry(state)) {
    return;
  }

  if (getPlaying(state)) {
    store.dispatch(pause());
  } else {
    store.dispatch(play());
  }
}

ipcRenderer.on('play-pause', playPause);
Mousetrap.bind('space', playPause);

// Up: 'entry-up',
// Down: 'entry-up',
// Space: 'play-pause',

Mousetrap.bind('mod+f', () => {
  document.querySelector('.search-field').focus();
});

function moveCategory(mod) {
  const state = store.getState();
  const category = getSelectedCategory(state);
  const categories = getAvailableCategories(state).toList();
  let index = categories.findIndex(c => c === category);
  index += mod;
  if (index < 0) {
    index = categories.size - 1;
  } else if (index >= categories.size) {
    index = 0;
  }
  store.dispatch(setSelectedCategory(categories.get(index)));
}

Mousetrap.bind('mod+up', () => moveCategory(-1));
Mousetrap.bind('mod+down', () => moveCategory(1));

function moveEntry(mod, wrap = true) {
  const state = store.getState();
  const entryId = getSelectedEntryId(state);
  const entries = getFilteredSearchResults(state);
  let index = entries.findIndex(e => e.get('id') === entryId);
  index += mod;
  if (index < 0) {
    if (wrap) {
      index = entries.size - 1;
    } else {
      index = 0;
    }
  } else if (index >= entries.size) {
    if (wrap) {
      index = 0;
    } else {
      index = entries.size - 1;
    }
  }
  store.dispatch(setSelectedEntry(entries.get(index)));
}

Mousetrap.bind('up', () => moveEntry(-1));
Mousetrap.bind('down', () => moveEntry(1));

Mousetrap.bind('enter', () => {
  const state = store.getState();
  const selectedEntry = getSelectedEntry(state);
  if (selectedEntry) {
    store.dispatch(openEntry(selectedEntry));
    store.dispatch(play());
  }
});

Mousetrap.bind('pageup', () => moveEntry(-window.libraryHeight, false));
Mousetrap.bind('pagedown', () => moveEntry(window.libraryHeight, false));
