const isReachable = require("is-reachable")
const { isArray, isObject, isString } = require("../util/typecheck")
const formatMessage = require("../util/formatMessage")

const defaultOptions = {
  imageKeys: ["image"],
  sitemapRoute: "sitemap",
  globalDataRoute: "globaldata",
  typePrefix: "",
  commonInterface: {
    name: "UmbracoNode",
    fields: {},
  },
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

  if (!validImageKeys(options.imageKeys)) {
    throwValidationError("imageKeys", options.imageKeys, reporter)
  }

  if (!isValidURL(options.globalDataRoute, (base = options.url))) {
    throwValidationError("globalDataRoute", options.globalDataRoute, reporter)
  }

  if (!isString(options.typePrefix)) {
    throwValidationError("typePrefix", options.typePrefix, reporter)
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

function validImageKeys(imageKeys) {
  return isArray(imageKeys) && imageKeys.every(isString)
}

function validateCommonInterface({ name, fields }, reporter) {
  if (!isString(name) || name.length < 1) {
    throwValidationError("commonInterface.name", name, reporter)
  }
  if (!isObject(fields) || !Object.values(fields).every(isString)) {
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
