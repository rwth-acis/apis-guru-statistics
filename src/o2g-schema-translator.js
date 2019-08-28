'use strict';
const fse = require('fs-extra');
const { createGraphQlSchema } = require('openapi-to-graphql');
const { printSchema } = require('graphql');

async function processFile(fileName) {
  const doc = JSON.parse(await fse.readFile(fileName, 'utf8'));
  const { schema, report } = await createGraphQlSchema(doc);
  console.log(printSchema(schema));
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

if (process.argv.length < 3) {
  console.log('Requires the path to the file as argument');
} else {
  processFile(process.argv[2]);
}
