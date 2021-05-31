import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import favorites from 'moseamp/ducks/favorites';
import filebrowser from 'moseamp/ducks/filebrowser';
import player from 'moseamp/ducks/player';
import app from 'moseamp/ducks/app';
import visualizer from 'moseamp/ducks/visualizer';
import renderer from 'moseamp/slices/renderer';

const store = createStore(
  combineReducers({
    player,
    filebrowser,
    favorites,
    app,
    visualizer,
    renderer,
  }),
  compose(applyMiddleware(thunk))
);

window.store = store;
export default store;
