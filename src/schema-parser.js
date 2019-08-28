/**
 * This is intended to be used as a module for the other programs. It
 * collects all schema objects from a given OpenAPI document and returns them.
 */
'use strict';

/**
 * Check if the given object is a referenceobject.
 * If not, call the function with the object as parameter and return the result.
 * If yes, return an empty array.
 */
function filterRef(object, functionNoReference) {
  if (!('$ref' in object)) {
    return functionNoReference(object);
  } else {
    return [];
  }
}

function parseSchemaObject(schemaObject) {
  return [schemaObject];
}

function parseResponseObject(responseObject) {
  const result = [];
  if ('headers' in responseObject) {
    Object.values(responseObject.headers).forEach(header => {
      result.push(...filterRef(header, parseHeaderObject));
    });
  }
  if ('content' in responseObject) {
    Object.values(responseObject.content).forEach(content => {
      result.push(...filterRef(content, parseMediaTypeObject));
    });
  }
  if ('links' in responseObject) {
    Object.values(responseObject.links).forEach(link => {
      result.push(...filterRef(link, parseLinkObject));
    });
  }
  return result;
}

function parseParameterObject(parameterObject) {
  const result = [];
  if ('schema' in parameterObject) {
    result.push(...filterRef(parameterObject.schema, parseSchemaObject));
  }
  if ('content' in parameterObject) {
    Object.values(parameterObject.content).forEach(value => {
      result.push(...filterRef(value, parseMediaTypeObject));
    });
  }
  return result;
}

function parseRequestBodyObject(requestBodyObject) {
  const result = [];
  if ('content' in requestBodyObject) {
    Object.values(requestBodyObject.content).forEach(value => {
      result.push(...parseMediaTypeObject(value));
    });
  }
  return result;
}

function parseCallbackObject(callbackObject) {
  const result = [];
  Object.values(callbackObject).forEach(value => {
    result.push(...parsePathItemObject(value));
  });
  return result;
}

function parseHeaderObject(headerObject) {
  return parseParameterObject(headerObject);
}

function parseMediaTypeObject(mediaTypeObject) {
  const result = [];
  if ('schema' in mediaTypeObject) {
    result.push(...filterRef(mediaTypeObject.schema, parseSchemaObject));
  }
  return result;
}

function parseLinkObject(linkObject) {
  return [];
}

function parsePathItemObject(pathItemObject) {
  const result = [];
  ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].forEach(method => {
    if (method in pathItemObject) {
      result.push(...parseOperationObject(pathItemObject[method]));
    }
  });
  if ('parameters' in pathItemObject) {
    pathItemObject.parameters.forEach(parameter => {
      result.push(...filterRef(parameter, parseParameterObject));
    });
  }
  return result;
}

function parseOperationObject(operationObject) {
  const result = [];
  if ('parameters' in operationObject) {
    operationObject.parameters.forEach(parameter => {
      result.push(...filterRef(parameter, parseParameterObject));
    });
  }
  if ('requestBody' in operationObject) {
    result.push(...filterRef(operationObject.requestBody, parseRequestBodyObject));
  }
  result.push(...parseResponsesObject(operationObject.responses));
  if ('callbacks' in operationObject) {
    Object.values(operationObject.callbacks).forEach(value => {
      result.push(...filterRef(operationObject.callbacks, parseCallbackObject));
    });
  }
  return result;
}

function parseResponsesObject(responsesObject) {
  const result = [];
  Object.values(responsesObject).forEach(value => {
    result.push(...filterRef(value, parseResponseObject));
  });
  return result;
}

/**
 * Collect all schema objects from the given OpenAPI spec.
 */
function parseOpenAPISpec(openapiSpec) {
  // First, we collect all the schemas
  const schemas = [];

  // Scan the components section for schemas
  if ('components' in openapiSpec) {
    const components = openapiSpec.components;

    if ('schemas' in components) {
      Object.values(components.schemas).forEach(schema => {
        schemas.push(...filterRef(schema, parseSchemaObject));
      });
    }
    if ('responses' in components) {
      Object.values(components.responses).forEach(response => {
        schemas.push(...filterRef(response, parseResponseObject));
      });
    }
    if ('parameters' in components) {
      Object.values(components.parameters).forEach(parameter => {
        schemas.push(...filterRef(parameter, parseParameterObject));
      });
    }
    if ('requestBodies' in components) {
      Object.values(components.requestBodies).forEach(requestBody => {
        schemas.push(...filterRef(requestBody, parseRequestBodyObject));
      });
    }
    if ('headers' in components) {
      Object.values(components.headers).forEach(header => {
        schemas.push(...filterRef(header, parseHeaderObject));
      });
    }
    if ('links' in components) {
      Object.values(components.links).forEach(link => {
        schemas.push(...filterRef(link, parseLinkObject));
      });
    }
    if ('callbacks' in components) {
      Object.values(components.callbacks).forEach(callback => {
        schemas.push(...filterRef(callback, parseCallbackObject));
      });
    }
  }

  // Scan the paths
  Object.values(openapiSpec.paths).forEach(path => {
    schemas.push(...parsePathItemObject(path));
  });

  return schemas;
}

module.exports = parseOpenAPISpec;
