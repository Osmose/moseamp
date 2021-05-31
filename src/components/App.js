import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Titlebar as CustomTitleBar, Color as TitleBarColor } from 'custom-electron-titlebar';

import FileBrowser from 'moseamp/components/FileBrowser';
import Player from 'moseamp/components/Player';
import Sidebar from 'moseamp/components/Sidebar';
import Visualizer, { RenderModal } from 'moseamp/components/Visualizer';
import { getMode, MODE_FILEBROWSER, MODE_VISUALIZER } from 'moseamp/ducks/app';
import { loadEntries, changePath } from 'moseamp/ducks/filebrowser';
import { setCurrentTime, loadNextEntry, getUseCustomDuration, getCustomDurationSeconds } from 'moseamp/ducks/player';
import { loadPrefs } from 'moseamp/ducks/prefs';
import player from 'moseamp/player';

const FADEOUT_DURATION = 5;

export default
@connect(
  (state) => ({
    mode: getMode(state),
    useCustomDuration: getUseCustomDuration(state),
    customDurationSeconds: getCustomDurationSeconds(state),
  }),
  {
    loadPrefs,
    loadEntries,
    setCurrentTime,
    loadNextEntry,
    changePath,
  },
)
@autobind
class App extends React.Component {
  constructor(props) {
    super(props);
    this.fadeOutStart = null;
  }

  componentDidMount() {
    this.props.loadPrefs();
    this.props.loadEntries();
    player.on('timeupdate', this.handleTimeUpdate);
    player.on('ended', this.handleEnded);
    player.on('load', this.handlePlayerLoad);
    ipcRenderer.on('openDirectory', this.handleOpenDirectory);
  }

  componentWillUnmount() {
    player.off('timeupdate', this.handleTimeUpdate);
    player.off('ended', this.handleEnded);
    player.on('load', this.handlePlayerLoad);
    ipcRenderer.off('openDirectory', this.handleOpenDirectory);
  }

  handleEnded() {
    this.props.loadNextEntry(true);
  }

  handleOpenDirectory(event, message) {
    this.props.changePath(message);
  }

  handleTimeUpdate(currentTime) {
    this.props.setCurrentTime(currentTime);

    const { customDurationSeconds, useCustomDuration } = this.props;
    if (useCustomDuration && customDurationSeconds !== null) {
      if (this.fadeOutStart === null && currentTime >= customDurationSeconds) {
        player.fadeOut(FADEOUT_DURATION);
        this.fadeOutStart = currentTime;
      } else if (this.fadeOutStart !== null && currentTime >= (this.fadeOutStart + FADEOUT_DURATION)) {
        player.stop();
      }
    }
  }

  handlePlayerLoad() {
    this.fadeOutStart = null;
  }

  render() {
    const { mode } = this.props;

    return (
      <div className="app">
        <RenderModal />

        <TitleBar />
        <div className="main-container">
          <Sidebar />
          {mode === MODE_FILEBROWSER && <FileBrowser />}
          {mode === MODE_VISUALIZER && <Visualizer />}
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
      overflow: 'hidden'
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
