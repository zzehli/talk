export function simpleFunctionToSchema(func, options = {}) {
    if (typeof func !== 'function') throw new Error('Argument must be a function');
    const name = func.name || 'anonymous';
    const description = options.description || '';
    const parameterTypes = options.parameterTypes || {};
    // Extract parameter names
    const match = func.toString().match(/^[^(]*\(([^)]*)\)/);
    const paramString = match ? match[1] : '';
    const params = paramString.split(',').map(p => p.trim()).filter(Boolean);
    const properties = {};
    params.forEach(param => {
        properties[param] = {
            type: parameterTypes[param] || 'string',
            description: `Parameter ${param}`
        };
    });
    return {
        type: 'function',
        function: {
            name,
            description: description || `Function ${name}`,
            parameters: {
                type: 'object',
                properties,
                required: params,
                additionalProperties: false
            }
        }
    };
}
