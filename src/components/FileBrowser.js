import fs from 'fs';
import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import Icon from 'moseamp/components/Icon';
import {
  changePath,
  getCurrentPath,
  getFullCurrentPath,
  getCurrentPathSegments,
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
  }),
  {
    changePath,
  },
)
@autobind
class FileBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
    };
  }

  componentDidMount() {
    const { fullCurrentPath, currentPath } = this.props;
    this.loadEntries(fullCurrentPath, currentPath);
  }

  componentDidUpdate(prevProps) {
    const { fullCurrentPath, currentPath } = this.props;
    if (prevProps.fullCurrentPath !== fullCurrentPath) {
      this.loadEntries(fullCurrentPath, currentPath);
    }
  }

  async loadEntries(fullCurrentPath, currentPath) {
    const dirEntries = await fs.promises.readdir(fullCurrentPath, {withFileTypes: true});
    const entries = dirEntries.map(dirEnt => {
      return {
        fullPath: path.join(fullCurrentPath, dirEnt.name),
        path: path.join(currentPath, dirEnt.name),
        ext: path.extname(dirEnt.name),
        name: dirEnt.name,
        type: dirEnt.isDirectory() ? 'directory' : 'file',
      };
    });
    entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.setState({ entries });
  }

  handleClickSegment(segment) {
    this.props.changePath(segment.path);
  }

  render() {
    const { pathSegments } = this.props;
    const { entries } = this.state;

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
              ? <Icon name="spinner" className="fa-spin" />
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
      return <Icon name="folder-open" />;
    }

    const iconPath = EXTENSIONS_ICONS[entry.ext];
    if (iconPath) {
      return <img src={iconPath} className="image-icon" />;
    }

    return <Icon name="file" />;
  }
}
