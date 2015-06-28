import ipc from 'ipc';

import $ from './lib/jquery.js';
import moment from './lib/moment.js';
import React from './lib/react.js';

import {secondsToTime} from './util.js';


export class PlayerComponent extends React.Component {
    constructor(props) {
        super(props);

        let audioPlayer = props.audioPlayer;
        this.state = {
            audioFile: null,
            currentTime: 0,
            playerState: audioPlayer.paused,
            currentPlugin: null,
        };

        audioPlayer.on('playback', (audioPlayer) => {
            this.setState({
                audioFile: audioPlayer.currentAudioFile,
                currentTime: audioPlayer.currentTime
            });
        });

        audioPlayer.on('stateChanged', (audioPlayer) => {
            this.setState({
                playerState: audioPlayer.state,
                currentTime: audioPlayer.currentTime
            });
        });
    }

    render() {
        let pluginUI = null;
        if (this.state.currentPlugin) {
            let PluginComponent = this.state.currentPlugin.PluginComponent;
            if (PluginComponent) {
                pluginUI = (
                    <PluginComponent audioFile={this.state.audioFile}
                                     plugin={this.state.currentPlugin} />
                );
                ipc.send('addPluginHeight', PluginComponent.height);
            }
        }

        if (!pluginUI) {
            ipc.send('removePluginHeight');
        }

        return (
            <div className="player">
                <div className="audiofile-info-controls">
                    <AudioFileInfo audioFile={this.state.audioFile}
                                   currentTime={this.state.currentTime}
                                   onSeek={this.props.onSeek} />
                    <Controls playerState={this.state.playerState}
                              onOpen={this.props.onOpen}
                              onPause={this.props.onPause}
                              onPlay={this.props.onPlay} />
                </div>
                {pluginUI}
            </div>
        );
    }
}


class AudioFileInfo extends React.Component {
    render() {
        let audioFile = this.props.audioFile;
        if (!audioFile) {
            return <div className="audiofile-info" />;
        }

        return (
            <div className="audiofile-info">
                <h2 className="name">
                    <span className="info-line-wrapper">
                        <span className="info-line">
                            {audioFile ? audioFile.title : null}
                        </span>
                    </span>
                </h2>
                <h3 className="artist-album">
                    <span className="info-line-wrapper">
                        <span className="info-line">
                            {audioFile ? `${audioFile.artist} / ${audioFile.album}` : null}
                        </span>
                    </span>
                </h3>
                <ProgressBar currentTime={this.props.currentTime}
                             duration={this.props.audioFile.duration}
                             onSeek={this.props.onSeek} />
            </div>
        );
    }
}


class ProgressBar extends React.Component {
    render() {
        let currentTime = this.props.currentTime;
        let duration = this.props.duration;
        let barWidth = (this.disabled
            ? '100%'
            : `${Math.round((currentTime / duration) * 100)}%`);

        return (
            <div className={`progress-bar ${this.disabled ? 'disabled' : null}`}>
                <span className="bar" ref="bar" onClick={this.handleSeek.bind(this)}>
                    <span className="filled" style={{width: barWidth}} />
                </span>
                <span className="time">
                  {this.disabled
                    ? secondsToTime(currentTime)
                    : `${secondsToTime(currentTime)} / ${secondsToTime(duration)}`}
                </span>
            </div>
        );
    }

    get disabled() {
        let duration = this.props.duration;
        return duration === null || duration <= 0;
    }

    handleSeek(event) {
        if (this.disabled) {
            return;
        }

        let $bar = $(React.findDOMNode(this.refs.bar));
        let relativeMouseX = event.pageX - $bar.offset().left;
        let percentage = relativeMouseX / $bar.width();
        this.props.onSeek(percentage);
    }
}


class Controls extends React.Component {
    render() {
        return (
            <div className="controls">
                <button className="button" onClick={this.handlePlayPause.bind(this)}>
                    {this.props.playerState == 'playing'
                        ? <FontAwesome name="pause" />
                        : <FontAwesome name="play" />}
                </button>
                <button className="button" onClick={this.props.onOpen}>
                    <FontAwesome name="folder-open" />
                </button>
            </div>
        );
    }

    handlePlayPause() {
        if (this.props.playerState == 'playing') {
            this.props.onPause();
        } else {
            this.props.onPlay();
        }
    }
}


export class FontAwesome extends React.Component {
    render() {
        return (
            <span className={`fa fa-${this.props.name}`} />
        );
    }
}


export class PluginContainer extends React.Component {
    render() {
        return (
            <div className="plugin-container">
                <div className="plugin-title-bar">
                    <span className="plugin-title">{this.props.name}</span>
                </div>
                <div className={this.props.className}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
