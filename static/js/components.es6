import React from './lib/react.js';

import {thenDispatch} from './dispatcher.js';


export class PlayerComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            song: null
        };
    }

    render() {
        return (
            <div className="player">
                <div className="song-icon-container">
                    <Icon song={this.state.song} />
                </div>
                <div className="metadata-controls">
                    <Metadata song={this.state.song} />
                    <Controls />
                </div>
            </div>
        );
    }
}


class Icon extends React.Component {
    render() {
        return (
            <img src="" className="song-icon" />
        );
    }
}


class Metadata extends React.Component {
    render() {
        return (
            <div className="metadata">

            </div>
        );
    }
}


class Controls extends React.Component {
    render() {
        return (
            <div className="controls">
                <button onClick={thenDispatch('openFile')}>Load</button>
                <button onClick={thenDispatch('pause')}>Pause</button>
            </div>
        );
    }
}
