import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';

import Icon from 'moseamp/components/Icon';
import {
  changePath,
  getCurrentPath,
  getCurrentPathSegments,
  getCurrentEntries,
  getLoading,
  loadEntriesForCurrentPath,
} from 'moseamp/ducks/filebrowser';
import { openFile } from 'moseamp/ducks/player';
import FILE_TYPES from 'moseamp/filetypes';

const EXTENSIONS_ICONS = {};
for (const [code, type] of Object.entries(FILE_TYPES)) {
  for (const extension of type.extensions) {
    EXTENSIONS_ICONS[extension] = `img/${code}.png`;
  }
}

export default
@connect(
  state => ({
    entries: getCurrentEntries(state),
    pathSegments: getCurrentPathSegments(state),
  }),
  {
    changePath,
    loadEntriesForCurrentPath,
  },
)
@autobind
class FileBrowser extends React.Component {
  componentDidMount() {
    this.props.loadEntriesForCurrentPath();
  }

  handleClickSegment(segment) {
    this.props.changePath(segment.path);
  }

  render() {
    const { entries, pathSegments } = this.props;

    const directories = [];
    const files = [];
    for (const entry of entries) {
      if (entry.type === 'directory') {
        directories.push(entry);
      } else {
        files.push(entry);
      }
    }

    return (
      <div className="file-browser">
        <ol className="path-segments">
          {pathSegments.map(segment => (
            <>
              <li className="segment" onClick={() => this.handleClickSegment(segment)}>
                {segment.name}
              </li>
              <li className="separator" />
            </>
          ))}
        </ol>
        <ol className="entries">
          {directories.map(directory => (
            <Entry entry={directory} />
          ))}
          {files.map(file => (
            <Entry entry={file} />
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
    const { currentPath, entry, loading } = this.props;

    return (
      <li className="entry" onClick={() => this.handleClickEntry(entry)}>
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
