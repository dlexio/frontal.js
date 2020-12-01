const path = require('path')
const fs = require('fs-extra')
const consola = require('consola')
const PackageManager = require('./packageManager')
const { clearConsole } = require('../utils')

module.exports = class Initiator {
  constructor(context, config) {
    this.context = context
    this.config = config
    this.logger = consola.create({})
    this.packageManager = new PackageManager()
  }

  async writeFile(file, contents) {
    const data = new Uint8Array(Buffer.from(contents))
    await fs.ensureDir(path.dirname(file))
    await fs.writeFile(file, data)
  }

  async Initiate(context) {
    const files = this.config.files
    const packages = this.config.packages

    // Clear out the console
    clearConsole()

    // Ensure initial project directory exists
    await fs.ensureDir(context)

    // Install packages
    if (Object.keys(packages).length > 0) {
      // Initiate the package manager if needed
      await this.packageManager.init(context)

      this.logger.info('Installing packages...')

      for (const pkgName of Object.keys(packages)) {
        const pkgVersion = packages[pkgName]
        this.logger.info(`Installing \`${pkgName}@${pkgVersion}\`...`)
        await this.packageManager.install(pkgName, pkgVersion)
      }
    }

    // Write files
    this.logger.info('Writing files...')
    for (const fileName of Object.keys(files)) {
      const fileContent = files[fileName]
      await this.writeFile(path.join(this.context, fileName), fileContent.join('\n'))
    }

    this.logger.success('Initiated Successfully')

    // Auto run frontal dev
    this.logger.info(`Run \`$ ${context === '.' ? `frontal dev` : `cd ${context} && frontal dev`}\``)
  }
}
