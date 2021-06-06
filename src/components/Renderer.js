import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';
import { ipcRenderer } from 'electron';
import { SketchPicker } from 'react-color';

import { getCurrentFilePath, getVolume, getCurrentSong } from 'moseamp/ducks/player';
import {
  getSelectedPlugin,
  getRendererSettings,
  setRendererSetting,
  checkFFmpegInPath,
  getFFmpegInPath,
} from 'moseamp/slices/renderer';
import { ORIENTATION, FFMPEG_PRESETS } from 'moseamp/constants';

const Cover = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const Popover = styled.div`
  position: absolute;
  z-index: 10;
`;

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  background: ${(p) => p.theme.black9};
  gap: 15px;
  padding: 15px;
`;

const SettingsColumn = styled.div`
  flex: 1;
`;

const SettingsGroup = styled.div`
  background: ${(p) => p.theme.gray15};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const GroupTitle = styled.h2`
  margin: 0 0 15px;
  font-size: 18px;
`;

const GroupSubTitle = styled.h3`
  margin: 0 0 15px;
  font-size: 14px;
`;

const Controls = styled.div`
  flex: 0 0 85px;
  display: flex;
  gap: 15px;
  flex-direction: row;
  align-items: center;
  padding: 15px;
  background: linear-gradient(
    180deg,
    ${(p) => p.theme.gray25} 1px,
    ${(p) => p.theme.gray15} 1px,
    ${(p) => p.theme.black9} 85px,
    ${(p) => p.theme.black} 85px
  );
`;

const RenderButton = styled.button`
  flex: 0;
  cursor: pointer;
  white-space: nowrap;
  color: ${(p) => p.theme.white};
  text-shadow: 0 1px 2px ${(p) => p.theme.black};
  border-top: 1px solid ${(p) => p.color75};
  border-bottom: 1px solid ${(p) => p.color25};
  border-left: none;
  border-right: none;
  border-radius: 4px;
  background: linear-gradient(180deg, ${(p) => p.color60} 0%, ${(p) => p.color40} 100%);
  padding: 5px 10px;
  font-size: ${(p) => p.theme.mainFontSize};
  font-family: ${(p) => p.theme.mainFontFamily};

  &:focus {
    outline: none;
  }

  &:hover {
    background: linear-gradient(180deg, ${(p) => p.color70} 0%, ${(p) => p.color50} 100%);
  }

  &:active {
    border-top: 1px solid ${(p) => p.color25};
    background: linear-gradient(180deg, ${(p) => p.color40} 0%, ${(p) => p.color60} 100%);
  }

  &:disabled {
    cursor: default;
    color: ${(p) => p.theme.gray75};
    border-top: 1px solid ${(p) => p.theme.gray25};
    background: linear-gradient(180deg, ${(p) => p.theme.gray60} 0%, ${(p) => p.theme.gray40} 100%);
  }
`;

function StartButton(props) {
  const theme = useContext(ThemeContext);
  return (
    <RenderButton
      color75={theme.blue75}
      color70={theme.blue70}
      color60={theme.blue60}
      color50={theme.blue50}
      color40={theme.blue40}
      color25={theme.blue25}
      {...props}
    />
  );
}

function CancelButton(props) {
  const theme = useContext(ThemeContext);
  return (
    <RenderButton
      color75={theme.red75}
      color70={theme.red70}
      color60={theme.red60}
      color50={theme.red50}
      color40={theme.red40}
      color25={theme.red25}
      {...props}
    />
  );
}

function NormalButton(props) {
  const theme = useContext(ThemeContext);
  return (
    <RenderButton
      color75={theme.gray75}
      color70={theme.gray70}
      color60={theme.gray60}
      color50={theme.gray50}
      color40={theme.gray40}
      color25={theme.gray25}
      {...props}
    />
  );
}

const RenderProgress = styled.progress`
  appearance: none;
  flex: 1;
  position: relative;
  top: -7px;

  ::-webkit-progress-bar {
    background: ${(p) => p.theme.gray25};
    box-shadow: inset 0 2px 4px ${(p) => p.theme.black9}, 0 1px ${(p) => p.theme.gray40};
    height: 16px;
    border-radius: 8px;
    border: 1px solid ${(p) => p.theme.black9};
    margin-top: 4px;
  }

  ::-webkit-progress-value {
    border-radius: 8px;
    background: linear-gradient(180deg, ${(p) => p.theme.blue60}, ${(p) => p.theme.blue40});
  }
`;

