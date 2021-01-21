module.exports = {
	bundles: {
		main: {
			assets: [
				'@assets/style/tailwind.scss',
				'@assets/style/custom.scss',
				'@assets/js/app.js'
			],
			pages: ['**/*.html']
		}
	}
}