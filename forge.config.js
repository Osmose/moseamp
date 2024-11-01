const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    icon: 'resources/moseamp',
  },
  rebuildConfig: {},
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack/webpack.main.config.js',
        renderer: {
          config(env, args) {
            if (args.mode === 'production') {
              return require('./webpack/webpack.renderer.prod');
            }

            return require('./webpack/webpack.renderer.dev');
          },
          entryPoints: [
            {
              name: 'main_window',
              html: './src/index.html',
              js: './src/renderer.js',
            },
          ],
        },
      },
    },
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        title: 'MoseAmp',
        icon: './resources/moseamp.icns',
        background: './resources/mac/dmg_bg.png',
        contents: [
          { x: 448, y: 344, type: 'link', path: '/Applications' },
          { x: 192, y: 344, type: 'file', path: path.resolve(__dirname, 'out/MoseAmp-darwin-x64/MoseAmp.app') },
        ],
      },
    },
  ],
  hooks: {
    async postMake(forgeConfig, makeResults) {
      if (process.env.CI) {
        for (const result of makeResults) {
          for (const artifact of result.artifacts) {
            const { dir, ext } = path.parse(artifact);
            fs.renameSync(artifact, path.join(dir, `MoseAmp${ext}`));
          }
        }
      }
    },
  },
};
