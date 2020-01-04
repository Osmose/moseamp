import { ipcRenderer } from 'electron';
import Mousetrap from 'mousetrap';

import store from 'moseamp/store';
import {
  getCurrentFilePath,
  getPlaying,
  play,
  pause,
} from 'moseamp/ducks/player';

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
