import visualizerPlugins from 'moseamp/visualizers';

// == Actions

const SET_PLUGIN_ID = 'visualizer/SET_PLUGIN_ID';

// == Reducer

function defaultState() {
  return {
    pluginId: visualizerPlugins[0].id,
  };
}

export default function reducer(visualizer = defaultState(), action = {}) {
  switch (action.type) {
    case SET_PLUGIN_ID:
      return {
        ...visualizer,
        pluginId: action.pluginId,
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

// == Action Creators

export function setPluginId(pluginId) {
  return {
    type: SET_PLUGIN_ID,
    pluginId,
  };
}
