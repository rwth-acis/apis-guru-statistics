/**
 * Look at all usages of the anyOf keyword and count how many schemas are given to it.
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
    if ('anyOf' in schema) {
      const count = schema.anyOf.length;
      if (count in resultObject) {
        resultObject[count]++;
      } else {
        resultObject[count] = 1;
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
