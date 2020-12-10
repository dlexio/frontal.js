module.exports = () => ({
  // the name of the component
  name: 'modals',

  // the setup method of the component
  setup(lib, opts) {
    // import the modal.js from within the bootstrap package
    lib.js.import('bootstrap/js/src/modal')

    // import the style file for modal
    lib.style.import('bootstrap/scss/_modal.scss')
  },
})
