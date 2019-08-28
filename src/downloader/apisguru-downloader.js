/**
 * Download the most-recent data from apis.guru, converts everything to OpenAPI 3.0 and saves
 * it in the data/apis.guru folder.
 */
'use strict';
const rp = require('request-promise-native');
const sw2oai = require('swagger2openapi');
const fse = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');
const directory = path.resolve(__dirname, '../../data/apis.guru');
const listFile = path.resolve(__dirname, '../../data/apis.guru.json');
const apiUrl = 'https://api.apis.guru/v2/list.json';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadSchema(apiName, apiLink) {
  let documentation;
  try {
    documentation = JSON.parse(await rp(apiLink));
  } catch {
    await sleep(1000);
    console.log(`Repeating download of: ${apiName}`);
    await downloadSchema(apiName, apiLink);
    return;
  }

  if ('swagger' in documentation) {
    try {
      documentation = (await sw2oai.convertObj(documentation, { patch: true })).openapi;
    } catch (err) {
      console.error(`Error when parsing API documentation: ${apiName}`);
      console.error(err.message);
      return;
    }
  } else if (!('openapi' in documentation)) {
    console.error(`Unknown API documentation type: ${apiName}`);
    return;
  }

  await fse.writeFile(path.join(directory, sanitize(apiName) + '.json'), JSON.stringify(documentation), { flag: 'w' });
}

async function iterateApiSchemas(apisguruData) {
  const promiseQueue = [];
  const entries = Object.entries(apisguruData);
  entries.forEach(([apiName, api]) => {
    const apiLink = api.versions[api.preferred].swaggerUrl;
    promiseQueue.push(downloadSchema(apiName, apiLink));
  });
  await Promise.all(promiseQueue);

  console.log(`Download complete`);
}

async function loadData() {
  // Load the API list from APIs.Guru
  const data = JSON.parse(await rp(apiUrl));
  await fse.writeFile(listFile, JSON.stringify(data), { flag: 'w' });
  // Ensure that the data-directory exists
  if (!(await fse.exists(directory))) {
    console.log(`Directory ${directory} does not exist. Aborting.`);
    return;
  }
  console.log('Downloading APIs.Guru data...');
  // Load all the schemas
  await iterateApiSchemas(data);
}

process.on('uncaughtException', function(exception) {
  console.log(exception);
});

loadData();
