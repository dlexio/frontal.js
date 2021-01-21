module.exports = {
  // Define the tag name that Frontal will look up SVGs within HTML pages
  tag: 'i-svg',

  // Attribute names to strip from SVGs tags
  strip: {
    width: true,
    height: true,
  },

  // map is a key/value of shortcuts to use when resolving svgs to make usage simpler.
  // the following example will replace the `fa` within <i-svg src="fa/solid/right-arrow">
  // with the provided value
  map: {
    fa: '@fortawesome/fontawesome-free/svgs'
  },
};
