const axios = require("axios");

module.exports = function createAndConfigureAxios(options) {
    const config = {
        baseURL: options.url,
    }
    return axios.create(config)
}