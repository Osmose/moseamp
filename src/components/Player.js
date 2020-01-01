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
  getDuration,
  seek,
} from 'moseamp/ducks/player';
import { DEFAULT_GAIN } from 'moseamp/player';
import { formatDuration } from 'moseamp/utils';
import Icon from 'moseamp/components/Icon';

export default class Player extends React.Component {
  render() {
    return (
      <div className="player-bar">
        <PlayingEntryInfo />
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
  }),
)
@autobind
class PlayerControls extends React.Component {
  handleChangeTime(time) {
    seek(time);
  }

  render() {
    const { playing, currentTime, duration } = this.props;
    return (
      <div className="player-controls">
        {playing
          ? <PauseButton />
          : <PlayButton />
        }
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
    currentFilePath: getCurrentFilePath(state),
  }),
)
class PlayingEntryInfo extends React.Component {
  render() {
    const { currentFilePath } = this.props;
    return (
      <div className="player-info">
        <div className="player-info-title">
          {currentFilePath || '---'}
        </div>
        <div className="player-info-artist" />
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
      <a className={className} onClick={this.handleClick}>
        <Icon name="play" />
      </a>
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
      <button className="control-button" onClick={this.handleClick}>
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
