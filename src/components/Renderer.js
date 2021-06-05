import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ipcRenderer } from 'electron';

import { getCurrentFilePath, getVolume, getCurrentSong } from 'moseamp/ducks/player';
import {
  getSelectedPlugin,
  getRendererSettings,
  setRendererSetting,
  checkFFmpegInPath,
  getFFmpegInPath,
} from 'moseamp/slices/renderer';

const RendererContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const RenderMain = styled.div`
  flex: 1;
`;

const RenderControls = styled.div`
  flex: 0 0 85px;
`;

const SettingLabel = styled.label`
  display: block;
`;

function SettingInput({ name, ...props }) {
  const dispatch = useDispatch();
  const settings = useSelector(getRendererSettings);
  return (
    <input
      value={settings[name]}
      onChange={(event) => dispatch(setRendererSetting(name, event.target.value))}
      {...props}
    />
  );
}

function FFmpegSettings() {
  const ffmpegInPath = useSelector(getFFmpegInPath);
  return (
    <div>
      {ffmpegInPath ? (
        <p>FFmpeg was found in your PATH.</p>
      ) : (
        <SettingLabel>
          FFmpeg could not be found automatically, enter the path to the executable:
          <SettingInput type="file" name="ffmpegPath" />
        </SettingLabel>
      )}
    </div>
  );
}

function Settings() {
  return (
    <div>
      <SettingLabel>
        Video length (seconds) <SettingInput type="number" name="renderLength" />
      </SettingLabel>
      <SettingLabel>
        Framerate (FPS) <SettingInput type="number" name="fps" />
      </SettingLabel>
      <SettingLabel>
        Width (px) <SettingInput type="number" name="width" />
      </SettingLabel>
      <SettingLabel>
        Height (px) <SettingInput type="number" name="height" />
      </SettingLabel>
      <FFmpegSettings />
    </div>
  );
}

export default function Renderer() {
  const plugin = useSelector(getSelectedPlugin);
  const currentFilePath = useSelector(getCurrentFilePath);
  const currentSong = useSelector(getCurrentSong);
  const volume = useSelector(getVolume);
  const settings = useSelector(getRendererSettings);
  const ffmpegInPath = useSelector(getFFmpegInPath);
  const dispatch = useDispatch();

  const [isRendering, setIsRendering] = useState(false);
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [framesToRender, setFramesToRender] = useState(0);

  const handleClickStart = async () => {
    const { cancelled, filePath: outputPath } = await ipcRenderer.invoke('getRenderSavePath', 'render.mkv');
    if (cancelled) {
      return;
    }

    setIsRendering(true);
    setFramesToRender(settings.fps * settings.renderLength);

    const ffmpegPath = ffmpegInPath ? 'ffmpeg' : settings.ffmpegPath;
    await plugin.render({
      filePath: currentFilePath,
      song: currentSong,
      outputPath,
      fps: settings.fps,
      duration: settings.renderLength,
      width: settings.width,
      height: settings.height,
      ffmpegPath,
      volume,
      onRenderFrame({ frameIndex }) {
        setRenderedFrames(frameIndex);
      },
    });
    setIsRendering(false);
  };

  useEffect(() => {
    dispatch(checkFFmpegInPath());
  }, [dispatch]);

  // Rendering
  if (isRendering) {
    return (
      <RendererContainer>
        <RenderMain>
          <Settings />
        </RenderMain>
        <RenderControls>
          <progress className="slider" value={renderedFrames} max={framesToRender} />
        </RenderControls>
      </RendererContainer>
    );
  }

  return (
    <RendererContainer>
      <RenderMain>
        <Settings />
      </RenderMain>
      <RenderControls>
        <button onClick={handleClickStart}>Start render</button>
      </RenderControls>
    </RendererContainer>
  );
}
