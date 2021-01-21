module.exports = {
	build: {
		purgecss: {
			enabled: false
		}
	},

	bundles: {
		main: {
			assets: [
				'@assets/css/style.scss',
				'@assets/js/app.js'
			],
			pages: ['**/*.html']
		}
	}
}