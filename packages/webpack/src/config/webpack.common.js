const path = require('path')
const WebpackBar = require('webpackbar')
const frontalBundlesPlugin = require('../plugins/bundles-plugin')
const TimeFixPlugin = require('time-fix-plugin')

module.exports = (frontalApp) => {
  return {
    context: path.resolve(frontalApp.cwd(), frontalApp.context()),
    stats: false,
    target: 'web',
    entry: {},
    output: {
      publicPath: frontalApp.config.get('server.base'),
    },
    resolve: {
      alias: {
        '@assets': path.join(
          frontalApp.cwd(),
          frontalApp.context(),
          frontalApp.config.get('assets.path')
        ),
      },
      modules: ['node_modules', path.join(frontalApp.cwd(), './node_modules')],
    },
    infrastructureLogging: {
      level: 'none',
    },
    module: {
      rules: [],
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    performance: {
      hints: false,
    },
    optimization: {
      runtimeChunk: frontalApp.inDevMode() ? 'single' : false,
      splitChunks: {
        cacheGroups: {
          globalVendor: {
            name: 'vendor',
            chunks: 'initial',
            minChunks: 2,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module, chunks, cacheGroupKey) {
              const allChunksNames = chunks.map((item) => item.name).join('~')
              return `${cacheGroupKey}-${allChunksNames}`
            },
            chunks: 'all',
          },
        },
      },
    },
    plugins: [
      new WebpackBar(),
      new TimeFixPlugin(),
      new frontalBundlesPlugin(frontalApp),
    ],
  }
}
