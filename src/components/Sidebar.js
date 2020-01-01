import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';

import {
  setSelectedCategory,
  createLibraryEntries,
  getSelectedCategory,
  getAvailableCategories,
  rescanLibrary,
} from 'moseamp/ducks/library';
import { getCategoryInfo } from 'moseamp/drivers';
import Icon from 'moseamp/components/Icon';

const {
  dialog,
} = remote;

export default
@connect(state => ({
  availableCategories: getAvailableCategories(state),
}))
class Sidebar extends React.Component {
  render() {
    const { availableCategories } = this.props;
    return (
      <div className="category-sidebar">
        <h2 className="category-list-heading">Categories</h2>
        <ul className="category-list">
          {availableCategories.map(category => (
            <CategoryItem code={category} key={category} />
          ))}
        </ul>
        <AddToLibraryButton />
        <RescanLibraryButton />
      </div>
    );
  }
}

@connect(null, { createLibraryEntries })
@autobind
class AddToLibraryButton extends React.Component {
  handleClick() {
    dialog.showOpenDialog({
      title: 'Add to Library',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections', 'openDirectory'],
    }, this.props.createLibraryEntries);
  }

  render() {
    return (
      <a onClick={this.handleClick} className="sidebar-link">
        <Icon name="plus" />
        Add to Library
      </a>
    );
  }
}

@connect(null, { rescanLibrary })
@autobind
class RescanLibraryButton extends React.Component {
  handleClick() {
    this.props.rescanLibrary();
  }

  render() {
    return (
      <a onClick={this.handleClick} className="sidebar-link">
        <Icon name="arrows-cw" />
        Rescan Library
      </a>
    );
  }
}

@connect(
  (state, props) => ({
    selected: getSelectedCategory(state) === props.code,
  }),
  { setSelectedCategory },
)
@autobind
class CategoryItem extends React.Component {
  handleClick() {
    this.props.setSelectedCategory(this.props.code);
  }

  render() {
    const { selected, code } = this.props;
    const categoryInfo = getCategoryInfo(code);
    let className = 'category-list-item';
    if (selected) {
      className += ' selected';
    }

    if (!categoryInfo) {
      return null;
    }

    return (
      <li className={className} onClick={this.handleClick}>
        <ConsoleIcon code={code} />
        {categoryInfo.name}
      </li>
    );
  }
}

class ConsoleIcon extends React.Component {
  render() {
    const { code } = this.props;
    return (
      <img src={`img/${code}.png`} className="console-icon" />
    );
  }
}
