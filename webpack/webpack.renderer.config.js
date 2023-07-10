const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

function fromRoot(...args) {
  return path.posix.join(path.resolve(__dirname, '..').replace(/\\/g, '/'), ...args);
}

module.exports = {
  entry: {
    renderer: fromRoot('src/renderer.js'),
  },
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: fromRoot('src/img/*'), to: fromRoot('.webpack/renderer/img/[name][ext]') },
        {
          from: fromRoot('node_modules/@fortawesome/fontawesome-free/webfonts/*'),
          to: fromRoot('.webpack/renderer/webfonts/[name][ext]'),
        },
        { from: fromRoot('musicplayer/data'), to: fromRoot('.webpack/renderer/musicplayer_data') },
        {
          from: fromRoot('native_build/Release/musicplayer_node.node'),
          to: fromRoot('.webpack/renderer/musicplayer_node.node'),
        },
        { from: fromRoot('src/preload.js'), to: fromRoot('.webpack/main/preload.js') },
      ],
    }),
  ],
  node: {
    __dirname: false,
  },
  externals: [{ musicplayer_node: 'commonjs2 musicplayer_node.node' }],
  externalsPresets: {
    electronRenderer: true,
    node: true,
  },
  module: {
    rules: [
      {
        test: /\.worklet\.js/,
        type: 'asset/source',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      moseamp: fromRoot('src'),
    },
  },
};
