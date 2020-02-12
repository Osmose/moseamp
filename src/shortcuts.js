import { ipcRenderer, remote } from 'electron';
import Mousetrap from 'mousetrap';

import store from 'moseamp/store';
import {
  getCurrentFilePath,
  getPlaying,
  play,
  pause,
} from 'moseamp/ducks/player';
import {
  historyBack,
  historyForward,
} from 'moseamp/ducks/filebrowser';

const browserWindow = remote.getCurrentWindow();

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
browserWindow.on('swipe', (event, direction) => {
  if (direction === 'left') {
    back();
  } else if (direction === 'right') {
    forward();
  }
});
