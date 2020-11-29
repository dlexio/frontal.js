const is = require('is')
const webpack = require('webpack')
const webpackConfig = require('./config')
const common = require('./config/webpack.common')
const dev = require('./config/webpack.dev')
const prod = require('./config/webpack.prod')

/**
 * Webpack class constructs a new instance of webpack using
 * base configuration with environment based config as well as
 * webpack configuration via Frontal Plugins.
 *
 * @type {Webpack}
 */
module.exports = class Webpack {
	constructor(frontalApp) {
		// Construct a new WebpackConfig instance
		const conf = new webpackConfig()

		// Apply common webpack configuration
		conf.merge(common(frontalApp))

		// Apply environment based webpack configuration
		if (frontalApp.inDevMode()) {
			conf.merge(dev(frontalApp))
		} else {
			conf.merge(prod(frontalApp))
		}

		// Apply plugins webpack config modifications
		for (const plugin of frontalApp.plugins) {
			if (is.function(plugin.webpack)) {
				plugin.webpack(conf)
			}
		}

		// frontalApp.logger.info('conf.getConfig()', conf.getConfig().module.rules[0]);

		// Initiate a new webpack compiler using the built config
		this._compiler = webpack(conf.getConfig())
	}

	/**
	 * Returns webpack compiler instance
	 *
	 * @returns {Compiler | * | MultiCompiler}
	 */
	compiler() {
		return this._compiler
	}

	/**
	 * Runs the webpack compiler
	 *
	 * @param handler
	 */
	run(handler) {
		this._compiler.run(handler)
	}
}
