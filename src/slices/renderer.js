import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';
import { rendererPlugins } from 'moseamp/visualizers';
import { asyncExec } from 'moseamp/utils';

export const checkFFmpegInPath = createAsyncThunk('renderer/checkFFmpegInPath', async () => {
  const subprocess = await asyncExec('ffmpeg -version');
  return subprocess.exitCode === 0;
});

const rendererSlice = createSlice({
  name: 'renderer',
  initialState: {
    selectedPluginId: rendererPlugins[0].id,
    ffmpegInPath: false,
    settings: {
      renderLength: 30,
      fps: 60,
      width: 1024,
      height: 768,
      ffmpegPath: '',
    },
  },
  reducers: {
    setSelectedPluginId(state, action) {
      state.selectedPluginId = action.payload;
    },
    setRendererSetting: {
      prepare(name, value) {
        return {
          payload: { name, value },
        };
      },
      reducer(state, action) {
        state.settings[action.payload.name] = action.payload.value;
        setPref('rendererSettings', state.settings);
      },
    },
  },
  extraReducers(builder) {
    builder
      .addCase(LOAD_PREFS, (state, { prefs }) => {
        Object.assign(state.settings, prefs.rendererSettings);
      })
      .addCase(checkFFmpegInPath.fulfilled, (state, action) => {
        state.ffmpegInPath = action.payload;
      });
  },
});

export function getSelectedPluginId(state) {
  return state.renderer.selectedPluginId;
}

export function getSelectedPlugin(state) {
  const selectedPluginId = getSelectedPluginId(state);
  return rendererPlugins.find((plugin) => plugin.id === selectedPluginId);
}

export function getRendererSettings(state) {
  return state.renderer.settings;
}

export function getFFmpegInPath(state) {
  return state.renderer.ffmpegInPath;
}

export const { setSelectedPluginId, setRenderLength, setRendererSetting } = rendererSlice.actions;
export default rendererSlice.reducer;
