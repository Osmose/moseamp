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
  getShuffle,
  setShuffle,
  loadPrevEntry,
  loadNextEntry,
  getLoop,
  setLoop,
  seek,
  getUseCustomDuration,
  getCustomDuration,
  setUseCustomDuration,
  setCustomDuration,
  progressToGain,
  gainToProgress,
} from 'moseamp/ducks/player';
import { getTypeForExt } from 'moseamp/filetypes';
import player, { DEFAULT_GAIN } from 'moseamp/player';
import Icon, { FontAwesome } from 'moseamp/components/Icon';
import Tooltip from 'moseamp/components/Tooltip';
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
  (state) => ({
    playing: getPlaying(state),
    currentSong: getCurrentSong(state),
    songCount: getSongCount(state),
    duration: getDuration(state),
    currentFilePath: getCurrentFilePath(state),
    currentTime: getCurrentTime(state),
  }),
  {
    seek,
  }
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
          {songCount > 1 ? (
            <button type="button" className="control-button" disabled={currentSong < 1} onClick={this.handleClickPrev}>
              <FontAwesome code="angle-left" />
            </button>
          ) : (
            <div className="spacer" />
          )}
          <ShuffleButton />
          <PrevButton />
          {playing ? <PauseButton /> : <PlayButton />}
          <NextButton />
          <LoopButton />
          {songCount > 1 ? (
            <button
              type="button"
              className="control-button"
              disabled={currentSong >= songCount - 1}
              onClick={this.handleClickNext}
            >
              <FontAwesome code="angle-right" />
            </button>
          ) : (
            <div className="spacer" />
          )}
        </div>
        <div className="seek-bar">
          <div className="current-time">{currentFilePath && formatDuration(currentTime)}</div>
          <SeekBar currentTime={currentTime} duration={duration} empty={!currentFilePath} playing={playing} />
          <SongDuration />
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

    const clickValue = Math.floor((event.nativeEvent.offsetX / event.target.offsetWidth) * duration);
    player.seek(null, clickValue);
  }

  render() {
    const { currentTime, duration, empty, playing } = this.props;
    const progressProps = {};
    if (empty) {
      progressProps.max = 1;
      progressProps.value = 0;
    } else if (duration !== Infinity) {
      progressProps.max = duration;
      progressProps.value = currentTime;
    }

    return (
      <progress className={`slider ${playing ? 'playing' : 'paused'}`} onClick={this.handleClick} {...progressProps} />
    );
  }
}

class HoverScroll extends React.Component {
  render() {
    return (
      <div className="hover-scroll">
        <div className="hover-scroll-parent">
          <div className="hover-scroll-child">{this.props.children}</div>
        </div>
      </div>
    );
  }
}

@connect((state) => ({
  currentTitle: getCurrentTitle(state),
  currentArtist: getCurrentArtist(state),
  currentFilePath: getCurrentFilePath(state),
  currentSong: getCurrentSong(state),
  songCount: getSongCount(state),
}))
class CurrentSong extends React.Component {
  render() {
    const { currentFilePath, currentTitle, currentArtist, currentSong, songCount } = this.props;
    const extension = currentFilePath && path.extname(currentFilePath);
    const fileType = getTypeForExt(extension);
    return (
      <div className="current-song">
        {fileType && <Icon iconId={fileType.id} size={32} className="song-icon" />}
        <div className="current-song-title">
          <HoverScroll>
            {songCount > 1 && `Track ${currentSong + 1} / ${songCount} - `}
            {currentTitle}
          </HoverScroll>
        </div>
        <div className="current-song-artist">
          <HoverScroll>{currentArtist}</HoverScroll>
        </div>
      </div>
    );
  }
}

@connect(
  (state) => ({
    currentFilePath: getCurrentFilePath(state),
  }),
  { play }
)
@autobind
class PlayButton extends React.Component {
  handleClick() {
    this.props.play();
  }

  render() {
    const { currentFilePath } = this.props;
    let className = 'control-button primary';
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
      <button type="button" className="control-button primary" onClick={this.handleClick}>
        <FontAwesome code="pause" />
      </button>
    );
  }
}

@connect(null, { loadPrevEntry })
@autobind
class PrevButton extends React.Component {
  handleClick() {
    this.props.loadPrevEntry();
  }

