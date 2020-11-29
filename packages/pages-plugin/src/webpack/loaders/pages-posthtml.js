const path = require('path')
const { getOptions } = require('loader-utils')
const posthtml = require('posthtml')
const include = require('posthtml-include')

/**
 * Posthtml integration loader for the partials feature
 *
 * @param source
 * @returns {string}
 */
module.exports = function (source) {
	const ctx = this,
		callback = ctx.async(),
		options = getOptions(ctx)

	const posthtmlPlugins = [
		include({
			encoding: 'utf8',
			root: path.join(options.partialsDir, '/'),
		}),
	]

	posthtml(posthtmlPlugins)
		.process(source)
		.then((result) => {
			// Check messages of type dependency to add them to webpack as a dependency
			result.messages
				.filter((m) => m.type === 'dependency')
				.forEach((msg) => {
					ctx.addDependency(msg.file)
				})

			callback(null, result.html)
		})
		.catch((e) => {
			// console.error('err', e);
			callback(e)
		})
}
