import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getCurrentFilePath, getVolume } from 'moseamp/ducks/player';
import { getPlugin } from 'moseamp/ducks/visualizer';

export default function Renderer() {
  const plugin = useSelector(getPlugin);
  const currentFilePath = useSelector(getCurrentFilePath);
  const volume = useSelector(getVolume);

  const videoRef = useRef();
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [framesToRender, setFramesToRender] = useState(0);

  const handleClickStart = async () => {
    setFramesToRender(60 * 30);
    const blob = await plugin.render({
      filePath: currentFilePath,
      fps: 60,
      duration: 30,
      width: 1024,
      height: 768,
      volume,
      onRenderFrame({ frameIndex }) {
        setRenderedFrames(frameIndex);
      },
    });
    const blobUrl = URL.createObjectURL(blob);
    videoRef.current.onloadedmetadata = () => {
      console.log('video metadata loaded');
      videoRef.current.play();
    };
    videoRef.current.src = blobUrl;
  };

  return (
    <div className="renderer">
      <video ref={videoRef} width="1024" height="768" controls />
      <button onClick={handleClickStart}>Start Render</button>
      <progress value={renderedFrames} max={framesToRender} />
    </div>
  );
}
