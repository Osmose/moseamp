import { createStore } from 'redux';
import { combineReducers } from 'redux-immutable';

import library from 'moseamp/ducks/library';
import player from 'moseamp/ducks/player';

export default createStore(
  combineReducers({
    library,
    player,
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);
