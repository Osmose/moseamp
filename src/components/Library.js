import autobind from 'autobind-decorator';
import React from 'react';
import { connect } from 'react-redux';
import { Table, Column, Cell } from 'fixed-data-table-2';

import {
  getFilteredEntries,
  getSelectedEntry,
  setSelectedEntry,
} from 'moseamp/ducks/library';
import {
  openEntry,
  play,
} from 'moseamp/ducks/player';


@connect(
  state => ({
    entries: getFilteredEntries(state),
    selectedEntry: getSelectedEntry(state),
  }),
  { openEntry, play, setSelectedEntry },
)
@autobind
export default class Library extends React.Component {
  constructor(props) {
    super(props);
    this.width = 757;
    this.height = 591;
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const entry = entries[0];
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;
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
    const { entries } = this.props;

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
        >
          <Column
            header={<Cell className="library-header">Name</Cell>}
            cell={<AttrCell attr="name" />}
            width={50}
            flexGrow={1}
          />
          <Column
            header={<Cell className="library-header">Filename</Cell>}
            cell={<AttrCell attr="filename" />}
            width={50}
            flexGrow={1}
          />
        </Table>
      </div>
    );
  }
}

@connect(state => ({
  entries: getFilteredEntries(state),
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
