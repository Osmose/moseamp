import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { addEntry, getEntries, removeEntry, reorderEntries } from 'moseamp/ducks/favorites';
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
  { addEntry, removeEntry, changeFullPath, reorderEntries },
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

  handleDragEnd(result) {
    if (!result.destination) {
      return;
    }

    console.log(`Reoder from ${result.source.index} to ${result.destination.index}`);
    this.props.reorderEntries(result.source.index, result.destination.index);
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
        <DragDropContext onDragEnd={this.handleDragEnd}>
          <Droppable droppableId="favorites">
            {(provided) => (
              <ul
                className="sidebar-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {entries.map((entry, index) => (
                  <FavoritesEntry key={entry.id} entry={entry} index={index} />
                ))}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
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
    const { entry, index } = this.props;

    return (
      <Draggable draggableId={entry.id} index={index}>
        {(provided) => (
          <li
            className="sidebar-entry"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
          >
            <button type="button" className="menu-button" onClick={this.handleClickMenu}>
              <Icon name="ellipsis-v" />
            </button>
            <a href="#" className="sidebar-link" onClick={this.handleClickName}>{entry.name}</a>
          </li>
        )}
      </Draggable>
    );
  }
}
