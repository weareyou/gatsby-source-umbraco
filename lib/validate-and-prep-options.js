const { isArray, isString } = require('../util/typecheck')

const defaultImageKeys = ["image"]

module.exports = function validateAndPrepOptions(options, reporter) {
  delete options.plugins

  validateUrl(options.url, reporter)

  if (options.imageKeys) {
    if (!validImageKeys(options.imageKeys))
      throwValidationError("imageKeys", options.imageKeys, reporter)
  } else {
    options.imageKeys = defaultImageKeys
  }

  return options
}

function validateUrl(url, reporter) {
  try {
    new URL(url)
  } catch (error) {
    console.error(error)
    throwValidationError("url", url, reporter)
  }
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
