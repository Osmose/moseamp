import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import FileBrowser from 'moseamp/components/FileBrowser';
import Player from 'moseamp/components/Player';
import { loadPlayerInfo } from 'moseamp/ducks/player';

export default
@connect(null, { loadPlayerInfo })
@autobind
class App extends React.Component {
  componentDidMount() {
    this.props.loadPlayerInfo();
  }

  render() {
    return (
      <div className="app">
        <TitleBar />
        <div className="main-container">
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
