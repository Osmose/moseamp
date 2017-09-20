import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import 'moseamp/shortcuts';
import store from 'moseamp/store';
import App from 'moseamp/components/App';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container'),
);
