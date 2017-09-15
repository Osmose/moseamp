import autobind from 'autobind-decorator'
import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import { Map, List, Record } from 'immutable';
import { remote } from 'electron';
import ReactTable from 'react-table';
import ReactSlider from 'react-slider';
import glob from 'glob';
import fs from 'fs';

import store from './store';
import {
  setSelectedCategory,
  getFilteredEntries,
  createLibraryEntry,
  getSelectedCategory,
  getSelectedEntry,
  setSelectedEntry,
  getAvailableCategories,
} from './library';
import {
  openEntry,
  play,
  pause,
  getPlaying,
  getPlayingEntry,
  getVolume,
  setVolume,
  getCurrentTime,
  getDuration,
  seek,
} from './player';
import * as categories from './categories';

const {
  dialog
} = remote;

function formatDuration(duration) {
  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor(duration / 60);
  const hours = Math.floor(duration / 3600);
  let string = seconds.toString().padStart(2, '0');
  if (hours) {
    string = `${hours}:${minutes.toString().padStart(2, '0')}:${string}`;
  } else {
    string = `${minutes}:${string}`;
  }
  return string;
}

@autobind
class App extends React.Component {
  render() {
    return (
      <div className="app">
        <TitleBar />
        <div className="library">
          <CategorySidebar />
          <LibraryEntryList />
        </div>
        <PlayerBar />
      </div>
    );
  }
}

class TitleBar extends React.Component {
  render() {
    return (
      <div className="title-bar">
        MoseAmp
      </div>
    );
  }
}

class PlayerBar extends React.Component {
  render() {
    return (
      <div className="player-bar">
        <PlayingEntryInfo />
        <PlayerControls />
        <VolumeControls />
      </div>
    );
  }
}

@connect(
  state => ({
    playing: getPlaying(state),
    currentTime: getCurrentTime(state),
    duration: getDuration(state),
  }),
)
@autobind
class PlayerControls extends React.Component {
  handleChangeTime(time) {
    seek(time);
  }

  render() {
    const { playing, currentTime, duration } = this.props;
    return (
      <div className="player-controls">
        {playing
          ? <PauseButton />
          : <PlayButton />
        }
        <div className="seek-bar">
          <div className="current-time">
            {currentTime && formatDuration(currentTime)}
          </div>
          <ReactSlider
            disabled={duration === null}
            min={0}
            max={duration !== null ? Math.floor(duration) : 1}
            step={1}
            value={currentTime !== null ? Math.floor(currentTime) : 1}
            withBars={duration !== null}
            onChange={this.handleChangeTime}
          />
          <div className="duration">
            {duration && formatDuration(duration)}
          </div>
        </div>
      </div>
    );
  }
}

@connect(
  state => ({
    playingEntry: getPlayingEntry(state),
  }),
)
class PlayingEntryInfo extends React.Component {
  render() {
    const { playingEntry } = this.props;
    return (
      <div className="player-info">
        <div className="player-info-title">
          {playingEntry
            ? playingEntry.name
            : "---"
          }
        </div>
        <div className="player-info-artist">
          {playingEntry
            ? playingEntry.artist
            : "---"
          }
        </div>
      </div>
    );
  }
}

@connect(
  state => ({
    playingEntry: getPlayingEntry(state),
  }),
  { play },
)
@autobind
class PlayButton extends React.Component {
  handleClick() {
    this.props.play();
  }

  render() {
    const { playingEntry } = this.props;
    let className = 'control-button';
    if (!playingEntry) {
      className += ' disabled';
    }

    return (
      <a className={className} onClick={this.handleClick}>
        <Icon name="play" />
      </a>
    );
  }
}

@connect(null, { pause })
@autobind
class PauseButton extends React.Component {
  handleClick() {
    this.props.pause();
  }

  render() {
    return (
      <button className="control-button" onClick={this.handleClick}>
        <Icon name="pause" />
      </button>
    );
  }
}

@connect(
  state => ({
    volume: getVolume(state),
  }),
  { setVolume },
)
@autobind
class VolumeControls extends React.Component {
  handleChange(value) {
    this.props.setVolume(value);
  }

  render() {
    const { volume } = this.props;
    let iconName = "volume-up";
    if (volume <= 0) {
      iconName = "volume-off";
    } else if (volume < 1) {
      iconName = "volume-down";
    }

    return (
      <div className="player-volume-container">
        <Icon name={iconName} className="volume-icon" />
        <ReactSlider
          min={0}
          max={4}
          step={0.1}
          value={volume}
          onChange={this.handleChange}
          withBars
        />
      </div>
    );
  }
}

