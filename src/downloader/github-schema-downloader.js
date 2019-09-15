/**
 * Use the GitHub v3 API documentation from APIs.Guru and enhance it with link definitions. Create GraphQL schemas for both versions of the
 * documentation.
 * Download the official GraphQL Schema of the v4 GitHub API.
 */
'use strict';
const rp = require('request-promise-native');
const fse = require('fs-extra');
const path = require('path');
const { addLinkDefinitions } = require('openapi-link-generator');
const { createGraphQlSchema } = require('openapi-to-graphql');
const { printSchema } = require('graphql');

const outputDir = path.resolve(__dirname, '../../data/github');
const v3OpenApiDoc = path.join(outputDir, 'v3-source-modified.json');
const graphQlSchemaUrl = 'https://developer.github.com/v4/public_schema/schema.public.graphql';

async function loadData() {
  // Check that the data directory exists
  if (!(await fse.exists(outputDir))) {
    console.error(`Directory "${outputDir}" does not exist. Aborting.`);
    return;
  }
  // Check that the OpenAPI Doc exists
  if (!(await fse.exists(v3OpenApiDoc))) {
    console.error(`OpenAPI documentation of the GraphQL API not found in "${v3OpenApiDoc}".`);
    return;
  }

  // Download the GitHub GraphQL Schema
  console.log('Downloading GraphQL Schema.');
  try {
    await fse.writeFile(path.join(outputDir, 'v4-source.graphql'), await rp(graphQlSchemaUrl), { flag: 'w' });
  } catch (err) {
    console.error('Failed to download and save the v4 GraphQL API Schema.');
    console.error(err.message);
    return;
  }

  // Load the original OpenAPI Doc
  console.log('Reading OpenAPI doc from disk.');
  let openapiObj;
  try {
    openapiObj = JSON.parse(await fse.readFile(v3OpenApiDoc, 'utf8'));
  } catch (err) {
    console.error(`Error reading the OpenAPI document "${v3OpenApiDoc}.`);
    console.error(err.message);
    return;
  }

  // Add links using the link-generator
  let openapiWithLinks;
  try {
    const res = addLinkDefinitions(openapiObj);
    openapiWithLinks = res.openapi;
    console.log(`Added ${res.numLinks} links to the original OpenAPI doc`);
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
    await fse.writeFile(path.join(outputDir, 'v3-links.json'), JSON.stringify(openapiWithLinks), { flag: 'w' });
    await fse.writeFile(path.join(outputDir, 'v3.graphql'), printSchema(gqlWithoutLinks), { flag: 'w' });
    await fse.writeFile(path.join(outputDir, 'v3-links.graphql'), printSchema(gqlWithLinks), { flag: 'w' });
  } catch (err) {
    console.error('Failed to write files.');
    console.error(err.message);
    return;
  }

  console.log('GitHub data loaded successfully.');
}

process.on('uncaughtException', function(exception) {
  console.log(exception);
});

loadData();
