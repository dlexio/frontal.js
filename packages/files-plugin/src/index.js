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
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
              'build.images.into'
            )}/[name].[hash:6].[ext]`,
          },
        },
        {
          loader: require.resolve('image-webpack-loader'),
          options: this.app.config.get('build.images.optimize'),
        },
      ],
    })
    config.addModuleRule({
      test: /\.file.(css)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
              'build.style.into'
            )}/[name].[hash:6].[ext]`,
          },
        },
      ],
    })
    config.addModuleRule({
      test: /\.file.(js)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
              'build.js.into'
            )}/[name].[hash:6].[ext]`,
          },
        },
      ],
    })
    config.addModuleRule({
      test: /\.(mp4|webm|mov)$/i,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
              'build.videos.into'
            )}/[name].[hash:6].[ext]`,
          },
        },
      ],
    })

    config.addModuleRule({
      test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            name: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
              'build.fonts.into'
            )}/[name].[hash:6].[ext]`,
          },
        },
      ],
    })
  }
}
