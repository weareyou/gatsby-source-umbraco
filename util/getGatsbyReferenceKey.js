/**
 * Turn a key name into a Gatsby foreign key field name by adding the appropriate
 * suffix. Optionally replacing any suffix the key name currently has.
 *
 * Gatsby has a convention for naming foreign key fields. It uses this convention
 * to create references between nodes. See:
 * https://www.gatsbyjs.org/docs/schema-gql-type/#foreign-key-reference-___node
 *
 * @param {String} key full key name
 * @param {String} [suffix]
 */
module.exports = function getGatsbyReferenceKey(key, suffix = "") {
  const keyName = key.slice(0, -suffix.length)
  return keyName + "___NODE"
}
