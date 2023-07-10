import 'moseamp/css/styles.css';
import '@fortawesome/fontawesome-free/js/all';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import 'moseamp/shortcuts';
import store from 'moseamp/store';
import App from 'moseamp/components/App';

import { Titlebar, TitlebarColor } from 'custom-electron-titlebar';

window.addEventListener('DOMContentLoaded', () => {
  new Titlebar({
    backgroundColor: TitlebarColor.fromHex('#404040'),
    overflow: 'hidden',
  });

  // Workaround: Move react-beautiful-dnd elements back to body after titlebar moves them to container.
  for (const node of document.querySelectorAll('.cet-container > div[id^="rfd-"]')) {
    document.body.appendChild(node);
  }
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container')
);
