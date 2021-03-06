import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { setPref, LOAD_PREFS } from 'moseamp/ducks/prefs';
import { rendererPlugins } from 'moseamp/visualizers';
import { asyncExec } from 'moseamp/utils';
import { DEFAULT_RENDERER_SETTINGS } from 'moseamp/constants';

export const checkFFmpegInPath = createAsyncThunk('renderer/checkFFmpegInPath', async () => {
  const { error } = await asyncExec('ffmpeg -version');
  return error === null;
});

const rendererSlice = createSlice({
  name: 'renderer',
  initialState: {
    selectedPluginId: rendererPlugins[0].id,
    ffmpegInPath: false,
    settings: {},
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
  return { ...DEFAULT_RENDERER_SETTINGS, ...state.renderer.settings };
}

export function getFFmpegInPath(state) {
  return state.renderer.ffmpegInPath;
}

export const { setSelectedPluginId, setRenderLength, setRendererSetting } = rendererSlice.actions;
export default rendererSlice.reducer;
