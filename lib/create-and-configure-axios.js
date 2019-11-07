const axios = require("axios").default
const formatMessage = require("../util/formatMessage")

module.exports = function createAndConfigureAxios(gatsby, options) {
  const config = {
    baseURL: options.url,
  }
  const instance = axios.create(config)
  configureInterceptors(gatsby, instance)
  return instance
}

function configureInterceptors(gatsby, axios) {
  axios.interceptors.request.use(logRequest)
  axios.interceptors.response.use(logResponse, logError)

  function logRequest(config) {
    const message = formatMessage(`axios → ${config.method} ${config.url}`)
    gatsby.reporter.verbose(message)
    return config
  }

  function logResponse(response) {
    logResponseMessage(response)
    return response
  }

  function logError(error) {
    logResponseMessage(error.response)
    return Promise.reject(error)
  }

  function logResponseMessage(response) {
    const message = formatMessage(
      `axios ← ${response.status} (${response.config.method} ${response.config.url})`
    )
    gatsby.reporter.verbose(message)
  }
}
