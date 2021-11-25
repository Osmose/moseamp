class MusicPlayerAudioWorklet extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
    this.port.onmessage = (e) => {
      switch (e.data.type) {
        case 'open':
          const { loadPlugins, MusicPlayer } = require(e.data.musicPlayerPath);
          loadPlugins(e.data.pluginPath);
          this.musicPlayer = new MusicPlayer(e.data.filePath);
          break;
        case 'free':
          this.musicPlayer.freePlayer();
          break;
        case 'seek':
          this.musicPlayer.seek(e.data.song);
          break;
      }
    };
  }

  process(inputs, outputs) {
    const [left, right] = outputs[0];
    const sampleCount = left.length;
    const samples = this.musicPlayer.play(sampleCount * 2);
    for (let k = 0; k < sampleCount; k++) {
      left[k] = samples[k * 2];
      right[k] = samples[k * 2 + 1];
    }

    return true;
  }
}

registerProcessor('music-player', MusicPlayerAudioWorklet);