const Setting = styled.label`
  display: flex;
  flex-direction: row;
  margin-bottom: 8px;
  gap: 8px;
`;

const SettingLabel = styled.span`
  flex: 1;
  text-align: right;
`;

const _SettingInput = styled.input`
  flex: 1;
  background: ${(p) => p.theme.gray25};
  box-shadow: inset 0 2px 4px ${(p) => p.theme.black9}, 0 1px ${(p) => p.theme.gray40};
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.black9};
  color: ${(p) => p.theme.white};
  padding: 3px 6px 0;
  position: relative;
  top: -2px;

  &:focus {
    outline: 1px solid ${(p) => p.theme.gray40};
  }
`;

const Separator = styled.hr`
  margin: 15px 0;
  border: 1px solid ${(p) => p.theme.gray60};
  border-bottom: none;
`;

function SettingInput({ name, children, ...props }) {
  const dispatch = useDispatch();
  const settings = useSelector(getRendererSettings);
  return (
    <_SettingInput
      value={settings[name]}
      onChange={(event) => dispatch(setRendererSetting(name, event.target.value))}
      {...props}
    >
      {children}
    </_SettingInput>
  );
}

function ContainedPopover(props) {
  // Only worried about the right side for now, this could be more generic.
  const [right, setRight] = useState(undefined);
  const el = useRef();

  useEffect(() => {
    if (el.current) {
      const bounds = el.current.getBoundingClientRect();
      const elRight = bounds.left + bounds.width;
      if (elRight > window.innerWidth) {
        setRight('0');
      }
    }
  }, [el.current]);

  return <Popover style={{ right }} ref={el} {...props} />;
}

const ColorSwatch = styled.div`
  cursor: pointer;
  border: 3px solid ${(p) => p.theme.gray40};
  border-radius: 2px;
  width: 36px;
  height: 24px;
  background: ${(p) => p.color};
`;

function ColorSettingInput({ name }) {
  const dispatch = useDispatch();
  const settings = useSelector(getRendererSettings);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <div css="flex: 1;">
      <ColorSwatch color={settings[name]} onClick={() => setPickerVisible((v) => !v)} />
      {pickerVisible && (
        <ContainedPopover>
          <Cover onClick={() => setPickerVisible(false)} />
          <SketchPicker color={settings[name]} onChange={(color) => dispatch(setRendererSetting(name, color.hex))} />
        </ContainedPopover>
      )}
    </div>
  );
}

function FFmpegSettings() {
  const ffmpegInPath = useSelector(getFFmpegInPath);
  const dispatch = useDispatch();
  const handleClickLocate = async () => {
    const { canceled, filePaths } = await ipcRenderer.invoke('getFFmpegPath');
    if (canceled) {
      return;
    }

    dispatch(setRendererSetting('ffmpegPath', filePaths[0]));
  };

  return (
    <div>
      {ffmpegInPath ? (
        <p>FFmpeg was found in your PATH.</p>
      ) : (
        <>
          <p>FFmpeg could not be found automatically, enter the path to the executable.</p>
          <Setting>
            <SettingInput type="text" name="ffmpegPath" />
            <NormalButton css="flex: 0 0 auto;" onClick={handleClickLocate}>
              Locate
            </NormalButton>
          </Setting>
        </>
      )}
      <Setting>
        <SettingLabel>FFmpeg Output</SettingLabel>
        <SettingInput as="select" name="ffmpegPreset">
          <option value="h264mkv">H.264 / AAC (mkv)</option>
          <option value="vp8webm">VP8 / Vorbis (webm)</option>
        </SettingInput>
      </Setting>
    </div>
  );
}

