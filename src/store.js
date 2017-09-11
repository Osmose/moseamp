import { createStore } from 'redux';
import { combineReducers } from 'redux-immutable';
import { Map } from 'immutable';

import library from './library';
import player from './player';

const initialState = new Map();

export default createStore(
  combineReducers({
    library,
    player,
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);
