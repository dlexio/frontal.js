const fPlugin = require('@frontal/plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

/**
 * @todo this plugin needs to be rewritten from scratch to only include one logic to handle development and build modes
 *       as well as handling child compilations and page failures nicely.
 */
module.exports = class ErrorsPlugin extends fPlugin {
	constructor(app, opts) {
		super(app, opts)
		this.app = app
		this.config = {
			clearConsole: this.app.inDevMode(),
			additionalTransformers: [
				(error) => {
					if (ErrorsPlugin.isFrontalError(error)) {
						return Object.assign({}, error, {
							type: 'frontal-error',
						})
					}

					return error
				},
			],
			additionalFormatters: [
				(errors) => {
					const lintErrors = errors.filter((e) => e.type === 'frontal-error')
					if (lintErrors.length > 0) {
						errors.forEach((err) => {
							this.app.logger.error(err)
						})
					}

					return []
				},
			],
		}
	}

	static isFrontalError(err) {
		return err.originalStack.some((stackframe) => stackframe.fileName && stackframe.fileName.includes('frontal.js'))
	}

	webpack(webpack) {
		const errorsPlugin = this.app.inDevMode()
			? new FriendlyErrorsWebpackPlugin(this.config)
			: new SimpleErrorsPlugin(this.config)
		webpack.addPlugin(errorsPlugin)
	}
}

class SimpleErrorsPlugin {
	constructor(config) {
		this.friendlyErrorsWebpackPlugin = new FriendlyErrorsWebpackPlugin(config)
	}

	isMultiStats(stats) {
		return stats.stats
	}

	extractErrorsFromStats(stats, type) {
		if (this.isMultiStats(stats)) {
			return stats.stats.reduce((errors, stats) => errors.concat(this.extractErrorsFromStats(stats, type)), [])
		}

		return stats.compilation[type]
	}

	apply(compiler) {
		compiler.hooks.done.tap('FrontalErrorsPlugin', (stats) => {
			const hasErrors = stats.hasErrors()
			const hasWarnings = stats.hasWarnings()

			if (hasErrors) {
				this.friendlyErrorsWebpackPlugin.displayErrors(this.extractErrorsFromStats(stats, 'errors'), 'error')
				return
			}

			if (hasWarnings) {
				this.friendlyErrorsWebpackPlugin.displayErrors(this.extractErrorsFromStats(stats, 'warnings'), 'warning')
			}
		})
	}
}
