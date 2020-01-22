import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';
import { getEntries } from 'moseamp/ducks/filebrowser';
import player, { DEFAULT_GAIN } from 'moseamp/player';

// == Actions

const SET_CURRENT_FILE_PATH = 'player/SET_CURRENT_FILE_PATH';
const SET_PLAYING = 'player/SET_PLAYING';
const SET_VOLUME = 'player/SET_VOLUME';
const SET_CURRENT_TIME = 'player/SET_CURRENT_TIME';
const SET_DURATION = 'player/SET_DURATION';
const SET_META = 'player/SET_META';
const SET_CURRENT_SONG = 'player/SET_CURRENT_SONG';

// == Reducer

function defaultState() {
  return {
    currentFilePath: null,
    currentSong: null,
    songCount: null,
    playing: false,
    volume: DEFAULT_GAIN,
    currentTime: null,
    duration: null,
    currentTitle: null,
    currentArtist: null,
  };
}

export default function reducer(state = defaultState(), action = {}) {
  switch (action.type) {
    case SET_CURRENT_FILE_PATH:
      return {
        ...state,
        currentFilePath: action.filePath,
        playing: false,
      };
    case SET_PLAYING:
      return {
        ...state,
        playing: action.playing,
      };
    case SET_VOLUME:
      return {
        ...state,
        volume: action.volume,
      };
    case SET_CURRENT_TIME:
      return {
        ...state,
        currentTime: action.currentTime,
      };
    case SET_DURATION:
      return {
        ...state,
        duration: action.duration,
      };
    case SET_META:
      return {
        ...state,
        currentTitle: action.meta.title,
        currentArtist: action.meta.artist,
        songCount: action.meta.songs,
        duration: action.meta.duration,
      };
    case SET_CURRENT_SONG:
      return {
        ...state,
        currentSong: action.song,
      };
    case LOAD_PREFS:
      return {
        ...state,
        volume: action.prefs.volume || state.volume,
      };
    default:
      return state;
  }
}

// == Action Creators

export function openFile(filePath) {
  return async dispatch => {
    try {
      const meta = await player.load(filePath);
      dispatch({
        type: SET_CURRENT_FILE_PATH,
        filePath,
      });
      dispatch(setCurrentTime(0));
      dispatch({
        type: SET_META,
        meta,
      });
      if (meta.songs > 0) {
        dispatch(seek(0));
      }
      dispatch(play());
    } catch (err) {
      console.log(err);
    }
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
  setPref('volume', volume);
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

export function setDuration(duration) {
  return {
    type: SET_DURATION,
    duration,
  };
}

export function setMeta(meta) {
  return {
    type: SET_META,
    meta,
  };
}

export function seek(song) {
  player.seek(song);
  return {
    type: SET_CURRENT_SONG,
    song,
  };
}

export function loadNextEntry() {
  return (dispatch, getState) => {
    const state = getState();
    const fileEntries = getEntries(state).filter(entry => entry.type === 'file');
    const currentFilePath = getCurrentFilePath(state);
    const currentEntryIndex = fileEntries.findIndex(entry => entry.fullPath === currentFilePath);
    const nextEntry = fileEntries[(currentEntryIndex + 1) % fileEntries.length];
    dispatch(openFile(nextEntry.fullPath));
  };
}

// == Selectors

export function getCurrentFilePath(state) {
  return state.player.currentFilePath;
}

export function getPlaying(state) {
  return state.player.playing;
}

export function getVolume(state) {
  return state.player.volume;
}

export function getCurrentTime(state) {
  return state.player.currentTime;
}

export function getDuration(state) {
  return state.player.duration;
}

export function getCurrentTitle(state) {
  return state.player.currentTitle;
}

export function getCurrentArtist(state) {
  return state.player.currentArtist;
}

export function getCurrentSong(state) {
  return state.player.currentSong;
}

export function getSongCount(state) {
  return state.player.songCount;
}
