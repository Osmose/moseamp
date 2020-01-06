import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import favorites from 'moseamp/ducks/favorites';
import filebrowser from 'moseamp/ducks/filebrowser';
import player from 'moseamp/ducks/player';

export default createStore(
  combineReducers({
    player,
    filebrowser,
    favorites,
  }),
  compose(
    applyMiddleware(
      thunk,
    ),
  ),
);
