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

/*
 * Validation functions
 */

function validUrl(url) {
  return typeof url === "string" && url.length > 0
}

function validImageKeys(imageKeys) {
  return isArray(imageKeys) && imageKeys.every(isString)
}

/*
 * Helper functions
 */

function isArray(val) {
  return Array.isArray(val)
}

function isString(val) {
  return typeof val == "string"
}

function throwValidationError(optionName, value, reporter) {
  reporter.panic(`
The option [${optionName}] passed to gatsby-source-umbraco is invalid.
The current value is:

  ${JSON.stringify(value)}
  `)
}