function Settings() {
  return (
    <>
      <SettingsColumn>
        <SettingsGroup>
          <GroupTitle>Render Options</GroupTitle>
          <Setting>
            <SettingLabel>Video length (seconds)</SettingLabel>
            <SettingInput type="number" name="renderLength" />
          </Setting>
          <Setting>
            <SettingLabel>Framerate (FPS)</SettingLabel>
            <SettingInput type="number" name="fps" />
          </Setting>
          <Setting>
            <SettingLabel>Width (px)</SettingLabel>
            <SettingInput type="number" name="width" />
          </Setting>
          <Setting>
            <SettingLabel>Height (px)</SettingLabel>
            <SettingInput type="number" name="height" />
          </Setting>
          <Separator />
          <FFmpegSettings />
        </SettingsGroup>

        <SettingsGroup>
          <GroupTitle>Piano Roll</GroupTitle>
          <Setting>
            <SettingLabel>Orientation</SettingLabel>
            <SettingInput as="select" name="orientation">
              <option value={ORIENTATION.LEFT_TO_RIGHT}>Left to right</option>
              <option value={ORIENTATION.RIGHT_TO_LEFT}>Right to left</option>
              <option value={ORIENTATION.TOP_TO_BOTTOM}>Top to bottom</option>
              <option value={ORIENTATION.BOTTOM_TO_TOP}>Bottom to top</option>
            </SettingInput>
          </Setting>
          <Setting>
            <SettingLabel>Speed (smaller = faster)</SettingLabel>
            <SettingInput type="number" name="sliceUnits" />
          </Setting>
        </SettingsGroup>
      </SettingsColumn>

      <SettingsColumn>
        <SettingsGroup>
          <GroupTitle>Colors</GroupTitle>
          <Setting>
            <SettingLabel>Background</SettingLabel>
            <ColorSettingInput name="backgroundColor" />
          </Setting>
          <Setting>
            <SettingLabel>White keys</SettingLabel>
            <ColorSettingInput name="whiteKeyColor" />
          </Setting>
          <Setting>
            <SettingLabel>Black keys</SettingLabel>
            <ColorSettingInput name="blackKeyColor" />
          </Setting>

          <GroupSubTitle>2A03</GroupSubTitle>
          <Setting>
            <SettingLabel>Pulse 1</SettingLabel>
            <ColorSettingInput name="square1Color" />
          </Setting>
          <Setting>
            <SettingLabel>Pulse 2</SettingLabel>
            <ColorSettingInput name="square2Color" />
          </Setting>
          <Setting>
            <SettingLabel>Triangle</SettingLabel>
            <ColorSettingInput name="triangleColor" />
          </Setting>
          <Setting>
            <SettingLabel>Noise</SettingLabel>
            <ColorSettingInput name="noiseColor" />
          </Setting>
          <Setting>
            <SettingLabel>DPCM</SettingLabel>
            <ColorSettingInput name="dpcmColor" />
          </Setting>

          <GroupSubTitle>VRC6</GroupSubTitle>
          <Setting>
            <SettingLabel>Pulse 1</SettingLabel>
            <ColorSettingInput name="vrc6Square1Color" />
          </Setting>
          <Setting>
            <SettingLabel>Pulse 2</SettingLabel>
            <ColorSettingInput name="vrc6Square2Color" />
          </Setting>
          <Setting>
            <SettingLabel>Saw</SettingLabel>
            <ColorSettingInput name="vrc6SawColor" />
          </Setting>
        </SettingsGroup>
      </SettingsColumn>
    </>
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

  const cancelToken = useRef();

  const handleClickStart = async () => {
    const preset = FFMPEG_PRESETS[settings.ffmpegPreset];
    const { canceled, filePath: outputPath } = await ipcRenderer.invoke(
      'getRenderSavePath',
      `render.${preset.extension}`
    );
    if (canceled) {
      return;
    }

    cancelToken.current = { cancel() {} };
    setIsRendering(true);
    setFramesToRender(settings.fps * settings.renderLength);

    const ffmpegPath = ffmpegInPath ? 'ffmpeg' : settings.ffmpegPath;
    await plugin.render({
      filePath: currentFilePath,
      song: currentSong,
      outputPath,
      ffmpegPath,
      volume,

      settings,

      cancelToken: cancelToken.current,
      onRenderFrame({ frameIndex }) {
        setRenderedFrames(frameIndex);
      },
    });
    setIsRendering(false);
    setRenderedFrames(0);
  };

  const handleClickCancel = () => {
    cancelToken.current?.cancel();
    setIsRendering(false);
    setRenderedFrames(0);
  };

  useEffect(() => {
    dispatch(checkFFmpegInPath());
  }, [dispatch]);

  return (
    <Container>
      <Main>
        <Settings />
      </Main>
      <Controls>
        {do {
          if (isRendering) {
            <CancelButton onClick={handleClickCancel}>Cancel render</CancelButton>;
          } else if (!currentFilePath) {
            <StartButton disabled={true}>No song selected</StartButton>;
          } else {
            <StartButton onClick={handleClickStart}>Start render</StartButton>;
          }
        }}
        <RenderProgress value={renderedFrames} max={framesToRender} />
      </Controls>
    </Container>
  );
}
