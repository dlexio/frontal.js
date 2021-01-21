module.exports = {
	bundles: {
		main: {
			assets: [
				// if an asset is provided as an object and the provideAs property
				// is defined, that means that jquery will be globally available for use via the $ and jQuery variables
				{path: 'jquery', provideAs: ['$', 'jQuery']},
				'@assets/style/main.scss',
			],

			// target all pages
			pages: ['**/*.html']
		},
		stats: {
			// we will load the stats.js file which initiates charts
			assets: [
				'@assets/js/stats.js'
			],

			// we only want the graph.js library to be loaded for the stats page
			pages: ['**/stats.html']
		}
	}
}