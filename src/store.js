import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import filebrowser from 'moseamp/ducks/filebrowser';
import player, { savePlayerInfoMiddleware } from 'moseamp/ducks/player';

export default createStore(
  combineReducers({
    player,
    filebrowser,
  }),
  compose(
    applyMiddleware(
      thunk,
      savePlayerInfoMiddleware,
    ),
  ),
);
