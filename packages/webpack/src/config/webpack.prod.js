const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = (frontalApp) => {
	return {
		mode: 'production',
		output: {
			path: path.join(frontalApp.cwd(), frontalApp.config.get('build.path')),
			filename: () => {
				return 'assets/js/[name].[fullhash].js'
			},
		},
		plugins: [
			new CopyPlugin({
				patterns: [
					{
						from: path.join(frontalApp.cwd(), frontalApp.context(), frontalApp.config.get('server.public')),
						to: path.join(frontalApp.cwd(), frontalApp.config.get('build.path')),
						noErrorOnMissing: true,
					},
				],
				options: {
					concurrency: 100,
				},
			}),
			new CleanWebpackPlugin(),
		],
	}
}
