export const ORIENTATION = {
  LEFT_TO_RIGHT: 'left_to_right',
  RIGHT_TO_LEFT: 'right_to_left',
  TOP_TO_BOTTOM: 'top_to_bottom',
  BOTTOM_TO_TOP: 'bottom_to_top',
};

export const FFMPEG_PRESETS = {
  h264mkv: {
    extension: 'mkv',
    args: '-c:v h264 -c:a aac',
  },
  vp8webm: {
    extension: 'webm',
    args: '-c:v libvpx -crf 10 -b:v 1M -c:a libvorbis -auto-alt-ref 0',
  },
};

export const DEFAULT_RENDERER_SETTINGS = {
  renderLength: 30,
  fps: 60,
  width: 1024,
  height: 768,
  ffmpegPath: '',
  ffmpegPreset: 'h264mkv',

  sliceUnits: 175,
  orientation: ORIENTATION.LEFT_TO_RIGHT,

  whiteKeyColor: '#fff',
  blackKeyColor: '#000',
  backgroundColor: 'hsl(0, 0%, 15%)',

  square1Color: 'hsl(217, 64%, 60%)',
  square2Color: 'hsl(167, 64%, 60%)',
  triangleColor: 'hsl(27, 48%, 60%)',
  noiseColor: 'hsl(230, 0%, 90%)',
  dpcmColor: 'hsl(230, 0%, 60%)',

  vrc6Square1Color: 'hsl(247, 64%, 60%)',
  vrc6Square2Color: 'hsl(197, 64%, 60%)',
  vrc6SawColor: 'hsl(117, 64%, 60%)',
};
