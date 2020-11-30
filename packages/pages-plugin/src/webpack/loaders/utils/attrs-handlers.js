const srcset = require('srcset')

/**
 * Normal src handler
 *
 * @param val
 * @param addModule
 */
module.exports.srcHandler = (val, addModule) => {
  val = val.trim().replace(/\r?\n|\r/g, '')

  return new Promise((resolve, reject) => {
    addModule(val, (err, newUrl) => {
      if (err) {
        reject(err)
      } else {
        resolve(newUrl)
      }
    })
  })
}

/**
 * srcset handler
 *
 * @param val
 * @param addModule
 */
module.exports.srcsetHandler = (val, addModule) => {
  const promises = []
  const srcUrls = srcset.parse(val)

  return new Promise((resolve, reject) => {
    for (const src of srcUrls) {
      const url = src.url

      promises.push(
        new Promise((_resolve, _reject) => {
          addModule(url, (err, newUrl) => {
            if (err) {
              _reject(err)
            } else {
              _resolve({
                ...src,
                url: newUrl,
              })
            }
          })
        })
      )
    }

    Promise.all(promises)
      .then((newSrcSet) => {
        resolve(srcset.stringify(newSrcSet))
      })
      .catch((e) => reject(e))
  })
}
