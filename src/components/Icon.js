import React from 'react';

import FILE_TYPES from 'moseamp/filetypes';

class Icon extends React.Component {
  render() {
    const { iconId, className = '', size = 16, innerRef, ...restProps } = this.props;

    const staticIcon = STATIC_ICONS_MAP[iconId];
    if (staticIcon.type === 'image') {
      return (
        <img
          src={`img/${staticIcon.id}_${size}.png`}
          srcSet={`img/${staticIcon.id}_${size * 2}.png 2x`}
          className={`image-icon ${className}`}
          ref={innerRef}
          {...restProps}
        />
      );
    }

    return (
      <FontAwesome code={staticIcon.code} ref={innerRef} {...restProps} />
    );
  }
}

export const FontAwesome = React.forwardRef((props, ref) => {
  const { className, code, ...restProps } = props;
  return (
    <i className={`${className} fas fa-${code}`} ref={ref} {...restProps} />
  );
});

export default React.forwardRef((props, ref) => (
  <Icon innerRef={ref} {...props} />
));

export const STATIC_ICONS = [
  ...FILE_TYPES.map(fileType => ({
    id: fileType.id,
    name: fileType.name,
    type: 'image',
  })),
  {
    id: 'folder',
    name: 'Folder',
    type: 'fa',
    code: 'folder-open',
  },
];

const STATIC_ICONS_MAP = {};
for (const icon of STATIC_ICONS) {
  STATIC_ICONS_MAP[icon.id] = icon;
}
