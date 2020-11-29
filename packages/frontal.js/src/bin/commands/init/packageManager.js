const { execSync } = require('child_process')

module.exports = class PackageManager {
	init() {
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
		// Handle yarn install
		if (this.bin === 'yarn') {
			execSync(`yarn add ${name}@${version}`, { stdio: 'ignore' })
		}

		if (this.bin === 'npm') {
			execSync(`npm install ${name}@${version}`, { stdio: 'ignore' })
		}
	}
}
