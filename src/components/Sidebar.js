import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';

import { addEntry, getEntries, removeEntry } from 'moseamp/ducks/favorites';
import { changeFullPath } from 'moseamp/ducks/filebrowser';
import Icon from 'moseamp/components/Icon';

const {
  dialog,
  getCurrentWindow,
  Menu,
} = remote;

export default class Sidebar extends React.Component {
  render() {
    return (
      <div className="sidebar">
        <Favorites />
      </div>
    );
  }
}

@connect(
  (state) => ({
    entries: getEntries(state),
  }),
  { addEntry, removeEntry, changeFullPath },
)
@autobind
class Favorites extends React.Component {
  async handleClickAdd() {
    const result = await dialog.showOpenDialog(getCurrentWindow(), {
      title: 'Add Favorite Directory',
      buttonLabel: 'Add Favorite',
      properties: ['openDirectory', 'createDirectory', 'multiSelections'],
    });

    if (result.cancelled) {
      return;
    }

    for (const entryPath of result.filePaths) {
      this.props.addEntry(path.basename(entryPath), entryPath);
    }
  }

  render() {
    const { entries } = this.props;

    return (
      <div className="favorites">
        <h2 className="sidebar-heading">
          <span>Favorites</span>
          <button type="button" className="menu-button" onClick={this.handleClickAdd}>
            <Icon name="plus" />
          </button>
        </h2>
        <ul className="sidebar-list">
          {entries.map(entry => (
            <FavoritesEntry key={entry.id} entry={entry} />
          ))}
        </ul>
      </div>
    );
  }
}

let activeContextEntryProps = null;
const entryContextMenu = Menu.buildFromTemplate([
  {
    label: 'Remove',
    click() {
      const props = activeContextEntryProps;
      if (props) {
        props.removeEntry(props.entry.id);
      }
    },
  },
]);

@connect(
  () => ({}),
  { removeEntry, changeFullPath },
)
@autobind
class FavoritesEntry extends React.Component {
  handleClickMenu() {
    activeContextEntryProps = this.props;
    entryContextMenu.popup({
      callback() {
        activeContextEntryProps = null;
      },
    });
  }

  handleClickName() {
    this.props.changeFullPath(this.props.entry.path);
  }

  render() {
    const { entry } = this.props;

    return (
      <li className="sidebar-entry">
        <button type="button" className="menu-button" onClick={this.handleClickMenu}>
          <Icon name="ellipsis-v" />
        </button>
        <a href="#" className="sidebar-link" onClick={this.handleClickName}>{entry.name}</a>
      </li>
    );
  }
}
