const path = require('path');

const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    renderer: './src/renderer.js',
  },
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
  },
  target: 'electron-renderer',
  plugins: [
    new CopyWebpackPlugin([
      { from: './src/main.js', to: 'main.js' },
      { from: './src/index.html', to: 'index.html' },
      { from: './src/css/*', to: 'css/[name].[ext]' },
      { from: './src/img/*', to: 'img/[name].[ext]' },
      {
        from: './node_modules/@fortawesome/fontawesome-free/css/all.css',
        to: 'css/fontawesome.css',
      },
      {
        from: './node_modules/@fortawesome/fontawesome-free/webfonts/*',
        to: 'webfonts/[name].[ext]',
      },
      { from: './musicplayer/data', to: 'musicplayer_data' },
    ]),
  ],
  node: {
    __dirname: false,
  },
  externals: [
    nodeExternals(),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  resolve: {
    alias: {
      moseamp: path.resolve(__dirname, 'src'),
    },
  },
};
