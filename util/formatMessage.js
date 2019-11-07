/**
 * Format a message for logging purposes. If multiple lines are passed, they
 * are joined by a newline character
 *
 * @param {...String} lines
 */
module.exports = (...lines) => {
  const prefix = "[source-umbraco] "
  const message = lines.join("\n")
  return prefix + message
}
