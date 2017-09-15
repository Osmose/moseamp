import { List, Map } from 'immutable';
import { ipcRenderer } from 'electron';

import store from './store';
import { GMESound } from './gme';
import { DigitalAudioSound } from './audio';
import { AosdkSound } from './aosdk';

const SOUND_DRIVERS = {
  'audio': DigitalAudioSound,
  'gme': GMESound,
  'aosdk': AosdkSound,
};
const DEFAULT_GAIN = 1.0;

const SET_CURRENT_ENTRY_ID = 'player/SET_CURRENT_ENTRY_ID';
const SET_PLAYING = 'player/SET_PLAYING';
const SET_VOLUME = 'player/SET_VOLUME';
const SET_CURRENT_TIME = 'player/SET_CURRENT_TIME';
const SET_DURATION = 'player/SET_DURATION';

class Player {
  constructor() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = DEFAULT_GAIN;
    this.gainNode.connect(this.ctx.destination);
  }

  async loadSound(entry) {
    if (this.playing) {
      this.pause();
    }

    if (this.currentSound) {
      this.currentSound.sourceNode.disconnect(this.gainNode);
      if (this.currentSound.supportsTime) {
        this.currentSound.removeListener(this);
      }
    }

    const Sound = SOUND_DRIVERS[entry.soundDriver];
    this.currentSound = new Sound(entry, this.ctx);
    await this.currentSound.promiseLoaded;

    this.currentSound.sourceNode.connect(this.gainNode);
    if (this.currentSound.supportsTime) {
      store.dispatch(setDuration(this.currentSound.duration));
      this.currentSound.addListener(this);
    } else {
      store.dispatch(setCurrentTime(null));
      store.dispatch(setDuration(null));
    }
  }

  setVolume(volume) {
    this.gainNode.gain.value = volume;
  }

  seek(time) {
    if (!this.currentSound || !this.currentSound.supportsTime) {
      throw new Error('Cannot seek');
    }

    this.currentSound.seek(time);
  }

  play() {
    if (!this.currentSound) {
      throw new Error("No sound to play.");
    }

    this.currentSound.play();
  }

  pause() {
    if (!this.currentSound) {
      throw new Error("No sound to pause.");
    }

    this.currentSound.pause();
  }

  handleEvent(event) {
    switch (event.type) {
      case 'timeupdate':
        store.dispatch(setCurrentTime(event.target.currentTime));
        break;
      case 'ended':
        store.dispatch(setPlaying(false));
        break;
    }
  }
}

const player = new Player();

function defaultState() {
  return new Map({
    currentEntryId: null,
    playing: false,
    volume: DEFAULT_GAIN,
    currentTime: null,
    duration: null,
  });
}

export default function reducer(state = defaultState(), action = {}) {
  switch (action.type) {
    case SET_CURRENT_ENTRY_ID:
      return state.set('currentEntryId', action.entryId);
    case SET_PLAYING:
      return state.set('playing', action.playing);
    case SET_VOLUME:
      return state.set('volume', action.volume);
    case SET_CURRENT_TIME:
      return state.set('currentTime', action.currentTime);
    case SET_DURATION:
      return state.set('duration', action.duration);
    default:
      return state;
  }
}

export function openEntry(entry) {
  player.loadSound(entry);
  return {
    type: SET_CURRENT_ENTRY_ID,
    entryId: entry.id,
  };
}

export function setPlaying(playing) {
  return {
    type: SET_PLAYING,
    playing,
  };
}

export function play() {
  player.play();
  return {
    type: SET_PLAYING,
    playing: true,
  };
}

export function pause() {
  player.pause();
  return {
    type: SET_PLAYING,
    playing: false,
  };
}

export function setVolume(volume) {
  player.setVolume(volume);
  return {
    type: SET_VOLUME,
    volume,
  };
}

export function setCurrentTime(currentTime) {
  return {
    type: SET_CURRENT_TIME,
    currentTime,
  };
}

export function seek(time) {
  player.seek(time);
}

export function setDuration(duration) {
  return {
    type: SET_DURATION,
    duration,
  };
}

export function getPlayingEntry(state) {
  let entry = null;
  const id = state.getIn(['player', 'currentEntryId']);
  if (id) {
    entry = state.getIn(['library', 'entries', id]);
  }

  return entry ? entry.toJS() : null;
}

export function getPlaying(state) {
  return state.getIn(['player', 'playing']);
}

export function getVolume(state) {
  return state.getIn(['player', 'volume']);
}

export function getCurrentTime(state) {
  return state.getIn(['player', 'currentTime']);
}

export function getDuration(state) {
  return state.getIn(['player', 'duration']);
}

ipcRenderer.on('mediaplaypause', () => {
  const state = store.getState();
  if (!getPlayingEntry(state)) {
    return;
  }

  if (getPlaying(state)) {
    store.dispatch(pause());
  } else {
    store.dispatch(play());
  }
});
