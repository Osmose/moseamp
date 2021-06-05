import signal from 'moseamp/visualizers/signal';
import frequency from 'moseamp/visualizers/frequency';
import nes from 'moseamp/visualizers/nes';

const visualizerPlugins = [signal, frequency, nes];

export default visualizerPlugins;
export const rendererPlugins = visualizerPlugins.filter((plugin) => plugin.canRender);
