const isReachable = require('is-reachable')
const { isArray, isString } = require('../util/typecheck')
const formatMessage = require("../util/formatMessage")

const defaultOptions = {
  imageKeys: ["image"],
}

module.exports = async function validateAndPrepOptions(options, reporter) {
  delete options.plugins
  options = Object.assign({}, defaultOptions, options)

  if (!(await isReachable(options.url))) {
    throwValidationError("url", options.url, reporter, problem = `missing, invalid, or not reachable`)
  }

  if (!validImageKeys(options.imageKeys)) {
    throwValidationError("imageKeys", options.imageKeys, reporter)
  }

  return options
}

function validImageKeys(imageKeys) {
  return isArray(imageKeys) && imageKeys.every(isString)
}

function throwValidationError(optionName, value, reporter, problem = `invalid`) {
  const message = formatMessage(
    `The option [${optionName}] is ${problem}.`,
    `The current value is: ${JSON.stringify(value)}`,
  )
  reporter.panic(message)
}
