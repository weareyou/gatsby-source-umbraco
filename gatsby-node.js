const validateAndPrepOptions = require("./util/validate-and-prep-options")

exports.sourceNodes = ({ actions }, options) => {
  const { createNode } = actions
  options = validateAndPrepOptions(options)
}
