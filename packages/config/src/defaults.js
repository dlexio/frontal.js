module.exports = {
  // directories defines the locations of the primary directories that Frontal requires
  directories: {
    assets: 'assets',
    build: '.frontal',
    public: 'public',
  },

  // Build provides instructions for the build process, such as locations of each file type as well optimization options
  build: {
    assets: {
      into: 'assets',
    },
    js: {
      into: 'js',
    },
    style: {
      into: 'style',
    },
    images: {
      into: 'images',
      optimize: {},
    },
    videos: {
      into: 'videos',
    },
    fonts: {
      into: 'fonts',
    },
  },

  // server provides configuration options to customize the behaviour of the server
  // that serves either in development or production modes
  server: {
    host: undefined,
    port: 3000,
    public: 'public',
    base: '/',
  },

  // pages provides configuration options for the pages plugin
  pages: {
    location: 'pages',
    partials: '.partials',
    extensions: ['html'],
    html: {
      // Define 'beautify' or 'minify' to reformat the source code of the HTML files, use false to disable this feature
      // format: false,
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

  // plugins is an array of plugins to enable with Frontal
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
}
