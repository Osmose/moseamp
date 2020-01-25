import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { Titlebar as CustomTitleBar, Color as TitleBarColor } from 'custom-electron-titlebar';

import FileBrowser from 'moseamp/components/FileBrowser';
import Player from 'moseamp/components/Player';
import Sidebar from 'moseamp/components/Sidebar';
import { loadEntries } from 'moseamp/ducks/filebrowser';
import { setCurrentTime, loadNextEntry } from 'moseamp/ducks/player';
import { loadPrefs } from 'moseamp/ducks/prefs';
import player from 'moseamp/player';

export default
@connect(null, { loadPrefs, loadEntries, setCurrentTime, loadNextEntry })
@autobind
class App extends React.Component {
  componentDidMount() {
    this.props.loadPrefs();
    this.props.loadEntries();
    player.on('timeupdate', this.props.setCurrentTime);
    player.on('ended', this.handleEnded);
  }

  componentWillUnmount() {
    player.off('timeupdate', this.props.setCurrentTime);
    player.off('ended', this.handleEnded);
  }

  handleEnded() {
    this.props.loadNextEntry(true);
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
    if (process.platform === 'darwin') {
      return <MacTitleBar />;
    }

    return <WindowsTitleBar />;
  }
}

class WindowsTitleBar extends React.Component {
  componentDidMount() {
    this.titlebar = new CustomTitleBar({
      backgroundColor: TitleBarColor.fromHex('#404040'),
    });
  }

  componentWillUnmount() {
    this.titlebar.dispose();
  }

  render() {
    return null;
  }
}

class MacTitleBar extends React.Component {
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
