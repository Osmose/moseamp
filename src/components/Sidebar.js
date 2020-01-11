import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { addEntry, getEntries, removeEntry, reorderEntries, renameEntry } from 'moseamp/ducks/favorites';
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

let activeContextEntry = null;
const entryContextMenu = Menu.buildFromTemplate([
  {
    label: 'Rename',
    click() {
      if (activeContextEntry) {
        activeContextEntry.startRename();
      }
    },
  },
  {
    label: 'Remove',
    click() {
      if (activeContextEntry) {
        const { props } = activeContextEntry;
        props.removeEntry(props.entry.id);
      }
    },
  },
]);

@connect(
  () => ({}),
  { removeEntry, renameEntry, changeFullPath },
)
@autobind
class FavoritesEntry extends React.Component {
  constructor(props) {
    super(props);
    this.nameInput = null;
    this.state = {
      renaming: false,
      nameInputValue: '',
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.renaming && this.state.renaming) {
      this.nameInput.focus();
    }
  }

  handleClickMenu() {
    activeContextEntry = this;
    entryContextMenu.popup({
      callback() {
        activeContextEntry = null;
      },
    });
  }

  handleClickName() {
    this.props.changeFullPath(this.props.entry.path);
  }

  startRename() {
    this.setState({ renaming: true, nameInputValue: this.props.entry.name });
  }

  handleSubmitRename(event) {
    event.preventDefault();
    this.props.renameEntry(this.props.entry.id, this.state.nameInputValue);
    this.setState({ renaming: false });
  }

  handleNameChange(event) {
    this.setState({ nameInputValue: event.target.value });
  }

  render() {
    const { entry, index } = this.props;
    const { renaming, nameInputValue } = this.state;

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
            {renaming
              ? (
                <form onSubmit={this.handleSubmitRename}>
                  <input
                    className="text-input"
                    type="text"
                    value={nameInputValue}
                    onChange={this.handleNameChange}
                    onBlur={this.handleSubmitRename}
                    ref={(element) => { this.nameInput = element; }}
                  />
                </form>
              )
              : (
                <a href="#" className="sidebar-link" onClick={this.handleClickName}>
                  {entry.name}
                </a>
              )}
          </li>
        )}
      </Draggable>
    );
  }
}
