const loadUmbracoNodes = require('./load-umbraco-nodes')
const createAndRegisterCommonInterface = require('./create-common-interface')

const validateAndPrepOptions = require('./util/validate-and-prep-options')
const createAndConfigureAxios = require("./util/create-and-configure-axios")

exports.sourceNodes = async (gatsby, pluginOptions) => {
  const options = validateAndPrepOptions(pluginOptions, gatsby.reporter)
  const axios = createAndConfigureAxios(options)

  const helpers = {
    gatsby,
    axios,
    options 
  }

  return Promise.all([
    // TODO loadGlobalData(helpers),
    loadUmbracoNodes(helpers),
  ])
}

exports.createSchemaCustomization = gatsby => {
  createAndRegisterCommonInterface(gatsby)
}
