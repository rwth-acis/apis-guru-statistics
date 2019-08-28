/**
 * Take the most recent data from APIs.Guru and count how many of the APIs use one of the following
 * JSON Schema features:
 *  multipleOf, maximum, minimum, maxLength, minLength, pattern, maxItems, minItems, uniqueItems,
 *  maxProperties, minProperties, oneOf, anyOf, not
 *
 * Reference objects are purposefully ignored everywhere, as they either point somewhere outside the file, which we want to ignore
 * or point somewhere internally which we will see anyway.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');
const getSchemaObjects = require('../tools/schema-parser');
const relevantKeys = [
  'multipleOf',
  'maximum',
  'minimum',
  'maxLength',
  'minLength',
  'pattern',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'oneOf',
  'anyOf',
  'not'
];

function processOpenAPISpec(openapiSpec) {
  // Get all the schemas defined in the doc
  const schemas = getSchemaObjects(openapiSpec);

  // Search all the collected schemas for one of the relevant properties
  const resultObject = {};
  schemas.forEach(schema => {
    Object.keys(schema).forEach(key => {
      if (relevantKeys.includes(key)) {
        if (key in resultObject) {
          resultObject[key]++;
        } else {
          resultObject[key] = 1;
        }
      }
    });
  });

  return resultObject;
}

async function loadData() {
  // We calculate how many times each operator is used.
  const sumOfTotalUsageResult = Object.fromEntries(relevantKeys.map(key => [key, 0]));
  // We calculate how many specs use each operator
  const sumOfSpecsThatUseResult = Object.fromEntries(relevantKeys.map(key => [key, 0]));
  // We calculate how many documentations use any one of those operators.
  let totalSpecs = 0;

  const files = await fse.readdir(directory);
  for (const file of files) {
    const tempResult = processOpenAPISpec(JSON.parse(await fse.readFile(path.join(directory, file))));
    const entries = Object.entries(tempResult);
    if (entries.length > 0) {
      for (const [key, value] of entries) {
        sumOfTotalUsageResult[key] += value;
        sumOfSpecsThatUseResult[key] += 1;
      }
      totalSpecs++;
    }
    // if ('uniqueItems' in tempResult || 'anyOf' in tempResult) {
    //   console.log(`${file}: ${tempResult['uniqueItems']}, ${tempResult['anyOf']}`);
    // }
  }

  console.log(`Total number of documents that use such properties: ${totalSpecs} of ${files.length}`);
  for (const key of relevantKeys) {
    console.log(
      `${key}: ${sumOfSpecsThatUseResult[key]}, ${(sumOfSpecsThatUseResult[key] / files.length) * 100}%, ${
        sumOfTotalUsageResult[key]
      }`
    );
  }
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
