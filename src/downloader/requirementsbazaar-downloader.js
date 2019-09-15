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
const { addLinkDefinitions } = require('openapi-link-generator');
const { createGraphQlSchema } = require('openapi-to-graphql');
const { printSchema } = require('graphql');

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
  const openapiLinksFile = path.join(directory, 'openapi-links.json');
  const gqlFile = path.join(directory, 'graphql-nolinks.graphql');
  const gqlLinksFile = path.join(directory, 'graphql-links.graphql');

  // Download the original Swagger 2.0 file
  let swaggerText;
  try {
    swaggerText = await rp(apiUrl);
  } catch (err) {
    console.error('Failed to download requirements-bazaar Swagger file.');
    console.error(err.message);
    return;
  }

  // Convert it to OpenAPI 3.0
  let openapiObj;
  try {
    openapiObj = await sw2oai.convertStr(swaggerText, { patch: true, direct: true });
  } catch (err) {
    console.error('Failed to convert Swagger file to OpenAPI.');
    console.error(err.message);
    return;
  }

  // Add links using the link-generator
  let openapiWithLinks;
  try {
    openapiWithLinks = addLinkDefinitions(openapiObj).openapi;
  } catch (err) {
    console.error('Failed to add link definitions to OpenAPI documentation.');
    console.error(err.message);
    return;
  }

  // Generate two GraphQL schemas. One for the OpenAPI with links and one for the OpenAPI without links.
  let gqlWithoutLinks, gqlWithLinks;
  try {
    gqlWithoutLinks = (await createGraphQlSchema(openapiObj)).schema;
    gqlWithLinks = (await createGraphQlSchema(openapiWithLinks)).schema;
  } catch (err) {
    console.error('Failed to generate the GraphQL schemas.');
    console.error(err.message);
    return;
  }

  try {
    await fse.writeFile(swaggerFile, swaggerText, { flag: 'w' });
    await fse.writeFile(openapiFile, JSON.stringify(openapiObj), { flag: 'w' });
    await fse.writeFile(openapiLinksFile, JSON.stringify(openapiWithLinks), { flag: 'w' });
    await fse.writeFile(gqlFile, printSchema(gqlWithoutLinks), { flag: 'w' });
    await fse.writeFile(gqlLinksFile, printSchema(gqlWithLinks), { flag: 'w' });
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
