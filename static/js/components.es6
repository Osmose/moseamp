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
        let barWidth = `${Math.round((currentTime / duration) * 100)}%`;

        return (
            <div className="progress-bar">
                <span className="bar" ref="bar" onClick={this.handleSeek.bind(this)}>
                    <span className="filled" style={{width: barWidth}} />
                </span>
                <span className="time">
                  {secondsToTime(currentTime)} / {secondsToTime(duration)}
                </span>
            </div>
        );
    }

    handleSeek(event) {
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


class FontAwesome extends React.Component {
    render() {
        return (
            <span className={`fa fa-${this.props.name}`} />
        );
    }
}
