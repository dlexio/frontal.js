const fPlugin = require('@frontal/plugin')

/**
 * Uses the file-loader for common files used in projects such as Raster Graphics, Fonts and others
 *
 * @type {FilesPlugin}
 */
module.exports = class FilesPlugin extends fPlugin {
  constructor(app) {
    super()
    this.app = app
  }

  webpack(config) {
    config.addModuleRule({
      test: /\.(png|jpe?g|gif|webp)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: 'assets/images/[name].[hash:6].[ext]',
          },
        },
        {
          loader: require.resolve('image-webpack-loader'),
          options: this.app.config.get('files.compress'),
        },
      ],
    })

    config.addModuleRule({
      test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: 'assets/fonts/[name].[hash:6].[ext]',
          },
        },
      ],
    })
  }
}
