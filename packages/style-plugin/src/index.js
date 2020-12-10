const _ = require('lodash')
const path = require('path')
const fPlugin = require('@frontal/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const purgecss = require('@fullhuman/postcss-purgecss')
const htmlTags = require('html-tags')

const purgeCSS = (app) => {
  /**
   * This broader extractor is taken from tailwinds source code https://github.com/tailwindlabs/tailwindcss/blob/master/src/lib/purgeUnusedStyles.js
   *
   * @param content
   * @returns {T[]}
   */
  function tailwindExtractor(content) {
    // Capture as liberally as possible, including things like `h-(screen-1.5)`
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
    const broadMatchesWithoutTrailingSlash = broadMatches.map((match) => _.trimEnd(match, '\\'))

    // Capture classes within other delimiters like .block(class="w-1/2") in Pug
    const innerMatches = content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || []

    return broadMatches.concat(broadMatchesWithoutTrailingSlash).concat(innerMatches)
  }

  return purgecss({
    content: [
      path.join(
        app.cwd(),
        app.context(),
        app.config.get('pages.location'),
        app.config.get('pages.partials'),
        '**',
        '*.html'
      ),
      path.join(app.cwd(), app.context(), app.config.get('pages.location'), '**', '*.html'),
      path.join(app.cwd(), app.context(), app.config.get('directories.assets'), '**', '*.js'),
    ],

    defaultExtractor: (content) => {
      return [...tailwindExtractor(content), ...htmlTags]
    },

    safelist: app.config.get('build.purgecss.whitelist', []), // vjs
  })
}

module.exports = class StylePlugin extends fPlugin {
  constructor(app, opts) {
    super(app, opts)

    this.app = app
    this.inDevMode = app.inDevMode()
  }

  webpack(config) {
    // Add support for less
    const lessLoaders = [
      this.inDevMode
        ? {
            loader: require.resolve('style-loader'),
          }
        : {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
      {
        loader: require.resolve('css-loader'),
      },
      {
        loader: require.resolve('less-loader'),
        options: {
          lessOptions: {
            strictMath: true,
          },
        },
      },
    ]
    if (this.inDevMode) {
      lessLoaders.unshift(require.resolve('cache-loader'))
    }
    config.addModuleRule({
      test: /\.less$/,
      use: lessLoaders,
    })

    // Add support for scss
    const postcssPlugins = [
      require('postcss-preset-env')({
        stage: 2,
        features: {
          'focus-within-pseudo-class': false,
        },
      }),
    ]
    // enable purging if in production mode and purgecss is enabled
    if (!this.app.inDevMode() && this.app.config.get('build.purgecss.enabled', true)) {
      postcssPlugins.push(purgeCSS(this.app))
    }
    const scssLoaders = [
      this.inDevMode ? { loader: require.resolve('style-loader') } : { loader: MiniCssExtractPlugin.loader },
      require.resolve('css-loader'),
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            config: true,
            plugins: postcssPlugins,
          },
        },
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          implementation: require('sass'),
          sassOptions: {
            //fiber: require('fibers'),
          },
        },
      },
    ]
    if (this.inDevMode) {
      scssLoaders.unshift(require.resolve('cache-loader'))
    }

    config.addModuleRule({
      test: /\.(sa|sc|c)ss$/,
      exclude: /\.file.(sa|sc|c)ss$/i,
      use: scssLoaders,
    })

    // Enable production plugins
    if (!this.inDevMode) {
      // Extract CSS into their own files
      config.addPlugin(
        new MiniCssExtractPlugin({
          filename: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
            'build.style.into'
          )}/[name].[contenthash].css`,
          chunkFilename: `${this.app.config.get('build.assets.into')}/${this.app.config.get(
            'build.style.into'
          )}/[id].css`,
        })
      )
    }
  }
}
