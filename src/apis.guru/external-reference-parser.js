/**
 * Count how many documents contain an external reference in place of schema, parameter and response objects.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');

function isReferenceExternal(referenceObject) {
  return !referenceObject.$ref.startsWith('#');
}

function processOperation(operationObject) {
  return processResponses(operationObject.responses) || processParameters(operationObject.parameters || []);
}

function processParameters(parametersList) {
  for (const parameterObj of parametersList) {
    if ('$ref' in parameterObj && isReferenceExternal(parameterObj)) {
      return true;
    } else if ('schema' in parameterObj && processSchema(parameterObj.schema)) {
      return true;
    }
  }
  return false;
}

function processSchema(schemaObject) {
  if ('$ref' in schemaObject) {
    return isReferenceExternal(schemaObject);
  }
  return false;
}

function processSchemas(schemas) {
  for (const schemaObject of Object.values(schemas)) {
    if (processSchema(schemaObject)) {
      return true;
    }
  }
  return false;
}

function processResponses(responsesObject) {
  for (const responseObj of Object.values(responsesObject)) {
    if ('$ref' in responseObj && isReferenceExternal(responseObj)) {
      return true;
    }
  }
  return false;
}

function processOpenAPIDocumentation(oas) {
  for (const pathItem of Object.values(oas.paths)) {
    for (const op of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
      if (op in pathItem && processOperation(pathItem[op])) {
        return true;
      }
    }
    if ('parameters' in pathItem && processParameters(pathItem.parameters)) {
      return true;
    }
  }
  if ('components' in oas) {
    if ('parameters' in oas.components && processParameters(Object.values(oas.components.parameters))) {
      return true;
    }
    if ('responses' in oas.components && processResponses(oas.components.responses)) {
      return true;
    }
    if ('schemas' in oas.components && processSchemas(oas.components.schemas)) {
      return true;
    }
  }
  return false;
}

async function loadData() {
  let totalDocsWithExternalRef = 0;

  const files = await fse.readdir(directory);
  for (const file of files) {
    const openapi = JSON.parse(await fse.readFile(path.join(directory, file)));
    const containsExternalRef = processOpenAPIDocumentation(openapi);
    if (containsExternalRef) {
      totalDocsWithExternalRef++;
    }
  }

  console.log(`Result (with external ref/total): ${totalDocsWithExternalRef}/${files.length}`);
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
