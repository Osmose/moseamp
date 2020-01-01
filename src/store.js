import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import filebrowser from 'moseamp/ducks/filebrowser';
import player, { savePlayerInfoMiddleware } from 'moseamp/ducks/player';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(
  combineReducers({
    player,
    filebrowser,
  }),
  composeEnhancers(
    applyMiddleware(
      thunk,
      savePlayerInfoMiddleware,
    ),
  ),
);
