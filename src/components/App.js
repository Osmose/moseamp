import autobind from 'autobind-decorator';
import React from 'react';

import Sidebar from 'moseamp/components/Sidebar';
import Library from 'moseamp/components/Library';
import Player from 'moseamp/components/Player';

@autobind
export default class App extends React.Component {
  render() {
    return (
      <div className="app">
        <TitleBar />
        <div className="library">
          <Sidebar />
          <Library />
        </div>
        <Player />
      </div>
    );
  }
}

class TitleBar extends React.Component {
  render() {
    return (
      <div className="title-bar">
        MoseAmp
      </div>
    );
  }
}
