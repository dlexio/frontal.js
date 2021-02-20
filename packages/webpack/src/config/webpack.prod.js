const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (frontalApp) => {
  return {
    mode: 'production',
    output: {
      path: path.join(frontalApp.cwd(), frontalApp.config.get('directories.build')),
      filename: () => {
        return `${frontalApp.config.get('build.assets.into')}/${frontalApp.config.get(
          'build.js.into'
        )}/[name].[contenthash].js`
      },
    },
    optimization: {
      minimize: true,
      minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(frontalApp.cwd(), frontalApp.context(), frontalApp.config.get('directories.public')),
            to: path.join(frontalApp.cwd(), frontalApp.config.get('directories.build')),
            noErrorOnMissing: true,
          },
        ],
        options: {
          concurrency: 100,
        },
      }),
    ],
  }
}
