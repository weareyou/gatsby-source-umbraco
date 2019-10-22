module.exports = function validateAndPrepOptions(options) {
  delete options.plugins
  if (!validUrl(options.url))
    throw new Error("[url] option is invalid or missing. Value: " + options.url)
  return options
}

function validUrl(url) {
  return typeof url === "string" && url.length > 0
}
