module.exports = {
  bundles: {
    main: {
      assets: ['@assets/js/app.js'],
      components: {
        buttons: true,
        modals: true,
      },
      pages: ['**/*.html'],
    },
  },
}
