import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';
import player, { DEFAULT_GAIN, MAX_GAIN } from 'moseamp/player';
import { getTypeForExt } from 'moseamp/filetypes';
import { parseDurationString } from 'moseamp/utils';

// == Actions

const SET_CURRENT_FILE_PATH = 'player/SET_CURRENT_FILE_PATH';
const SET_PLAYING = 'player/SET_PLAYING';
const SET_VOLUME = 'player/SET_VOLUME';
const SET_CURRENT_TIME = 'player/SET_CURRENT_TIME';
const SET_DURATION = 'player/SET_DURATION';
const SET_META = 'player/SET_META';
const SET_CURRENT_SONG = 'player/SET_CURRENT_SONG';
const SET_SHUFFLE = 'player/SET_SHUFFLE';
const SET_PLAYLIST = 'player/SET_PLAYLIST';
const SET_LOOP = 'player/SET_LOOP';
const SET_CUSTOM_DURATION = 'player/SET_CUSTOM_DURATION';
const SET_USE_CUSTOM_DURATION = 'player/SET_USE_CUSTOM_DURATION';

// == Reducer

function defaultState() {
  return {
    currentFilePath: null,
    playlist: [],
    currentSong: null,
    songCount: null,
    playing: false,
    volume: DEFAULT_GAIN,
    prevVolume: DEFAULT_GAIN,
    currentTime: null,
    duration: null,
    currentTitle: null,
    currentArtist: null,
    shuffle: false,
    loop: false,
    useCustomDuration: false,
    customDuration: '',
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
    case SET_PLAYLIST:
      return {
        ...state,
        playlist: [...action.playlist],
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
        prevVolume: state.volume,
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
    case SET_SHUFFLE:
      let playlist = [...state.playlist];
      if (action.shuffle) {
        playlist = _.shuffle(playlist);
      } else {
        playlist.sort(filePathCompare);
      }

      return {
        ...state,
        shuffle: action.shuffle,
        playlist,
      };
    case SET_LOOP:
      return {
        ...state,
        loop: action.loop,
      };
    case SET_CUSTOM_DURATION:
      return {
        ...state,
        customDuration: action.customDuration,
      };
    case SET_USE_CUSTOM_DURATION:
      return {
        ...state,
        useCustomDuration: action.useCustomDuration,
      };
    case LOAD_PREFS:
      return {
        ...state,
        volume: action.prefs.volume || state.volume,
        shuffle: action.prefs.shuffle || state.shuffle,
        loop: action.prefs.loop || state.loop,
        useCustomDuration: action.prefs.useCustomDuration || state.useCustomDuration,
        customDuration: action.prefs.customDuration || state.customDuration,
      };
    default:
      return state;
  }
}

// == Action Creators

export function openFile(filePath) {
  return async (dispatch, getState) => {
    try {
      const meta = await player.load(filePath);
      dispatch({
        type: SET_CURRENT_FILE_PATH,
        filePath,
      });

      const state = getState();
      const playlist = getPlaylist(state);
      if (!playlist.includes(filePath)) {
        const newPlaylist = await getPlayablePaths(path.dirname(filePath), getShuffle(state));
        dispatch({
          type: SET_PLAYLIST,
          playlist: newPlaylist,
        });
      }

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
  const boundedVolume = Math.min(Math.max(volume, 0), MAX_GAIN);
  player.setVolume(boundedVolume);
  setPref('volume', boundedVolume);
  return {
    type: SET_VOLUME,
    volume: boundedVolume,
  };
}

export function increaseVolume() {
  return async (dispatch, getState) => {
    const state = getState();
    const volume = getVolume(state);
    const step = MAX_GAIN / 10;
    dispatch(setVolume(volume + step));
  };
}

export function decreaseVolume() {
  return async (dispatch, getState) => {
    const state = getState();
    const volume = getVolume(state);
    const step = MAX_GAIN / 10;
    dispatch(setVolume(volume - step));
  };
}

export function toggleMute() {
  return async (dispatch, getState) => {
    const state = getState();
    const volume = getVolume(state);
    if (volume !== 0) {
      dispatch(setVolume(0));
    } else {
      const prevVolume = getPrevVolume(state);
      dispatch(setVolume(prevVolume));
    }
  }
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

export function setShuffle(shuffle) {
  setPref('shuffle', shuffle);
  return {
    type: SET_SHUFFLE,
    shuffle,
  };
}

export function setLoop(loop) {
  setPref('loop', loop);
  return {
    type: SET_LOOP,
    loop,
  };
}

export function setCustomDuration(customDuration) {
  setPref('customDuration', customDuration);
  return {
    type: SET_CUSTOM_DURATION,
    customDuration,
  };
}

export function setUseCustomDuration(useCustomDuration) {
  setPref('useCustomDuration', useCustomDuration);
  return {
    type: SET_USE_CUSTOM_DURATION,
    useCustomDuration,
  };
}

export function loadNextEntry(automatic = false) {
  return async (dispatch, getState) => {
    const state = getState();
    const currentFilePath = getCurrentFilePath(state);
    if (!currentFilePath) {
      return;
    }

    const loop = getLoop(state);
    if (automatic && loop) {
      dispatch(openFile(currentFilePath));
      return;
    }

    const playlist = getPlaylist(state);
    if (playlist.length < 1) {
      return;
    }
    const currentPathIndex = playlist.findIndex(filePath => filePath === currentFilePath);
    const nextPath = playlist[(currentPathIndex + 1) % playlist.length];
    dispatch(openFile(nextPath));
  };
}

export function loadPrevEntry() {
  return async (dispatch, getState) => {
    const state = getState();
    const currentFilePath = getCurrentFilePath(state);

    const playlist = getPlaylist(state);
    if (!currentFilePath || playlist.length < 1) {
      return;
    }

    const currentPathIndex = playlist.findIndex(filePath => filePath === currentFilePath);

    let nextPathIndex;
    if (currentPathIndex < 1) {
      nextPathIndex = playlist.length - 1;
    } else {
      nextPathIndex = currentPathIndex - 1;
    }
    const nextPath = playlist[nextPathIndex];
    dispatch(openFile(nextPath));
  };
}

export function nextTrack() {
  return async (dispatch, getState) => {
    const state = getState();
    const songCount = getSongCount(state);
    const currentSong = getCurrentSong(state);
    if (songCount <= 1 || currentSong >= songCount - 1) {
      return;
    }

    dispatch(seek(currentSong + 1));
  };
}

export function prevTrack() {
  return async (dispatch, getState) => {
    const state = getState();
    const songCount = getSongCount(state);
    const currentSong = getCurrentSong(state);
    if (songCount <= 1 || currentSong < 1) {
      return;
    }

    dispatch(seek(currentSong - 1));
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

export function getPrevVolume(state) {
  return state.player.prevVolume;
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

export function getShuffle(state) {
  return state.player.shuffle;
}

export function getPlaylist(state) {
  return state.player.playlist;
}

export function getLoop(state) {
  return state.player.loop;
}

export function getCustomDuration(state) {
  return state.player.customDuration;
}

export function getCustomDurationSeconds(state) {
  return parseDurationString(getCustomDuration(state));
}

export function getUseCustomDuration(state) {
  return state.player.useCustomDuration;
}

// == Utils

const filePathCompare = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());

async function getPlayablePaths(directory, shuffle) {
  const dirEntries = await fs.promises.readdir(directory, {withFileTypes: true});
  let playablePaths = dirEntries
    .filter(entry => !entry.isDirectory())
    .filter(entry => getTypeForExt(path.extname(entry.name)))
    .map(entry => path.join(directory, entry.name));

  if (shuffle) {
    playablePaths = _.shuffle(playablePaths);
  } else {
    playablePaths.sort(filePathCompare);
  }

  return playablePaths;
}
