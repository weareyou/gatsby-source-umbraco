const validateAndPrepOptions = require('./validate-and-prep-options')

exports.sourceNodes = ({ actions }, options) => {
    options = validateAndPrepOptions(options)
}

