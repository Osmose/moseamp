import React from 'react';

export default class Tooltip extends React.Component {
  render() {
    const { children, visible = true, position = 'bottom', className = '' } = this.props;
    return (
      <div
        className={`tooltip ${className} ${position}`}
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
