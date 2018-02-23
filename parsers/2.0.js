const _ = require('lodash');

const indent = function (str) {
    return _.map(str.split('\n'), function (line) {
        return '  ' + line;
    }).join('\n');
};

const missingRefPropType = function(props, propName, componentName) {
    return new Error('PropType could not be determined due to a missing Swagger model definition reference');
};

const unknownPropType = function(props, propName, componentName) {
    return new Error('PropType could not be determined from Swagger model definition');
};

const getPropType = function (definition, exporting = false) {
    if (definition.enum) {
        return 'PropTypes.oneOf(' + JSON.stringify(definition.enum, null, 4) + ')';
    }
    if (definition.$$ref && !exporting) {
        const name = definition.$$ref.match('#/definitions/(.*)')[1];
        return name === 'undefined' ? missingRefPropType.toString() : name;
    }
    switch (definition.type) {
    case 'object':
        if(_.isEmpty(definition.properties)) {
            return 'PropTypes.object';
        }
        return 'PropTypes.shape({\n'
            + indent(_.map(definition.properties, function (property, name) {
                let keyPropType = convertDefinitionObjectToPropTypes(property, name);
                if (_.contains(definition.required || [], name)) {
                    keyPropType += '.isRequired';
                }
                return keyPropType;
            }).join(',\n')) +
        '\n})';
    case 'array':
        return 'PropTypes.arrayOf(' + getPropType(definition.items) + ')';
    case 'string':
        return 'PropTypes.string';
    case 'integer':
    case 'number':
        return 'PropTypes.number';
    case 'boolean':
        return 'PropTypes.bool';
    default:
        return unknownPropType.toString();
    }
};

const exportDefinition = function (definition, name) {
    return `export const ${name} = ${getPropType(definition, true)};`;
};

const convertDefinitionObjectToPropTypes = function (definition, name) {
    return name + ': ' + getPropType(definition);
};

module.exports = function (swagger) {
    let output = [];

    const header = 'Generated PropTypes for ' + swagger.url;
    output.push('/**\n' + header + '\n**/\n\n');

    output.push('import PropTypes from "prop-types";\n\n');

    const propTypes = _.map(swagger.spec.definitions, function (model, name) {
        return exportDefinition(model, name);
    });

    output.push(propTypes.join('\n\n'));
    output.push('\n');
    return output.join('');
};
