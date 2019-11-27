const isReachable = require("is-reachable")
const { isObject, isString } = require("../util/typecheck")
const formatMessage = require("../util/formatMessage")

const defaultOptions = {
  sitemapRoute: "sitemap",
  typePrefix: "",
  commonInterface: {
    name: "UmbracoNode",
    fields: {},
  },
  remoteFileSuffix: "___FILE",
  foreignKeySuffix: "___ID",
}

module.exports = async function validateAndPrepOptions(options, reporter) {
  options = prepOptions(options)

  if (!(await isReachable(options.url))) {
    throwValidationError(
      "url",
      options.url,
      reporter,
      (problem = `missing, invalid, or not reachable`)
    )
  }

  if (!isValidURL(options.sitemapRoute, (base = options.url))) {
    throwValidationError("sitemapRoute", options.sitemapRoute, reporter)
  }

  if (!isString(options.typePrefix)) {
    throwValidationError("typePrefix", options.typePrefix, reporter)
  }

  if (!isString(options.remoteFileSuffix) || options.remoteFileSuffix.length < 1) {
    throwValidationError("remoteFileSuffix", options.remoteFileSuffix, reporter)
  }

  if (!isString(options.foreignKeySuffix) || options.foreignKeySuffix.length < 1) {
    throwValidationError("foreignKeySuffix", options.foreignKeySuffix, reporter)
  }

  validateCommonInterface(options.commonInterface, reporter)

  return options
}

function prepOptions(options) {
  delete options.plugins

  options.commonInterface = Object.assign(
    {},
    defaultOptions.commonInterface,
    options.commonInterface
  )

  options = Object.assign({}, defaultOptions, options)
  return options
}

function validateCommonInterface({ name, fields }, reporter) {
  if (!isString(name) || name.length < 1) {
    throwValidationError("commonInterface.name", name, reporter)
  }
  if (
    !isObject(fields) ||
    !Object.values(fields).every(val => isString(val) && val.length > 0)
  ) {
    throwValidationError("commonInterface.fields", fields, reporter)
  }
}

/**
 * Check if url is valid.
 * Using native URL constructor.
 * @param {String} url
 * @param {String} [base]
 */
function isValidURL(url, base) {
  if (!isString(url)) return false
  try {
    new URL(url, base)
    return true
  } catch {
    return false
  }
}

function throwValidationError(
  optionName,
  value,
  reporter,
  problem = `invalid`
) {
  const message = formatMessage(
    `The option [${optionName}] is ${problem}.`,
    `The current value is: ${JSON.stringify(value)}`
  )
  reporter.panic(message)
}