  render() {
    return (
      <button type="button" className="control-button" onClick={this.handleClick}>
        <FontAwesome code="step-backward" />
      </button>
    );
  }
}

@connect(null, { loadNextEntry })
@autobind
class NextButton extends React.Component {
  handleClick() {
    this.props.loadNextEntry();
  }

  render() {
    return (
      <button type="button" className="control-button" onClick={this.handleClick}>
        <FontAwesome code="step-forward" />
      </button>
    );
  }
}

@connect(
  (state) => ({
    shuffle: getShuffle(state),
  }),
  { setShuffle }
)
@autobind
class ShuffleButton extends React.Component {
  handleClick() {
    this.props.setShuffle(!this.props.shuffle);
  }

  render() {
    const { shuffle } = this.props;
    return (
      <button type="button" className={`control-button ${shuffle ? 'on' : 'off'}`} onClick={this.handleClick}>
        <FontAwesome code="random" />
      </button>
    );
  }
}

@connect(
  (state) => ({
    loop: getLoop(state),
  }),
  { setLoop }
)
@autobind
class LoopButton extends React.Component {
  handleClick() {
    this.props.setLoop(!this.props.loop);
  }

  render() {
    const { loop } = this.props;
    return (
      <button type="button" className={`control-button loop ${loop ? 'on' : 'off'}`} onClick={this.handleClick}>
        <FontAwesome code="retweet" />
        <span>1</span>
      </button>
    );
  }
}

@connect(
  (state) => ({
    duration: getDuration(state),
    currentFilePath: getCurrentFilePath(state),
    useCustomDuration: getUseCustomDuration(state),
    customDuration: getCustomDuration(state),
  }),
  {
    setUseCustomDuration,
    setCustomDuration,
  }
)
@autobind
class SongDuration extends React.Component {
  constructor(props) {
    super(props);
    this.durationElement = null;
    this.state = {
      viewingTooltip: false,
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside(event) {
    if (!this.durationElement.contains(event.target)) {
      this.setState({ viewingTooltip: false });
    }
  }

  handleUseCustomDurationChange(event) {
    this.props.setUseCustomDuration(event.target.value !== 'infinite');
  }

  handleCustomDurationChange(event) {
    this.props.setCustomDuration(event.target.value);
  }

  showTooltip() {
    this.setState({ viewingTooltip: true });
  }

  render() {
    const { currentFilePath, useCustomDuration, customDuration, duration } = this.props;
    const { viewingTooltip } = this.state;
    return (
      <div
        className={`duration ${duration === Infinity ? 'infinite' : ''}`}
        ref={(durationElement) => {
          this.durationElement = durationElement;
        }}
      >
        {currentFilePath && (
          <>
            <span className={duration === Infinity ? 'customizable-duration' : ''} onClick={this.showTooltip}>
              {formatDuration(duration)}
            </span>
            <Tooltip visible={viewingTooltip} position="top">
              <form className="custom-duration-form">
                <h3>Play until:</h3>
                <label>
                  <input
                    type="radio"
                    name="use-custom-duration"
                    value="infinite"
                    checked={!useCustomDuration}
                    onChange={this.handleUseCustomDurationChange}
                  />
                  Never stop
                </label>
                <label>
                  <input
                    type="radio"
                    name="use-custom-duration"
                    value="custom"
                    checked={useCustomDuration}
                    onChange={this.handleUseCustomDurationChange}
                  />
                  <input
                    type="text"
                    disabled={!useCustomDuration}
                    value={customDuration}
                    onChange={this.handleCustomDurationChange}
                    pattern="((\d?\d:)?\d)?\d:\d\d"
                    placeholder="e.g. 1:00"
                  />
                </label>
              </form>
            </Tooltip>
          </>
        )}
      </div>
    );
  }
}

@connect(
  (state) => ({
    volume: getVolume(state),
  }),
  { setVolume }
)
@autobind
class VolumeControls extends React.Component {
  handleClick(event) {
    const relativeClickX = event.nativeEvent.offsetX / event.target.offsetWidth;
    const gain = progressToGain(relativeClickX);
    this.props.setVolume(gain);
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
        <progress className="slider" max={1} value={gainToProgress(volume)} onClick={this.handleClick} />
      </div>
    );
  }
}
