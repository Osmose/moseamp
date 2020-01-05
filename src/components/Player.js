import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import ReactSlider from 'react-slider';

import {
  play,
  pause,
  getPlaying,
  getCurrentFilePath,
  getVolume,
  setVolume,
  getCurrentTime,
  getCurrentArtist,
  getCurrentTitle,
  getDuration,
  getSongCount,
  getCurrentSong,
  seek,
  setCurrentSong,
} from 'moseamp/ducks/player';
import { EXTENSIONS_ICONS } from 'moseamp/filetypes';
import { DEFAULT_GAIN } from 'moseamp/player';
import { formatDuration } from 'moseamp/utils';
import Icon from 'moseamp/components/Icon';

export default class Player extends React.Component {
  render() {
    return (
      <div className="player-bar">
        <CurrentSong />
        <PlayerControls />
        <VolumeControls />
      </div>
    );
  }
}

@connect(
  state => ({
    playing: getPlaying(state),
    currentTime: getCurrentTime(state),
    duration: getDuration(state),
    currentSong: getCurrentSong(state),
    songCount: getSongCount(state),
  }),
  {
    setCurrentSong,
  },
)
@autobind
class PlayerControls extends React.Component {
  handleChangeTime(time) {
    seek(time);
  }

  handleClickPrev() {
    this.props.setCurrentSong(this.props.currentSong - 1);
  }

  handleClickNext() {
    this.props.setCurrentSong(this.props.currentSong + 1);
  }


  render() {
    const { playing, currentTime, duration, currentSong, songCount } = this.props;
    return (
      <div className="player-controls">
        <div className="player-controls-buttons">
          {songCount > 0 && (
            <button
              type="button"
              className="control-button"
              disabled={currentSong < 1}
              onClick={this.handleClickPrev}
            >
              <Icon name="angle-left" />
            </button>
          )}
          {
            playing
              ? <PauseButton />
              : <PlayButton />
          }
          {songCount > 0 && (
            <button
              type="button"
              className="control-button"
              disabled={currentSong >= songCount - 1}
              onClick={this.handleClickNext}
            >
              <Icon name="angle-right" />
            </button>
          )}
        </div>
        <div className="seek-bar">
          <div className="current-time">
            {currentTime && formatDuration(currentTime)}
          </div>
          <ReactSlider
            disabled={duration === null}
            min={0}
            max={duration !== null ? Math.floor(duration) : 1}
            step={1}
            value={currentTime !== null ? Math.floor(currentTime) : 1}
            withBars={duration !== null}
            onChange={this.handleChangeTime}
          />
          <div className="duration">
            {duration && formatDuration(duration)}
          </div>
        </div>
      </div>
    );
  }
}

@connect(
  state => ({
    currentTitle: getCurrentTitle(state),
    currentArtist: getCurrentArtist(state),
    currentFilePath: getCurrentFilePath(state),
    currentSong: getCurrentSong(state),
    songCount: getSongCount(state),
  }),
)
class CurrentSong extends React.Component {
  render() {
    const { currentFilePath, currentTitle, currentArtist, currentSong, songCount } = this.props;
    const extension = currentFilePath && path.extname(currentFilePath);
    return (
      <div className="current-song">
        <div className="current-song-title">
          {extension && <img src={EXTENSIONS_ICONS[extension]} className="image-icon" />}
          {songCount > 0 && `Track ${currentSong + 1} / ${songCount} - `}
          {currentTitle}
        </div>
        <div className="current-song-artist">
          {currentArtist}
        </div>
      </div>
    );
  }
}

@connect(
  state => ({
    currentFilePath: getCurrentFilePath(state),
  }),
  { play },
)
@autobind
class PlayButton extends React.Component {
  handleClick() {
    this.props.play();
  }

  render() {
    const { currentFilePath } = this.props;
    let className = 'control-button';
    if (!currentFilePath) {
      className += ' disabled';
    }

    return (
      <button type="button" className={className} onClick={this.handleClick}>
        <Icon name="play" />
      </button>
    );
  }
}

@connect(null, { pause })
@autobind
class PauseButton extends React.Component {
  handleClick() {
    this.props.pause();
  }

  render() {
    return (
      <button type="button" className="control-button" onClick={this.handleClick}>
        <Icon name="pause" />
      </button>
    );
  }
}

@connect(
  state => ({
    volume: getVolume(state),
  }),
  { setVolume },
)
@autobind
class VolumeControls extends React.Component {
  handleChange(value) {
    this.props.setVolume(value);
  }

  render() {
    const { volume } = this.props;
    let iconName = 'volume-up';
    if (volume <= 0) {
      iconName = 'volume-off';
    } else if (volume < DEFAULT_GAIN) {
      iconName = 'volume-down';
    }

    return (
      <div className="player-volume-container">
        <Icon name={iconName} className="volume-icon" />
        <ReactSlider
          min={0}
          max={DEFAULT_GAIN * 2}
          step={0.1}
          value={volume}
          onChange={this.handleChange}
          withBars
        />
      </div>
    );
  }
}
