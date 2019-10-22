const validateAndPrepOptions = require('./util/validate-and-prep-options')

exports.sourceNodes = ({ actions }, options) => {
    options = validateAndPrepOptions(options)
}
