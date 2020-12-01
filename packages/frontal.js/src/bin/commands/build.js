const path = require('path')
const Config = require('@frontal/config')
const frontal = require('../../frontal')
process.env.NODE_ENV = 'production'

module.exports = async (dir, cmd) => {
  const cwd = process.cwd()
  const opts = cmd.opts()

  // Define a default dir if not defined
  const context = dir === undefined ? '.' : dir
  const configPath = path.join(cwd, context, opts.config)

  // Initiate a new configuration instance
  const config = new Config(cwd, configPath, {})

  // Initiate and run a new DlexApp instance
  const app = new frontal(config, {
    cwd,
    context,
    devMode: false,
  })

  // Start development server
  try {
    await app.build()
  } catch (err) {
    app.logger.error('build failed: %s', err)
  }

  process.exit(0)
}
