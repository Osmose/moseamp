import {extname} from 'path';

import ipc from 'ipc';
import remote from 'remote';
let dialog = remote.require('dialog');

import React from 'moseamp/lib/react';

import {AudioPlayer} from 'moseamp/audio';
import {PlayerComponent} from 'moseamp/components';
import * as config from 'moseamp/config';
import {getAudioFileForExtension, getOpenDialogFilters} from 'moseamp/formats';
import * as packages from 'moseamp/packages';


let audioPlayer = null;


function loadPath(path) {
    let ext = extname(path).slice(1).toLowerCase();
    let AudioFile = getAudioFileForExtension(ext);
    if (!AudioFile) {
        alert('Unsupported filetype');
    } else {
        let audioFile = new AudioFile(path);
        audioPlayer.load(audioFile);
        audioPlayer.play();
    }
}

function openFile() {
    dialog.showOpenDialog({
        filters: getOpenDialogFilters(),
        properties: ['openFile'],
    }, (paths) => {
        if (paths && paths.length > 0) {
            loadPath(paths[0]);
        }
    });
}


function play() {
    audioPlayer.play();
}


function pause() {
    audioPlayer.pause();
}


function seek(percentage) {
    audioPlayer.currentTime = audioPlayer.currentAudioFile.duration * percentage;
}


ipc.on('play_pause', () => {
    audioPlayer.play_pause();
});


/**
 * Initialize the app itself. Should only ever be called once.
 */
export function start() {
    // audioPlayer handles the Web Audio API.
    audioPlayer = new AudioPlayer();
    audioPlayer.volume = 0.2;

    // Load configuration and packages.
    config.load();
    packages.load();

    // Let's get some React goin'
    React.render(
        <PlayerComponent audioPlayer={audioPlayer}
                         onOpen={openFile}
                         onPause={pause}
                         onPlay={play}
                         onSeek={seek} />,
        document.querySelector('#app')
    );

    // Observe when the player dom element changes and resize when it happens.
    let playerNode = document.querySelector('#app > .player');
    new MutationObserver(resizeWindow.bind(null, playerNode)).observe(playerNode, {
        childList: true
    });
}


function resizeWindow(playerNode) {
    ipc.send('resizeHeight', playerNode.offsetHeight);
}
