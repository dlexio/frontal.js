const path = require('path')
const Config = require('@frontal/config')
const frontal = require('../../frontal')

module.exports = (dir, cmd) => {
  const cwd = process.cwd()
  const opts = cmd.opts()

  // Define a default dir if not defined
  const context = dir === undefined ? '.' : dir
  const configPath = path.join(cwd, context, opts.config)

  // Initiate a new configuration instance
  const config = new Config(cwd, configPath, {
    server: {
      host: opts.host,
      port: opts.port,
    },
  })

  // Initiate and run a new DlexApp instance
  const app = new frontal(config, {
    cwd,
    context,
    devMode: false,
  })

  // Start development server
  app.serve()
}
