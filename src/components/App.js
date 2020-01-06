import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import FileBrowser from 'moseamp/components/FileBrowser';
import Player from 'moseamp/components/Player';
import Sidebar from 'moseamp/components/Sidebar';
import { loadPrefs } from 'moseamp/ducks/prefs';

export default
@connect(null, { loadPrefs })
@autobind
class App extends React.Component {
  componentDidMount() {
    this.props.loadPrefs();
  }

  render() {
    return (
      <div className="app">
        <TitleBar />
        <div className="main-container">
          <Sidebar />
          <FileBrowser />
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
        <div className="title">
          MoseAmp
        </div>
      </div>
    );
  }
}
