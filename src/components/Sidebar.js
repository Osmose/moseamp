import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { remote } from 'electron';
import glob from 'glob';
import fs from 'fs';

import {
  setSelectedCategory,
  createLibraryEntry,
  getSelectedCategory,
  getAvailableCategories,
} from 'moseamp/ducks/library';
import { getCategoryDisplayName } from 'moseamp/categories';
import Icon from 'moseamp/components/Icon';

const {
  dialog,
} = remote;

@connect(state => ({
  availableCategories: getAvailableCategories(state),
}))
export default class Sidebar extends React.Component {
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
        <div className="sidebar-controls">
          <AddToLibraryButton />
        </div>
      </div>
    );
  }
}

@connect(null, { createLibraryEntry })
@autobind
class AddToLibraryButton extends React.Component {
  handleClick() {
    dialog.showOpenDialog({
      title: 'Add to Library',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections', 'openDirectory'],
    }, filenames => {
      for (const filename of filenames) {
        if (fs.statSync(filename).isDirectory()) {
          glob.sync(`${filename}/**/*`).forEach(this.props.createLibraryEntry);
        } else {
          this.props.createLibraryEntry(filename);
        }
      }
    });
  }

  render() {
    return (
      <a onClick={this.handleClick} className="add-to-library">
        <Icon name="plus" />
        Add to Library
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
    let className = 'category-list-item';
    if (selected) {
      className += ' selected';
    }

    return (
      <li className={className} onClick={this.handleClick}>
        <ConsoleIcon code={code} />
        {getCategoryDisplayName(code)}
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
