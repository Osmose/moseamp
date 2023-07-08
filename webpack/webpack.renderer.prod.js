const merge = require('webpack-merge');
const common = require('./webpack.renderer.config.js');

module.exports = merge(common, {
  mode: 'production',
});
