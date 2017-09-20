import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { Table, Column, Cell } from 'fixed-data-table-2';

import {
  getFilteredSearchResults,
  getSelectedEntry,
  setSelectedEntry,
  getSelectedCategory,
} from 'moseamp/ducks/library';
import {
  openEntry,
  play,
} from 'moseamp/ducks/player';
import { getCategoryInfo } from 'moseamp/drivers';


@connect(
  state => ({
    entries: getFilteredSearchResults(state),
    selectedEntry: getSelectedEntry(state),
    categoryInfo: getCategoryInfo(getSelectedCategory(state)),
  }),
  { openEntry, play, setSelectedEntry },
)
@autobind
export default class Library extends React.Component {
  constructor(props) {
    super(props);
    this.width = 757;
    this.height = 591;
    window.libraryHeight = Math.floor(this.height / 34);
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const entry = entries[0];
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;
        window.libraryHeight = Math.floor(this.height / 34);
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect();
  }

  handleClick(event) {
    if (event.target.closest('.-padRow')) {
      this.props.setSelectedEntry(null);
    }
  }

  handleClickRow(event, rowIndex) {
    const { entries } = this.props;
    this.props.setSelectedEntry(entries.get(rowIndex));
  }

  handleDoubleClickRow(event, rowIndex) {
    const { entries } = this.props;
    this.props.openEntry(entries.get(rowIndex));
    this.props.play();
  }

  rowClassNameGetter(rowIndex) {
    const { entries, selectedEntry } = this.props;
    const rowEntry = entries.get(rowIndex);

    let className = 'library-row';
    if (selectedEntry && rowEntry && rowEntry.get('id') === selectedEntry.get('id')) {
      className += ' selected';
    }
    return className;
  }

  refEntryList(entryList) {
    this.resizeObserver.observe(entryList);
  }

  render() {
    const { entries, categoryInfo, selectedEntry } = this.props;
    const totalFlex = categoryInfo.columns.map(c => c.flex).reduce((a, b) => a + b);
    const availableWidth = this.width - 18;
    let selectedEntryIndex;
    if (selectedEntry) {
      selectedEntryIndex = entries.findIndex(e => e.get('id') === selectedEntry.get('id'));
    }

    return (
      <div className="library-entry-list" onClick={this.handleClick} ref={this.refEntryList}>
        <Table
          rowHeight={34}
          rowsCount={entries.count()}
          className="library-table"
          rowClassNameGetter={this.rowClassNameGetter}
          width={this.width}
          height={this.height}
          headerHeight={29}
          data={entries}
          onRowClick={this.handleClickRow}
          onRowDoubleClick={this.handleDoubleClickRow}
          scrollToRow={selectedEntryIndex}
        >
          {categoryInfo.columns.map(column => (
            <Column
              key={column.attr}
              header={<Cell className="library-header">{column.name}</Cell>}
              cell={<AttrCell attr={column.attr} />}
              width={availableWidth * (column.flex / totalFlex)}
            />
          ))}
        </Table>
      </div>
    );
  }
}

@connect(state => ({
  entries: getFilteredSearchResults(state),
}))
class AttrCell extends React.Component {
  render() {
    const { rowIndex, entries, attr, dispatch, ...props } = this.props;
    const entry = entries.get(rowIndex);
    return (
      <Cell {...props}>
        {entry.get(attr)}
      </Cell>
    );
  }
}
