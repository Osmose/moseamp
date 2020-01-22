import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import {
  play,
  pause,
  getPlaying,
  getCurrentFilePath,
  getVolume,
  setVolume,
  getCurrentArtist,
  getCurrentTitle,
  getSongCount,
  getCurrentSong,
  getDuration,
  getCurrentTime,
  seek,
} from 'moseamp/ducks/player';
import { EXTENSIONS_ICONS } from 'moseamp/filetypes';
import player, { DEFAULT_GAIN } from 'moseamp/player';
import { FontAwesome } from 'moseamp/components/Icon';
import { formatDuration } from 'moseamp/utils';

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
    currentSong: getCurrentSong(state),
    songCount: getSongCount(state),
    duration: getDuration(state),
    currentFilePath: getCurrentFilePath(state),
    currentTime: getCurrentTime(state),
  }),
  {
    seek,
  },
)
@autobind
class PlayerControls extends React.Component {
  handleClickPrev() {
    this.props.seek(this.props.currentSong - 1);
  }

  handleClickNext() {
    this.props.seek(this.props.currentSong + 1);
  }

  render() {
    const { playing, currentSong, songCount, duration, currentFilePath, currentTime } = this.props;
    return (
      <div className="player-controls">
        <div className="player-controls-buttons">
          {songCount > 1 && (
            <button
              type="button"
              className="control-button"
              disabled={currentSong < 1}
              onClick={this.handleClickPrev}
            >
              <FontAwesome code="angle-left" />
            </button>
          )}
          {
            playing
              ? <PauseButton />
              : <PlayButton />
          }
          {songCount > 1 && (
            <button
              type="button"
              className="control-button"
              disabled={currentSong >= songCount - 1}
              onClick={this.handleClickNext}
            >
              <FontAwesome code="angle-right" />
            </button>
          )}
        </div>
        <div className="seek-bar">
          <div className="current-time">
            {currentFilePath && formatDuration(currentTime)}
          </div>
          <SeekBar currentTime={currentTime} duration={duration} empty={!currentFilePath} />
          <div className="duration">
            {currentFilePath && formatDuration(duration)}
          </div>
        </div>
      </div>
    );
  }
}

@autobind
class SeekBar extends React.Component {
  handleClick(event) {
    const { duration, empty } = this.props;
    if (empty || duration === Infinity) {
      return;
    }

    const clickValue = Math.floor(
      (event.nativeEvent.offsetX / event.target.offsetWidth) * duration,
    );
    player.seek(null, clickValue);
  }

  render() {
    const { currentTime, duration, empty } = this.props;
    const progressProps = {};
    if (empty) {
      progressProps.max = 1;
      progressProps.value = 0;
    } else if (duration !== Infinity) {
      progressProps.max = duration;
      progressProps.value = currentTime;
    }

    return (
      <progress className="slider" onClick={this.handleClick} {...progressProps} />
    );
  }
}

class HoverScroll extends React.Component {
  render() {
    return (
      <div className="hover-scroll">
        <div className="hover-scroll-parent">
          <div className="hover-scroll-child">
            {this.props.children}
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
          <HoverScroll>
            {extension && <img src={EXTENSIONS_ICONS[extension]} className="image-icon" />}
            {songCount > 1 && `Track ${currentSong + 1} / ${songCount} - `}
            {currentTitle}
          </HoverScroll>
        </div>
        <div className="current-song-artist">
          <HoverScroll>
            {currentArtist}
          </HoverScroll>
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
        <FontAwesome code="play" />
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
        <FontAwesome code="pause" />
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
  handleClick(event) {
    const clickValue = (event.nativeEvent.offsetX / event.target.offsetWidth) * (DEFAULT_GAIN * 2);
    this.props.setVolume(clickValue);
  }

  render() {
    const { volume } = this.props;
    let iconCode = 'volume-up';
    if (volume <= 0) {
      iconCode = 'volume-off';
    } else if (volume < DEFAULT_GAIN) {
      iconCode = 'volume-down';
    }

    return (
      <div className="player-volume-container">
        <FontAwesome code={iconCode} className="volume-icon" />
        <progress
          className="slider"
          min={0}
          max={DEFAULT_GAIN * 2}
          value={volume}
          onClick={this.handleClick}
        />
      </div>
    );
  }
}
