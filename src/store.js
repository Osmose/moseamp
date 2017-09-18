import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { combineReducers } from 'redux-immutable';

import library from 'moseamp/ducks/library';
import player from 'moseamp/ducks/player';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(
  combineReducers({
    library,
    player,
  }),
  composeEnhancers(
    applyMiddleware(thunk),
  ),
);
