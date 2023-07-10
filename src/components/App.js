import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { ThemeProvider } from 'styled-components';

import FileBrowser from 'moseamp/components/FileBrowser';
import Player from 'moseamp/components/Player';
import Sidebar from 'moseamp/components/Sidebar';
import Visualizer from 'moseamp/components/Visualizer';
import Renderer from 'moseamp/components/Renderer';
import { getMode, MODE_FILEBROWSER, MODE_VISUALIZER, MODE_RENDERER } from 'moseamp/ducks/app';
import { loadEntries, changePath } from 'moseamp/ducks/filebrowser';
import { setCurrentTime, loadNextEntry, getUseCustomDuration, getCustomDurationSeconds } from 'moseamp/ducks/player';
import { loadPrefs } from 'moseamp/ducks/prefs';
import player from 'moseamp/player';
import theme from 'moseamp/theme';

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
  }
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
      } else if (this.fadeOutStart !== null && currentTime >= this.fadeOutStart + FADEOUT_DURATION) {
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
      <ThemeProvider theme={theme}>
        <div className="app">
          <div className="main-container">
            <Sidebar />
            {mode === MODE_FILEBROWSER && <FileBrowser />}
            {mode === MODE_VISUALIZER && <Visualizer />}
            {mode === MODE_RENDERER && <Renderer />}
          </div>
          <Player />
        </div>
      </ThemeProvider>
    );
  }
}
