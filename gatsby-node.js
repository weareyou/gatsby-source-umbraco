const loadUmbracoNodes = require("./lib/load-umbraco-nodes")
const loadGlobalData = require("./lib/load-global-data")
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

  return Promise.all([loadGlobalData(helpers), loadUmbracoNodes(helpers)])
}

exports.createSchemaCustomization = async (gatsby, pluginOptions) => {
  const options = await validateAndPrepOptions(pluginOptions, gatsby.reporter)
  createAndRegisterCommonInterface(gatsby, options)
}

exports.setFieldsOnGraphQLNodeType = require("gatsby-source-filesystem/extend-file-node")
