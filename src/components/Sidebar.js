import path from 'path';

import autobind from 'autobind-decorator';
import React from 'react';
import { connect, useDispatch } from 'react-redux';
import { remote } from 'electron';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { getMode, MODE_FILEBROWSER, MODE_VISUALIZER, setMode } from 'moseamp/ducks/app';
import {
  addEntry,
  getEntries,
  removeEntry,
  reorderEntries,
  renameEntry,
  setEntryIconId,
} from 'moseamp/ducks/favorites';
import { changePath } from 'moseamp/ducks/filebrowser';
import { setPluginId as setVisualizerPluginId } from 'moseamp/ducks/visualizer';
import Icon, { FontAwesome, STATIC_ICONS } from 'moseamp/components/Icon';
import Tooltip from 'moseamp/components/Tooltip';
import visualizerPlugins from 'moseamp/visualizers';

const {
  dialog,
  getCurrentWindow,
  Menu,
} = remote;

export default
@connect(
  (state) => ({
    mode: getMode(state),
  })
)
class Sidebar extends React.Component {
  render() {
    const { mode } = this.props;

    return (
      <div className="sidebar">
        <Modes mode={mode} />
        {mode === MODE_FILEBROWSER && <Favorites />}
        {mode === MODE_VISUALIZER && <VisualizerPlugins plugins={visualizerPlugins} />}
      </div>
    );
  }
}

@connect(
  null,
  { setMode },
)
class Modes extends React.Component {
  handleClickMode(mode) {
    this.props.setMode(mode);
  }

  render() {
    const { mode } = this.props;

    return (
      <div className="modes">
        <h2 className="sidebar-heading">Mode</h2>
        <a
          className={`file-browser-link sidebar-mode ${mode === MODE_FILEBROWSER ? 'selected' : ''}`}
          onClick={() => this.handleClickMode(MODE_FILEBROWSER)}
        >
          <FontAwesome code="folder" />
          <span className="label">File Browser</span>
        </a>
        <a
          className={`visualizer-link sidebar-mode ${mode === MODE_VISUALIZER ? 'selected' : ''}`}
          onClick={() => this.handleClickMode(MODE_VISUALIZER)}
        >
          <FontAwesome code="film" />
          <span className="label">Visualizer</span>
        </a>
      </div>
    );
  }
}

function VisualizerPlugins() {
  const dispatch = useDispatch();
  const handleClickPlugin = (pluginId) => {
    dispatch(setVisualizerPluginId(pluginId));
  };

  return (
    <Plugins plugins={visualizerPlugins} onClickPlugin={handleClickPlugin} />
  );
}

function RendererPlugins() {
  const dispatch = useDispatch();
  const handleClickPlugin = (pluginId) => {
    dispatch(setVisualizerPluginId(pluginId));
  };

  return (
    <Plugins plugins={visualizerPlugins.filter(plugin => plugin.canRender)} onClickPlugin={handleClickPlugin} />
  );
}

@autobind
class Plugins extends React.Component {
  handleClickPlugin(pluginId) {
    this.props.setPluginId(pluginId);
  }

  render() {
    return (
      <div className="visualizer-plugins">
        <h2 className="sidebar-heading">
          <span>Plugins</span>
        </h2>
        <ul className="sidebar-list">
          {this.props.plugins.map(plugin => (
            <li key={plugin.id} className="sidebar-entry">
              <span className="entry-icon">
                <Icon {...plugin.icon} />
              </span>
              <a
                href="#"
                className="sidebar-link"
                onClick={() => this.props.onClickPlugin(plugin.id)}
              >
                {plugin.name}
              </a>
            </li>
          ))}
        </ul>
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
                <a href="#" className="sidebar-link" onClick={this.handleClickName} {...provided.dragHandleProps}>
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
        <Tooltip visible={choosingIcon} position="bottom" className="icon-chooser">
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
