const isReachable = require('is-reachable')
const { isArray, isString } = require('../util/typecheck')

const defaultImageKeys = ["image"]

module.exports = async function validateAndPrepOptions(options, reporter) {
  delete options.plugins

  if (!(await isReachable(options.url))) {
    throwValidationError("url", options.url, reporter, problem = `missing, invalid, or not reachable`)
  }

  if (options.imageKeys) {
    if (!validImageKeys(options.imageKeys))
      throwValidationError("imageKeys", options.imageKeys, reporter)
  } else {
    options.imageKeys = defaultImageKeys
  }

  return options
}

function validImageKeys(imageKeys) {
  return isArray(imageKeys) && imageKeys.every(isString)
}

function throwValidationError(optionName, value, reporter, problem = `invalid`) {
  const message = [
    `The option [${optionName}] passed to gatsby-source-umbraco is ${problem}.`,
    `The current value is: ${JSON.stringify(value)}`,
  ].join("\n")
  reporter.panic(message)
}
