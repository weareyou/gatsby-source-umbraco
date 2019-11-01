const axios = require("axios").default

module.exports = function createAndConfigureAxios(options) {
  const config = {
    baseURL: options.url,
  }
  return axios.create(config)
}
