/**
 * Look at all usages of the uniqueItems keyword and count how many times it is used with which type.
 */
'use strict';
const fse = require('fs-extra');
const getSchemaObjects = require('./schema-parser');

function processOpenAPISpec(openapiSpec) {
  // Get all the schemas defined in the doc
  const schemas = getSchemaObjects(openapiSpec);

  // Search every occurrence of the anyOf property and count how many schemas are given there
  const resultObject = {};
  schemas.forEach(schema => {
    if ('uniqueItems' in schema) {
      const type = schema.type;
      if (type in resultObject) {
        resultObject[type]++;
      } else {
        resultObject[type] = 1;
      }
    }
  });

  for (const [key, value] of Object.entries(resultObject)) {
    console.log(`${key}: ${value}`);
  }
}

async function processFile(fileName) {
  const doc = JSON.parse(await fse.readFile(fileName, 'utf8'));
  processOpenAPISpec(doc);
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

if (process.argv.length < 3) {
  console.log('Requires the path to the file as argument');
} else {
  processFile(process.argv[2]);
}
