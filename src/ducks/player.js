import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import player, { DEFAULT_GAIN } from 'moseamp/player';

const SET_CURRENT_FILE_PATH = 'player/SET_CURRENT_FILE_PATH';
const SET_PLAYING = 'player/SET_PLAYING';
const SET_VOLUME = 'player/SET_VOLUME';
const SET_CURRENT_TIME = 'player/SET_CURRENT_TIME';
const SET_DURATION = 'player/SET_DURATION';

function defaultState() {
  return {
    currentFilePath: null,
    playing: false,
    volume: DEFAULT_GAIN,
    currentTime: null,
    duration: null,
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
    default:
      return state;
  }
}

export function openFile(filePath) {
  return async dispatch => {
    try {
      await player.load(filePath);
      dispatch({
        type: SET_CURRENT_FILE_PATH,
        filePath,
      });
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

export function loadPlayerInfo() {
  return async dispatch => {
    const filename = path.resolve(os.homedir(), '.moseamp', 'player.json');
    try {
      const data = JSON.parse(await fs.readFile(filename));
      dispatch(setVolume(data.volume));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };
}

export const savePlayerInfoMiddleware = store => next => action => {
  const result = next(action);
  if (action.type === SET_VOLUME) {
    const data = {
      volume: getVolume(store.getState()),
    };
    (async () => {
      const filename = path.resolve(os.homedir(), '.moseamp', 'player.json');
      await fs.ensureDir(path.dirname(filename));

      try {
        await fs.writeFile(filename, JSON.stringify(data));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    })();
  }
  return result;
};
