import {extname} from 'path';
import remote from 'remote';

let dialog = remote.require('dialog');

import React from './js/lib/react.js';

import * as dispatcher from './js/dispatcher.js';
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


function loadFile(path) {
    let ext = extname(path).slice(1);
    let plugin = plugins.find((p) => p.supportedExtensions.indexOf(ext) !== -1);
    if (!plugin) {
        alert('Unsupported filetype');
    } else {
        let audioFile = plugin.createAudioFile(path);
        plugin.createAudioNode(audioPlayer.ctx, audioFile)
            .then((sourceNode) => {
                audioPlayer.load(sourceNode);
                audioPlayer.play();
            });
    }
}


dispatcher.register('openFile', () => {
    let paths = dialog.showOpenDialog({
        filters: openDialogFilters,
        properties: ['openFile'],
    });

    if (paths.length > 0) {
        loadFile(paths[0]);
    }
});

dispatcher.register('pause', () => {
    audioPlayer.paused = !audioPlayer.paused;
});


// Let's get some React goin'
React.render(
    <PlayerComponent />,
    document.getElementById('app')
);
