import {extname} from 'path';
import remote from 'remote';

let dialog = remote.require('dialog');

import React from './js/lib/react.js';

import * as basePlugin from './js/plugins/base.js';
import {AudioPlayer, AudioFile} from './js/audio.js';
import {PlayerComponent} from './js/components.js';


// Required for Emscripten.
window.Module = {
    canvas: document.getElementById('emscripten')
};


let currentAudioFile = null;
let plugins = [basePlugin];
let audioPlayer = new AudioPlayer();
audioPlayer.volume = 0.2;


// Filters for the Open File dialog.
let openDialogFilters = [];
for (let plugin of plugins) {
    openDialogFilters.push({
        name: plugin.filetypeName,
        extensions: plugin.supportedExtensions,
    });
}


function loadPath(path) {
    let ext = extname(path).slice(1);
    let plugin = plugins.find((p) => p.supportedExtensions.indexOf(ext) !== -1);
    if (!plugin) {
        alert('Unsupported filetype');
    } else {
        plugin.createAudioFile(path).then((audioFile) => {
            audioFile.plugin = plugin;
            audioPlayer.load(audioFile);
            audioPlayer.play();
        });
    }
}


function openFile() {
    let paths = dialog.showOpenDialog({
        filters: openDialogFilters,
        properties: ['openFile'],
    });

    if (paths && paths.length > 0) {
        loadPath(paths[0]);
    }
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


// Let's get some React goin'
React.render(
    <PlayerComponent audioPlayer={audioPlayer}
                     onOpen={openFile}
                     onPause={pause}
                     onPlay={play}
                     onSeek={seek} />,
    document.getElementById('app')
);
