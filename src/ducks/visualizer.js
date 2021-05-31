import visualizerPlugins from 'moseamp/visualizers';

// == Actions

const SET_PLUGIN_ID = 'visualizer/SET_PLUGIN_ID';
const SET_RENDER_MODAL_VISIBLE = 'visualizer/SET_RENDER_MODAL_VISIBLE';

// == Reducer

function defaultState() {
  return {
    pluginId: visualizerPlugins[0].id,
    renderModalVisible: false,
  };
}

export default function reducer(visualizer = defaultState(), action = {}) {
  switch (action.type) {
    case SET_PLUGIN_ID:
      return {
        ...visualizer,
        pluginId: action.pluginId,
      };
    case SET_RENDER_MODAL_VISIBLE:
      return {
        ...visualizer,
        renderModalVisible: action.renderModalVisible,
      };
    default:
      return visualizer;
  }
}

// == Selectors

export function getPluginId(state) {
  return state.visualizer.pluginId;
}

export function getPlugin(state) {
  const pluginId = getPluginId(state);
  return visualizerPlugins.find(plugin => plugin.id === pluginId);
}
export function getRenderModalVisible(state) {
  return state.visualizer.renderModalVisible;
}

// == Action Creators

export function setPluginId(pluginId) {
  return {
    type: SET_PLUGIN_ID,
    pluginId,
  };
}

export function setRenderModalVisible(visible) {
  return {
    type: SET_RENDER_MODAL_VISIBLE,
    renderModalVisible: visible,
  };
}
