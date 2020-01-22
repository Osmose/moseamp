import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import { FontAwesome } from 'moseamp/components/Icon';
import {
  changePath,
  getCurrentPath,
  getFullCurrentPath,
  getCurrentPathSegments,
  getEntries,
  loadEntries,
  getLoading,
} from 'moseamp/ducks/filebrowser';
import { openFile, getCurrentFilePath } from 'moseamp/ducks/player';
import { EXTENSIONS_ICONS, SUPPORTED_EXTENSIONS } from 'moseamp/filetypes';


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
      } else if (SUPPORTED_EXTENSIONS.includes(entry.ext)) {
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
    const { currentPath, currentFilePath, entry, loading } = this.props;

    const isCurrentFile = currentFilePath === entry.fullPath;
    return (
      <li
        className={`entry ${isCurrentFile ? 'current-entry' : ''}`}
        onClick={() => this.handleClickEntry(entry)}
      >
        <span className="icon">
          {
            loading && currentPath === entry.path
              ? <FontAwesome code="spinner" className="fa-spin" />
              : <FileIcon entry={entry} />
          }
        </span>
        <span>{entry.name}</span>
      </li>
    );
  }
}

class FileIcon extends React.Component {
  render() {
    const { entry } = this.props;
    if (entry.type === 'directory') {
      return <FontAwesome code="folder-open" />;
    }

    const iconPath = EXTENSIONS_ICONS[entry.ext];
    if (iconPath) {
      return <img src={iconPath} className="image-icon" />;
    }

    return <FontAwesome code="file" />;
  }
}
