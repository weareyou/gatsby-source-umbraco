const { isArray, isString } = require('./typecheck')

const defaultImageKeys = ["image"]

module.exports = function validateAndPrepOptions(options, reporter) {
  delete options.plugins

  if (!validUrl(options.url)) {
    throwValidationError("url", options.url, reporter)
  }

  if (options.imageKeys) {
    if (!validImageKeys(options.imageKeys))
      throwValidationError("imageKeys", options.imageKeys, reporter)
  } else {
    options.imageKeys = defaultImageKeys
  }

  return options
}
function validUrl(url) {
  return isString(url) && url.length > 0
}

function validImageKeys(imageKeys) {
  return isArray(imageKeys) && imageKeys.every(isString)
}

function throwValidationError(optionName, value, reporter) {
  reporter.panic(`
The option [${optionName}] passed to gatsby-source-umbraco is invalid.
The current value is:

  ${JSON.stringify(value)}
  `)
}
