/**
 * Count how many documentations have at least one operation with multiple successful responses defined. Also
 * count how many operations there are with a specific number of successful responses defined.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');

function processOperation(operationObject) {
  return processResponses(operationObject.responses);
}

function processResponses(responsesObject) {
  return Object.keys(responsesObject)
    .map(key => Number(key))
    .filter(key => key >= 200 && key < 300).length;
}

function processOpenAPIDocumentation(oas) {
  // Check whether this OAS defines multiple responses for one operation. We need
  // to check all operations.
  // Returns an object of the form { "1": 20, "5": 1 } if there is 20 operations
  // with one response and one operation with 5 responses defined.
  const responseCountNumbers = {};
  for (const pathItem of Object.values(oas.paths)) {
    for (const op of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
      if (op in pathItem) {
        const count = processOperation(pathItem[op]);
        if (!(count in responseCountNumbers)) {
          responseCountNumbers[count] = 1;
        } else {
          responseCountNumbers[count]++;
        }
      }
    }
  }
  return responseCountNumbers;
}

async function loadData() {
  const responseCountSum = {};
  let totalDocsWithMultiple = 0;
  let totalOperations = 0;

  const files = await fse.readdir(directory);
  for (const file of files) {
    const tempResult = JSON.parse(await fse.readFile(path.join(directory, file)));
    const countNumbers = processOpenAPIDocumentation(tempResult);

    if (Object.keys(countNumbers).some(key => Number(key) > 1)) {
      totalDocsWithMultiple++;
      console.log(file);
    }

    for (const responseCount of Object.keys(countNumbers)) {
      if (!(responseCount in responseCountSum)) {
        responseCountSum[responseCount] = 0;
      }
      responseCountSum[responseCount] += countNumbers[responseCount];
    }

    // Sum the total number of operations
    totalOperations += Object.values(countNumbers)
      .map(key => Number(key))
      .reduce((prev, curr) => prev + curr, 0);
  }

  console.log(
    `Total number of documents with at least one operation with multiple successful responses: ${totalDocsWithMultiple}`
  );
  console.log(`Total number of operations in all documents: ${totalOperations}`);
  console.log();

  console.log('<number of responses>: <number of operations with that number of successful responses>');
  for (const key in responseCountSum) {
    console.log(`${key}: ${responseCountSum[key]}`);
  }
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
