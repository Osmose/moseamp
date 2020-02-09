import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import Icon, { FontAwesome } from 'moseamp/components/Icon';
import {
  changePath,
  getCurrentPath,
  getFullCurrentPath,
  getCurrentPathSegments,
  getEntries,
  loadEntries,
  getLoading,
} from 'moseamp/ducks/filebrowser';
import { openFile, getCurrentFilePath, getPlaying } from 'moseamp/ducks/player';
import { getTypeForExt } from 'moseamp/filetypes';


export default
@connect(
  state => ({
    currentPath: getCurrentPath(state),
    fullCurrentPath: getFullCurrentPath(state),
    pathSegments: getCurrentPathSegments(state),
    entries: getEntries(state),
  }),
  {
    changePath,
    loadEntries,
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

  render() {
    const { pathSegments, entries } = this.props;

    const directories = [];
    const files = [];
    for (const entry of entries) {
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
        <ol className="entries">
          {directories.map(directory => (
            <Entry entry={directory} key={directory.fullPath} />
          ))}
          {files.map(file => (
            <Entry entry={file} key={file.fullPath} />
          ))}
        </ol>
      </div>
    );
  }
}

@connect(
  state => ({
    currentPath: getCurrentPath(state),
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
      this.props.openFile(entry.fullPath);
    }
  }

  render() {
    const { currentFilePath, entry, loading, playing } = this.props;

    const isCurrentFile = currentFilePath === entry.fullPath;
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
