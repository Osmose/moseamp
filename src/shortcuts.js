import { ipcRenderer } from 'electron';
import Mousetrap from 'mousetrap';

import store from 'moseamp/store';
import {
  getCurrentFilePath,
  getPlaying,
  play,
  pause,
  loadPrevEntry,
  loadNextEntry,
  nextTrack,
  prevTrack,
  increaseVolume,
  decreaseVolume,
  toggleMute,
} from 'moseamp/ducks/player';
import {
  historyBack,
  historyForward,
  setSearch,
  getSearch,
} from 'moseamp/ducks/filebrowser';

// Play or pause on media key or space
function playPause() {
  const state = store.getState();
  if (!getCurrentFilePath(state)) {
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

ipcRenderer.on('load-next-entry', () => {
  store.dispatch(loadNextEntry());
});

ipcRenderer.on('load-prev-entry', () => {
  store.dispatch(loadPrevEntry());
});

ipcRenderer.on('next-track', () => {
  store.dispatch(nextTrack());
});

ipcRenderer.on('prev-track', () => {
  store.dispatch(prevTrack());
});

ipcRenderer.on('increase-volume', () => {
  store.dispatch(increaseVolume());
});

ipcRenderer.on('decrease-volume', () => {
  store.dispatch(decreaseVolume());
});

ipcRenderer.on('toggle-mute', () => {
  store.dispatch(toggleMute());
});

// Back and forward through history on three finger swipe, backspace, or Cmd+arrow
function back() {
  store.dispatch(historyBack());
}
function forward() {
  store.dispatch(historyForward());
}
Mousetrap.bind('backspace', back);
Mousetrap.bind('meta+left', back);
Mousetrap.bind('meta+right', forward);

Mousetrap.bind(['meta+f', 'ctrl+f'], () => {
  const state = store.getState();
  if (getSearch(state) === null) {
    store.dispatch(setSearch(''));
  }
  document.querySelector('#search-input')?.focus();
});
