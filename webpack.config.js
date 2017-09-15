const path = require('path');

const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/renderer.js',
  devtool: 'source-map',
  output: {
    filename: 'renderer.bundle.js',
    path: path.resolve(__dirname, 'build'),
  },
  target: 'electron-renderer',
  plugins: [
    new CopyWebpackPlugin([
      {from: './src/main.js', to: 'main.js'},
      {from: './src/index.html', to: 'index.html'},
      {from: './src/font/*', to: 'font/[name].[ext]'},
      {from: './src/css/*', to: 'css/[name].[ext]'},
      {from: './src/img/*', to: 'img/[name].[ext]'},
      {from: './node_modules/react-table/react-table.css', to: 'css/react-table.css'},
      //{from: './Game_Music_Emu-0.5.2/build/gme.dylib', to: 'gme.dylib'},
      {from: './libs/libgme.dylib', to: 'libgme.dylib'},
      {from: './libs/libaosdk.dylib', to: 'libaosdk.dylib'},
    ]),
  ],
  node: {
    __dirname: false,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
