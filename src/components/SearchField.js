import React from 'react';
import { connect } from 'react-redux';
import autobind from 'autobind-decorator';

import { getSearchQuery, setSearchQuery } from 'moseamp/ducks/library';
import Icon from 'moseamp/components/Icon';

@connect(
  state => ({
    query: getSearchQuery(state),
  }),
  { setSearchQuery },
)
@autobind
export default class SearchField extends React.Component {
  handleChange(event) {
    this.props.setSearchQuery(event.target.value);
  }

  render() {
    const { query } = this.props;
    return (
      <div className="search-field-container">
        <Icon name="search" className="icon" />
        <input
          className="search-field"
          type="search"
          value={query}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}
