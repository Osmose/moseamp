import React from 'react';

import FILE_TYPES from 'moseamp/filetypes';
import { staticPath } from 'moseamp/utils';

class Icon extends React.Component {
  render() {
    const { iconId, className = '', size = 16, innerRef, ...restProps } = this.props;

    const staticIcon = STATIC_ICONS_MAP[iconId];
    if (staticIcon?.type === 'image') {
      return (
        <img
          src={staticPath(`img/${staticIcon.id}_${size}.png`)}
          srcSet={staticPath(`img/${staticIcon.id}_${size * 2}.png 2x`)}
          className={`image-icon ${className || ''}`}
          ref={innerRef}
          {...restProps}
        />
      );
    } else if (staticIcon?.code) {
      return (
        <FontAwesome
          code={staticIcon.code}
          ref={innerRef}
          className={className}
          style={{ fontSize: `${size}px` }}
          {...restProps}
        />
      );
    }

    return (
      <FontAwesome
        code={iconId}
        ref={innerRef}
        className={className}
        style={{ fontSize: `${size}px` }}
        {...restProps}
      />
    );
  }
}

export const FontAwesome = React.forwardRef((props, ref) => {
  const { className, code, ...restProps } = props;
  return <i className={`${className} fas fa-${code}`} ref={ref} {...restProps} />;
});
FontAwesome.displayName = 'FontAwesome';

export default React.forwardRef((props, ref) => <Icon innerRef={ref} {...props} />);

export const STATIC_ICONS = [
  ...FILE_TYPES.map((fileType) => ({
    id: fileType.id,
    name: fileType.name,
    type: fileType.iconType,
    code: fileType.iconCode,
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
