import autobind from 'autobind-decorator';
import React, { useRef } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';

import { getPlaying, getCurrentFilePath, getVolume } from 'moseamp/ducks/player';
import { getPlugin, getRenderModalVisible, setRenderModalVisible } from 'moseamp/ducks/visualizer';
import player from 'moseamp/player';
import Modal from 'moseamp/components/Modal';

export function RenderModal() {
  const dispatch = useDispatch();
  const renderModalVisible = useSelector(getRenderModalVisible);
  const plugin = useSelector(getPlugin);
  const currentFilePath = useSelector(getCurrentFilePath);
  const volume = useSelector(getVolume);

  const videoRef = useRef();

  const handleDismiss = () => {
    dispatch(setRenderModalVisible(false));
  };
  const handleClickStart = async () => {
    const blob = await plugin.render({
      filePath: currentFilePath,
      fps: 60,
      duration: 30,
      width: 1024,
      height: 768,
      volume,
    });
    const blobUrl = URL.createObjectURL(blob);
    videoRef.current.onloadedmetadata = () => {
      console.log('video metadata loaded')
      videoRef.current.play();
    };
    videoRef.current.src = blobUrl;
  };

  return (
    <Modal visible={renderModalVisible} onDismiss={handleDismiss}>
      <video ref={videoRef} width="1024" height="768" controls />
      <button onClick={handleClickStart}>Start Render</button>
    </Modal>
  );
}

export default
@connect(
  (state) => ({
    plugin: getPlugin(state),
    playing: getPlaying(state),
  }),
)
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
      ...(player.getAnalysis()),
      playing: this.props.playing,
    };

    if (canvasContainer && (canvasContainer.clientWidth !== canvas.width || canvasContainer.clientHeight !== canvas.height)) {
      canvas.width = canvasContainer.clientWidth;
      canvas.height = canvasContainer.clientHeight;
      this.props.plugin.onResize?.(canvas);
    }

    this.props.plugin.draw(canvas, analysis, ts);
    requestAnimationFrame(this.handleRequestAnimationFrame);
  }

  render() {
    return (
      <div className="visualizer" ref={(canvasContainer) => this.canvasContainer = canvasContainer}>
        <canvas className="visualizer-canvas" ref={this.setCanvas} />
      </div>
    );
  }
}
