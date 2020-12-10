module.exports = () => ({
  name: 'buttons',
  setup(lib, opts) {
    lib.style.import('bootstrap/scss/_buttons.scss', 'bootstrap/scss/_button-group.scss')
  },
})
