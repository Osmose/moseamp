class MusicPlayerAudioWorklet extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
    const driver = Module();
    const MusicPlayer = driver.MusicPlayer;
    this.port.onmessage = (e) => {
      switch (e.data.type) {
        case 'open':
          try {
            MusicPlayer.loadPlugins('/build/musicplayer_data');
            this.musicPlayer = new MusicPlayer(e.data.filePath);
          } catch (err) {
            console.error(MusicPlayer.getExceptionMessage(err));
            throw err;
          }
          break;
        case 'free':
          this.musicPlayer.delete();
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

var self = {
  location: {
    href: 'file:///Users/osmose/Projects/moseamp/build/', // URL where the module was loaded from
  },
};
var window = {};

registerProcessor('music-player', MusicPlayerAudioWorklet);
