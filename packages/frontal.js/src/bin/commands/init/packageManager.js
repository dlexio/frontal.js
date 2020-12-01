const { execSync } = require('child_process')

module.exports = class PackageManager {
  init(context) {
    this.context = context

    return new Promise((resolve) => {
      this.bin = this.detectBinary()
      resolve()
    })
  }

  detectBinary() {
    return this.hasYarn() ? 'yarn' : 'npm'
  }

  hasYarn() {
    try {
      execSync('yarn --version', { stdio: 'ignore' })
      return true
    } catch (e) {
      return false
    }
  }

  install(name, version) {
    const cmdOpts = { cwd: this.context, stdio: 'ignore' }

    // Handle yarn install
    if (this.bin === 'yarn') {
      execSync(`yarn add ${name}@${version}`, cmdOpts)
    }

    if (this.bin === 'npm') {
      execSync(`npm install ${name}@${version}`, cmdOpts)
    }
  }
}
