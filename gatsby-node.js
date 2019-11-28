const loadUmbracoNodes = require("./lib/load-umbraco-nodes")
const createAndRegisterCommonInterface = require("./lib/create-common-interface")
const validateAndPrepOptions = require("./lib/validate-and-prep-options")
const createAndConfigureAxios = require("./lib/create-and-configure-axios")

exports.sourceNodes = async (gatsby, pluginOptions) => {
  const options = await validateAndPrepOptions(pluginOptions, gatsby.reporter)
  const axios = createAndConfigureAxios(gatsby, options)

  const helpers = {
    gatsby,
    axios,
    options,
  }

  await loadUmbracoNodes(helpers)
  createAndRegisterCommonInterface(gatsby, options)
}

exports.setFieldsOnGraphQLNodeType = require("gatsby-source-filesystem/extend-file-node")
