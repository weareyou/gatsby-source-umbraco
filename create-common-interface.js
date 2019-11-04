const { allTypes } = require("./typeRegistry")

module.exports = gatsby => {
  const interface = "UmbracoNode"
  const interfaceType = createInterfaceTypeDefinition(interface)
  const concreteTypes = allTypes().map(type => buildObjectTypeWithInterface(type, interface, gatsby.schema))

  gatsby.actions.createTypes([
    interfaceType,
    ...concreteTypes
  ])
}

function buildObjectTypeWithInterface(name, interface, schema) {
  return schema.buildObjectType({
    name,
    interfaces: ["Node", interface]
  })
}

function createInterfaceTypeDefinition(name) {
  return `
    interface ${name} @nodeInterface {
      id: ID!
      parent: Node
      children: [Node!]!
      internal: Internal!

      name: String
      slug: String
    }
  `
}