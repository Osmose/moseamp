import { createSlice } from '@reduxjs/toolkit'

import visualizerPlugins from 'moseamp/visualizers';

const rendererPlugins = visualizerPlugins.filter(plugin => plugin.canRender);

const rendererSlice = createSlice({
  name: 'renderer',
  initialState: {
    selectedPluginId: rendererPlugins[0].id,
  },
  reducers: {
    setSelectedPluginId(state, action) {
      state.selectedPluginId = action.payload;
    },
  },
})

export function getSelectedPluginId(state) {
  return state.renderer.selectedPluginId;
}

export function getSelectedPlugin(state) {
  return rendererPlugins[getSelectedPluginId(state)];
}

export const { setSelectedPluginId } = rendererSlice.actions;
export default rendererSlice.reducer;
