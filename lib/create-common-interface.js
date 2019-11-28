const { allTypes } = require("./typeRegistry")
const formatMessage = require("../util/formatMessage")

module.exports = (gatsby, options) => {
  const { name: interface, fields } = options.commonInterface
  gatsby.reporter.verbose(formatMessage(`Creating common interface "${interface}"`))
  const interfaceType = createInterfaceTypeDefinition(interface, fields)
  const concreteTypes = allTypes().map(type => {
    gatsby.reporter.verbose(formatMessage(`Adding interface to type "${type}"`))
    return buildObjectTypeWithInterface(type, interface, gatsby.schema)
  })
  gatsby.actions.createTypes([interfaceType, ...concreteTypes])
}

function buildObjectTypeWithInterface(name, interface, schema) {
  return schema.buildObjectType({
    name,
    interfaces: ["Node", interface],
  })
}

function createInterfaceTypeDefinition(name, fields) {
  const fieldDefinitions = createFieldDefinitions(fields)
  return `
    interface ${name} @nodeInterface {
      id: ID!
      parent: Node
      children: [Node!]!
      internal: Internal!
      ${fieldDefinitions}
    }
  `
}

/**
 * Transform object of GraphQL fields (name:"type") to string representation ("name: type")
 * @param {Object} fields
 */
function createFieldDefinitions(fields) {
  return Object.entries(fields)
    .map(([name, type]) => `${name}: ${type}`)
    .reduce((all, definition) => (all += definition + "\n"), "")
}
