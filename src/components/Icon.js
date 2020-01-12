import React from 'react';

class Icon extends React.Component {
  render() {
    const { iconId, className, innerRef, ...restProps } = this.props;

    const staticIcon = STATIC_ICONS_MAP[iconId];
    if (staticIcon.type === 'image') {
      return <img src={staticIcon.url} className={`icon-image ${className}`} ref={innerRef} {...restProps} />;
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
  {
    id: 'gb',
    name: 'Gameboy',
    type: 'image',
    url: 'img/gb.png',
  },
  {
    id: 'gba',
    name: 'Gameboy Advance',
    type: 'image',
    url: 'img/gba.png',
  },
  {
    id: 'genesis',
    name: 'Genesis',
    type: 'image',
    url: 'img/genesis.png',
  },
  {
    id: 'master_system',
    name: 'Master System',
    type: 'image',
    url: 'img/master_system.png',
  },
  {
    id: 'nes',
    name: 'Nintendo Entertainment System',
    type: 'image',
    url: 'img/nes.png',
  },
  {
    id: 'ps1',
    name: 'Playstation',
    type: 'image',
    url: 'img/ps1.png',
  },
  {
    id: 'ps2',
    name: 'Playstation 2',
    type: 'image',
    url: 'img/ps2.png',
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    type: 'image',
    url: 'img/snes.png',
  },
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
