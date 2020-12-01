const path = require('path')
const fs = require('fs')
const fPlugin = require('@frontal/plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const StylelintPlugin = require('stylelint-webpack-plugin')

module.exports = class LintPlugin extends fPlugin {
  constructor(app) {
    super()
    const ctx = this
    this.app = app

    // Auto support eslint
    const esLintRc = path.join(this.app.cwd(), this.app.context(), '.eslintrc.json')
    this.eslint = fs.existsSync(esLintRc)
    this.app.watcher.watch(esLintRc, () => {
      ctx.app.restart()
    })

    // Auto support stylelint
    const styleLintRc = path.join(this.app.cwd(), this.app.context(), '.stylelintrc.json')
    this.stylelint = fs.existsSync(styleLintRc)
    this.app.watcher.watch(styleLintRc, () => {
      ctx.app.restart()
    })
  }

  webpack(config) {
    // ignore if not in development mode
    if (!this.app.inDevMode()) {
      return
    }

    // Support eslint if indicated
    if (this.eslint) {
      config.addPlugin(
        new ESLintPlugin({
          context: path.join(this.app.cwd(), this.app.context()),
        })
      )
    }

    // Support stylelint if indicated
    if (this.stylelint) {
      config.addPlugin(new StylelintPlugin({}))
    }
  }
}
