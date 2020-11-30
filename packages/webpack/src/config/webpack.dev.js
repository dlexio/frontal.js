const webpack = require('webpack')

module.exports = () => ({
  mode: 'development',
  devtool: 'eval-source-map',
  plugins: [new webpack.HotModuleReplacementPlugin()],
})
