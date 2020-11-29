module.exports = {
	plugins: [
		{
			plugin: require.resolve('@frontal/nextjs-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/lint-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/files-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/errors-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/style-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/library-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/hmr-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/pages-plugin'),
			options: {},
		},
		{
			plugin: require.resolve('@frontal/icons-plugin'),
			options: {},
		},
	],

	assets: {
		path: 'assets',
	},

	files: {
		compress: {},
	},

	// server provides configuration options to customize the behaviour of the server
	// that serves either in development or production modes
	server: {
		host: undefined,
		port: 3000,
		public: 'public',
		base: '/',
	},

	// build
	build: {
		path: '.frontal',
	},

	// pages in frontal
	pages: {
		path: './pages',
		extensions: ['html', 'pug', 'ejs'],
		html: {
			// Define 'beautify' or 'minify' to reformat the source code of the HTML files, use false to disable this feature
			format: 'beautify',
		},
	},

	// bundles allows configuring adding different bundles into the build pipeline
	// to enable choosing certain bundles for different pages for optimal performance.
	bundles: {
		main: {
			// assets is an array of modules or files to include in this bundle,
			// files can be of any supported type, either js or styling files.
			assets: ['@assets/app.js'],

			// pages enables select
			pages: ['**/*.html'],
		},
	},
}
