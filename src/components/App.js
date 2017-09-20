import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import Sidebar from 'moseamp/components/Sidebar';
import Library from 'moseamp/components/Library';
import Player from 'moseamp/components/Player';
import SearchField from 'moseamp/components/SearchField';
import { loadEntries } from 'moseamp/ducks/library';

@connect(null, { loadEntries })
@autobind
export default class App extends React.Component {
  componentDidMount() {
    this.props.loadEntries();
  }

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
        <div className="title">
          MoseAmp
        </div>
        <SearchField />
      </div>
    );
  }
}
