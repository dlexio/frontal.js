const querystring = require('querystring')
const is = require('is')

module.exports = function (source) {
  const out = []
  const cleanQuery = this.resourceQuery.replace('?', '')
  const opts = querystring.parse(cleanQuery)

  // console.log('query', query);
  //
  // // Return the source as is, if the query does not contain a dlexRules param
  // if (is.undefined(query.opts)) {
  //     return source;
  // }
  //
  // // Parse rules
  // const opts = JSON.parse(query.opts);

  if (is.undefined(opts.globals)) {
    return source
  }

  // Apply an import line for each import rule
  opts.globals.split(',').forEach((f) => {
    out.push(`@import "${f}";`)
  })

  return out.join('\n') + '\n' + source
}
