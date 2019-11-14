const isReachable = require("is-reachable")
const { isArray, isString } = require("../util/typecheck")
const formatMessage = require("../util/formatMessage")

const defaultOptions = {
  sitemapRoute: "sitemap",
  globalDataRoute: "globaldata",
  typePrefix: "",
  remoteFileSuffix: "___FILE",
  foreignKeySuffix: "___ID",
}

module.exports = async function validateAndPrepOptions(options, reporter) {
  delete options.plugins
  options = Object.assign({}, defaultOptions, options)

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

  if (!isValidURL(options.globalDataRoute, (base = options.url))) {
    throwValidationError("globalDataRoute", options.globalDataRoute, reporter)
  }

  if (!isString(options.typePrefix)) {
    throwValidationError("typePrefix", options.typePrefix, reporter)
  }

  if (!isString(options.remoteFileSuffix) || options.remoteFileSuffix < 1) {
    throwValidationError("remoteFileSuffix", options.remoteFileSuffix, reporter)
  }

  if (!isString(options.foreignKeySuffix) || options.foreignKeySuffix < 1) {
    throwValidationError("foreignKeySuffix", options.foreignKeySuffix, reporter)
  }

  return options
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
