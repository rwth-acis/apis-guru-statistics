/**
 * Count how many documentations use link definitions.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');

function processOperation(operationObject) {
  return processResponses(operationObject.responses);
}

function processResponses(responsesObject) {
  let count = 0;
  for (const responseObj of Object.values(responsesObject)) {
    if ('links' in responseObj) {
      count += Object.values(responseObj.links).length;
    }
  }
  return count;
}

function processOpenAPIDocumentation(oas) {
  // Return the number of links in this oas.
  // We need to check the operations for responses and also check the responses defined in
  // the components section.
  // We do not care whether a link is given directly or as a reference, as we do not count how
  // many distinct links are used, but rather how many links are used in total.
  let count = 0;
  for (const pathItem of Object.values(oas.paths)) {
    for (const op of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
      if (op in pathItem) {
        count += processOperation(pathItem[op]);
      }
    }
  }
  if ('components' in oas) {
    if ('responses' in oas.components) {
      count += processResponses(oas.components.responses);
    }
  }
  return count;
}

async function loadData() {
  const linkNumberDistribution = {};
  let totalLinkCount = 0;
  let totalLinkDocumentCount = 0;

  const files = await fse.readdir(directory);
  for (const file of files) {
    const tempResult = JSON.parse(await fse.readFile(path.join(directory, file)));
    const count = processOpenAPIDocumentation(tempResult);

    totalLinkCount += count;
    if (count in linkNumberDistribution) {
      linkNumberDistribution[count]++;
    } else {
      linkNumberDistribution[count] = 1;
    }

    if (count > 0) {
      totalLinkDocumentCount++;
    }
  }

  console.log(`Total number of links found: ${totalLinkCount}`);
  console.log(`Total number of documents containing links: ${totalLinkDocumentCount}`);
  console.log();

  console.log('<number of links>: <number of documents with that number of links>');
  for (const key in linkNumberDistribution) {
    console.log(`${key}: ${linkNumberDistribution[key]}`);
  }
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
