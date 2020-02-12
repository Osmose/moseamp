import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import {
  addEntry,
  getEntries,
  removeEntry,
  reorderEntries,
  renameEntry,
  setEntryIconId,
} from 'moseamp/ducks/favorites';
import { changePath } from 'moseamp/ducks/filebrowser';
import Icon, { FontAwesome, STATIC_ICONS } from 'moseamp/components/Icon';

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
  { addEntry, removeEntry, changePath, reorderEntries },
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

    this.props.reorderEntries(result.source.index, result.destination.index);
  }

  render() {
    const { entries } = this.props;

    return (
      <div className="favorites">
        <h2 className="sidebar-heading">
          <span>Favorites</span>
          <button type="button" className="menu-button" onClick={this.handleClickAdd}>
            <FontAwesome code="plus" />
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
    label: 'Change icon...',
    click() {
      if (activeContextEntry) {
        activeContextEntry.iconComponent.showIconPicker();
      }
    },
  },
  {
    label: 'Rename...',
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
  { removeEntry, renameEntry, changePath },
)
@autobind
class FavoritesEntry extends React.Component {
  constructor(props) {
    super(props);
    this.nameInput = null;
    this.iconComponent = null;
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
    this.props.changePath(this.props.entry.path);
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
            style={provided.draggableProps.style}
          >
            <FontAwesome code="grip-lines" className="drag-handle" {...provided.dragHandleProps} />

            <button type="button" className="menu-button" onClick={this.handleClickMenu}>
              <FontAwesome code="ellipsis-v" />
            </button>

            <EntryIcon
              entryId={entry.id}
              iconId={entry.iconId}
              ref={(component) => { this.iconComponent = component; }}
            />

            {renaming
              ? (
                <form onSubmit={this.handleSubmitRename} className="text-input-form">
                  <input
                    className="text-input"
                    type="text"
                    value={nameInputValue}
                    onChange={this.handleNameChange}
                    ref={(element) => { this.nameInput = element; }}
                    size={nameInputValue.length + 1}
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

@connect(
  null,
  { setEntryIconId },
  null,
  {forwardRef: true},
)
@autobind
class EntryIcon extends React.Component {
  constructor(props) {
    super(props);
    this.iconElement = null;
    this.state = {
      choosingIcon: false,
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside(event) {
    if (!this.iconElement.contains(event.target)) {
      this.setState({ choosingIcon: false });
    }
  }

  showIconPicker() {
    this.setState({ choosingIcon: true });
  }

  handleClickIconButton(icon) {
    const { entryId } = this.props;
    this.props.setEntryIconId(entryId, icon.id);
    this.setState({ choosingIcon: false });
  }

  render() {
    const { iconId = 'folder' } = this.props;
    const { choosingIcon } = this.state;

    return (
      <span
        className="entry-icon"
        ref={(iconElement) => { this.iconElement = iconElement; }}
      >
        <Icon iconId={iconId} />
        <Tooltip visible={choosingIcon} className="icon-chooser">
          {STATIC_ICONS.map(icon => (
            <button
              key={icon.id}
              type="button"
              className="icon-button"
              onClick={() => this.handleClickIconButton(icon)}
            >
              <Icon iconId={icon.id} />
            </button>
          ))}
        </Tooltip>
      </span>
    );
  }
}

class Tooltip extends React.Component {
  render() {
    const { children, visible, className } = this.props;
    return (
      <div
        className={`tooltip ${className}`}
        style={{
          visibility: visible ? 'visible' : 'hidden',
          opacity: visible ? '100%' : '0%',
        }}
      >
        <div className="pip" />
        {children}
      </div>
    );
  }
}