@connect(state => ({
  availableCategories: getAvailableCategories(state),
}))
class CategorySidebar extends React.Component {
  render() {
    const { availableCategories } = this.props;
    return (
      <div className="category-sidebar">
        <h2 className="category-list-heading">Categories</h2>
        <ul className="category-list">
          {availableCategories.map(category => (
            <CategoryItem code={category} key={category} />
          ))}
        </ul>
        <div className="sidebar-controls">
          <AddToLibraryButton />
        </div>
      </div>
    );
  }
}

class Icon extends React.Component {
  render() {
    const { className, name } = this.props;
    return (
      <i className={`${className} icon-${name}`} />
    );
  }
}

@connect(null, { createLibraryEntry })
@autobind
class AddToLibraryButton extends React.Component {
  handleClick() {
    dialog.showOpenDialog({
      title: 'Add to Library',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections', 'openDirectory'],
    }, filenames => {
      for (const filename of filenames) {
        if (fs.statSync(filename).isDirectory()) {
          glob.sync(`${filename}/**/*`).forEach(this.props.createLibraryEntry);
        } else {
          this.props.createLibraryEntry(filename);
        }
      }
    });
  }

  render() {
    return (
      <a onClick={this.handleClick} className="add-to-library">
        <Icon name="plus" />
        Add to Library
      </a>
    );
  }
}

const CATEGORY_DISPLAY_NAMES = {
  [categories.CATEGORY_AUDIO]: "Audio",
  [categories.CATEGORY_SPECTRUM_ZX]: "Spectrum ZX",
  [categories.CATEGORY_GB]: "Gameboy",
  [categories.CATEGORY_GENESIS]: "Sega Genesis",
  [categories.CATEGORY_NEC_PC_ENGINE]: "NEC PC Engine",
  [categories.CATEGORY_TURBOGRAFX_16]: "Turbografx 16",
  [categories.CATEGORY_NES]: "Nintendo (NES)",
  [categories.CATEGORY_SNES]: "Super Nintendo",
  [categories.CATEGORY_MASTER_SYSTEM]: "Sega Master System",
  [categories.CATEGORY_PS1]: "Playstation",
};

@connect(
  (state, props) => ({
    selected: getSelectedCategory(state) === props.code,
  }),
  { setSelectedCategory },
)
@autobind
class CategoryItem extends React.Component {
  handleClick() {
    this.props.setSelectedCategory(this.props.code);
  }

  render() {
    const { name, selected, code } = this.props;
    let className = 'category-list-item';
    if (selected) {
      className += ' selected';
    }

    return (
      <li className={className} onClick={this.handleClick}>
        <ConsoleIcon code={code} />
        {CATEGORY_DISPLAY_NAMES[code]}
      </li>
    );
  }
}

class ConsoleIcon extends React.Component {
  render() {
    const { code } = this.props;
    return (
      <img src={`img/${code}.png`} className="console-icon" />
    );
  }
}

@connect(
  state => ({
    entries: getFilteredEntries(state),
    selectedEntry: getSelectedEntry(state),
  }),
  { openEntry, play, setSelectedEntry },
)
@autobind
class LibraryEntryList extends React.Component {
  getTrProps(state, rowInfo, column) {
    const { selectedEntry } = this.props;
    const entry = rowInfo && rowInfo.original;

    let className = '';
    if (entry && selectedEntry && entry.id === selectedEntry.id) {
      className = 'selected';
    }

    return {
      className,
      onClick: (e, handleOriginal) => {
        this.handleClickEntry(entry);
      },
      onDoubleClick: (e, handleOriginal) => {
        this.handleDoubleClickEntry(entry);
      },
    };
  }

  handleClick(event) {
    const { setSelectedEntry } = this.props;
    if (event.target.closest('.-padRow')) {
      setSelectedEntry(null);
    }
  }

  handleClickEntry(entry) {
    const { setSelectedEntry } = this.props;
    setSelectedEntry(entry);
  }

  handleDoubleClickEntry(entry) {
    const { openEntry, play } = this.props;
    openEntry(entry);
    play();
  }

  render() {
    const { entries } = this.props;
    const columns = [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Filename',
        accessor: 'filename',
      },
    ];

    return (
      <div className="library-entry-list" onClick={this.handleClick}>
        <ReactTable
          className="library-table -striped"
          noDataText="Library empty."
          data={entries}
          pageSize={entries.length}
          minRows={20}
          defaultSorted={[
            {id: 'filename', desc: false },
            {id: 'name', desc: false },
          ]}
          columns={columns}
          getTrProps={this.getTrProps}
          showPagination={false}
          defaultSortMethod={this.sortMethod}
        />
      </div>
    );
  }

  sortMethod(a, b) {
    a = (a === null || a === undefined) ? -Infinity : a;
    b = (b === null || b === undefined) ? -Infinity : b;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b, 'en', {numeric: true});
    }

    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  }
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container')
);
