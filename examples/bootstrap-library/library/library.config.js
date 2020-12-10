module.exports = (opts, lib) => {
  // import jquery and make it globally available with '$' and 'jQuery'
  lib.js.import({ path: 'jquery', provideAs: ['$', 'jQuery'] })

  // import bootstrap core javascript
  // lib.js.import('bootstrap/js/src');

  // Apply bootstrap globals
  lib.style.global(
    '@library/assets/style/variables.scss',
    'bootstrap/scss/functions.scss',
    'bootstrap/scss/variables.scss',
    'bootstrap/scss/mixins.scss'
  )

  // Apply bootstrap style files
  lib.style.import(
    'bootstrap/scss/_reboot.scss',
    'bootstrap/scss/_type.scss',
    'bootstrap/scss/_images.scss',
    'bootstrap/scss/_code.scss',
    'bootstrap/scss/_grid.scss',
    'bootstrap/scss/_utilities.scss',
    '@library/assets/style/main.scss'
  )

  // Register all components with the given config path filter
  lib.components.autoRegister(lib.path('components/**/*.config.js'))
}
