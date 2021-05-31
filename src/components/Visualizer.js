import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import { getPlaying } from 'moseamp/ducks/player';
import { getPlugin } from 'moseamp/ducks/visualizer';
import player from 'moseamp/player';

export default
@connect((state) => ({
  plugin: getPlugin(state),
  playing: getPlaying(state),
}))
@autobind
class Visualizer extends React.Component {
  constructor(props) {
    super(props);
    this.canvasContainer = null;
    this.canvas = null;
    this.animating = false;
  }

  setCanvas(canvas) {
    if (!canvas) {
      return;
    }

    this.animating = true;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.props.plugin.onMount?.(canvas);
    requestAnimationFrame(this.handleRequestAnimationFrame);
  }

  componentWillUnmount() {
    const { plugin } = this.props;
    plugin.onUnmount?.();
    this.animating = false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.plugin !== this.props.plugin) {
      prevProps.plugin.onUnmount?.();
      this.props.plugin.onMount?.(this.canvas);
    }
  }

  handleRequestAnimationFrame(ts) {
    if (!this.animating) {
      return;
    }

    const { canvas, canvasContainer } = this;
    const analysis = {
      ...player.getAnalysis(),
      playing: this.props.playing,
    };

    if (
      canvasContainer &&
      (canvasContainer.clientWidth !== canvas.width || canvasContainer.clientHeight !== canvas.height)
    ) {
      canvas.width = canvasContainer.clientWidth;
      canvas.height = canvasContainer.clientHeight;
      this.props.plugin.onResize?.(canvas);
    }

    this.props.plugin.draw(canvas, analysis, ts);
    requestAnimationFrame(this.handleRequestAnimationFrame);
  }

  render() {
    return (
      <div className="visualizer" ref={(canvasContainer) => (this.canvasContainer = canvasContainer)}>
        <canvas className="visualizer-canvas" ref={this.setCanvas} />
      </div>
    );
  }
}
