const validateAndPrepOptions = require("./util/validate-and-prep-options")
const createAndConfigureAxios = require("./util/create-and-configure-axios")

exports.sourceNodes = ({ actions }, options) => {
  const { createNode } = actions
  options = validateAndPrepOptions(options)
  const axios = createAndConfigureAxios(options)
}
