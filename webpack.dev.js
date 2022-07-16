const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

const common = require('./webpack.config.js');

module.exports = merge(common, {
  externals: [nodeExternals()],
});
