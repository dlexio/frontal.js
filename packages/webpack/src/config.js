const { merge, mergeWithRules, mergeWithCustomize, customizeArray, unique } = require('webpack-merge')

module.exports = class WebpackConfig {
	constructor() {
		this._config = {}
	}

	getConfig() {
		return this._config
	}

	merge(conf) {
		this._config = merge(this._config, conf)
	}

	prependPlugin(plugin) {
		this._config = mergeWithCustomize({
			customizeArray: customizeArray({
				'plugins.*': 'prepend',
			}),
		})(this._config, { plugins: [plugin] })
	}

	addPlugin(plugin) {
		this._config = mergeWithCustomize({
			customizeArray: unique('plugins', [], (plugin) => plugin.constructor && plugin.constructor.name),
		})(this._config, { plugins: [plugin] })
	}

	addModuleRule(moduleRule) {
		this._config = mergeWithRules({
			module: {
				rules: {
					test: 'match',
					// use: {
					//     loader: "match",
					//     options: "replace"
					// }
				},
			},
		})(this._config, {
			module: {
				rules: [moduleRule],
			},
		})
	}
}
