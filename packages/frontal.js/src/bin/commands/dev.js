const path = require('path')
const Config = require('@frontal/config')
const frontal = require('../../frontal')
const open = require('open')

module.exports = (dir, cmd) => {
  process.env.NODE_ENV = 'development'
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
    devMode: true,
  })

  // setInterval(() => {
  //     const used = process.memoryUsage().heapUsed / 1024 / 1024;
  //     console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  // }, 1000);

  // Start development server
  app.start((addr) => {
    if (opts.open) {
      open(addr)
    }
  })
}
