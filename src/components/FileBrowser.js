import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import Icon, { FontAwesome } from 'moseamp/components/Icon';
import {
  changePath,
  getCurrentPathSegments,
  getEntries,
  loadEntries,
  getLoading,
  getSearch,
  setSearch,
} from 'moseamp/ducks/filebrowser';
import { openFile, getCurrentFilePath, getPlaying } from 'moseamp/ducks/player';
import { getTypeForExt } from 'moseamp/filetypes';


export default
@connect(
  state => ({
    pathSegments: getCurrentPathSegments(state),
    entries: getEntries(state),
    search: getSearch(state),
  }),
  {
    changePath,
    loadEntries,
    setSearch,
  },
)
@autobind
class FileBrowser extends React.Component {
  componentDidMount() {
    this.props.loadEntries();
  }

  handleClickSegment(segment) {
    this.props.changePath(segment.path);
  }

  handleChangeSearch(event) {
    this.props.setSearch(event.target.value);
  }

  handleKeyDownSearch(event) {
    console.log(event);
    if (event.key === 'Escape') {
      this.props.setSearch(null);
    }
  }

  handleClickCloseSearch() {
    this.props.setSearch(null);
  }

  render() {
    const { pathSegments, entries, search } = this.props;

    let searchedEntries = entries;
    if (search) {
      searchedEntries = searchedEntries.filter(entry => entry.name.toLowerCase().includes(search.toLowerCase()));
    }

    const directories = [];
    const files = [];
    for (const entry of searchedEntries) {
      if (entry.type === 'directory') {
        directories.push(entry);
      } else if (getTypeForExt(entry.ext)) {
        files.push(entry);
      }
    }

    return (
      <div className="file-browser">
        <ol className="path-segments">
          {pathSegments.map(segment => (
            <React.Fragment key={segment.path}>
              <li className="segment" onClick={() => this.handleClickSegment(segment)}>
                {segment.name}
              </li>
              <li className="separator">
                <div className="inner" />
              </li>
            </React.Fragment>
          ))}
        </ol>
        {search !== null && (
          <div className="search-bar">
            <input
              id="search-input"
              type="text"
              placeholder="Search"
              value={search}
              onChange={this.handleChangeSearch}
              onKeyDown={this.handleKeyDownSearch}
            />
            <button className="close-search" onClick={this.handleClickCloseSearch}>
              <FontAwesome code="times" />
            </button>
          </div>
        )}
        <ol className="entries">
          {directories.map(directory => (
            <Entry entry={directory} key={directory.path} />
          ))}
          {files.map(file => (
            <Entry entry={file} key={file.path} />
          ))}
        </ol>
      </div>
    );
  }
}

@connect(
  state => ({
    loading: getLoading(state),
    currentFilePath: getCurrentFilePath(state),
    playing: getPlaying(state),
  }),
  {
    changePath,
    openFile,
  },
)
@autobind
class Entry extends React.Component {
  handleClickEntry(entry) {
    if (entry.type === 'directory') {
      this.props.changePath(entry.path);
    } else {
      this.props.openFile(entry.path);
    }
  }

  render() {
    const { currentFilePath, entry, loading, playing } = this.props;

    const isCurrentFile = currentFilePath === entry.path;
    return (
      <li
        className={`entry ${isCurrentFile ? 'current-entry' : ''}`}
        onClick={() => this.handleClickEntry(entry)}
      >
        <span className="icon">
          <EntryIcon
            entry={entry}
            loading={loading}
            isCurrentFile={isCurrentFile}
            playing={playing}
          />
        </span>
        <span>{entry.name}</span>
      </li>
    );
  }
}

class EntryIcon extends React.Component {
  render() {
    const { entry, loading, isCurrentFile, playing } = this.props;
    if (loading && isCurrentFile) {
      return <FontAwesome code="spinner" className="fa-spin" />;
    }

    if (isCurrentFile) {
      return <FontAwesome code={playing ? 'play' : 'pause'} />;
    }

    return <FileIcon entry={entry} />;
  }
}

class FileIcon extends React.Component {
  render() {
    const { entry } = this.props;
    if (entry.type === 'directory') {
      return <FontAwesome code="folder-open" />;
    }

    const fileType = getTypeForExt(entry.ext);
    if (fileType) {
      return <Icon iconId={fileType.id} />;
    }

    return <FontAwesome code="file" />;
  }
}
