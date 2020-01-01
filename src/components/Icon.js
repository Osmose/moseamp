import React from 'react';

export default class Icon extends React.Component {
  render() {
    const { className, name } = this.props;
    return (
      <i className={`${className} fas fa-${name}`} />
    );
  }
}
