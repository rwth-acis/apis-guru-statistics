/**
 * Download the latest Swagger documentation of the requirements-bazaar.org API and save
 * it to the data/requirements-bazaar folder.
 * Also convert it to OpenAPI 3.0 and save that version alongside it.
 */
'use strict';
const rp = require('request-promise-native');
const sw2oai = require('swagger2openapi');
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/requirements-bazaar');
const apiUrl = 'https://requirements-bazaar.org/bazaar/swagger.json';

async function loadData() {
  // Check that the data directory exists
  if (!(await fse.exists(directory))) {
    console.error(`Directory "${directory}" does not exist. Aborting.`);
    return;
  }
  console.log('Downloading Requirements-Bazaar data...');

  const swaggerFile = path.join(directory, 'swagger.json');
  const openapiFile = path.join(directory, 'openapi.json');

  let swaggerText;
  try {
    swaggerText = await rp(apiUrl);
  } catch (err) {
    console.error('Failed to download requirements-bazaar Swagger file.');
    console.error(err.message);
    return;
  }

  let openapiObj;
  try {
    openapiObj = await sw2oai.convertStr(swaggerText, { patch: true, direct: true });
  } catch (err) {
    console.error('Failed to convert Swagger file to OpenAPI.');
    console.error(err.message);
    return;
  }

  try {
    await fse.writeFile(swaggerFile, swaggerText, { flag: 'w' });
    await fse.writeFile(openapiFile, JSON.stringify(openapiObj), { flag: 'w' });
  } catch (err) {
    console.error('Failed to write files.');
    console.error(err.message);
    return;
  }

  console.log('Requirements-Bazaar data loaded successfully.');
}

process.on('uncaughtException', function(exception) {
  console.log(exception);
});

loadData();
