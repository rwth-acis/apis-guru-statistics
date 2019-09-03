/**
 * Add links to every openapi-document and count how many links we have added in total.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');
const { addLinkDefinitions } = require('openapi-link-generator');

async function loadData() {
  // We sum how many links are added
  let totalLinks = 0;
  let totalPaths = 0;
  let totalOas = 0;
  const linkNumberDistribution = {};
  // We calculate how many links are added on average to specifications with a certain number of paths
  const ranges = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 10], [11, 20], [21, 50], [51, 5000]];
  const linkAveragePerRange = {};

  const files = await fse.readdir(directory);
  for (const file of files) {
    const tempResult = addLinkDefinitions(JSON.parse(await fse.readFile(path.join(directory, file))));

    totalLinks += tempResult.numLinks;
    const pathCount = Object.keys(tempResult.oas.paths).length;
    totalPaths += pathCount;
    if (pathCount > 0) {
      let key = Math.round((tempResult.numLinks / pathCount) * 100);
      if (key === 0 && tempResult.numLinks > 0) {
        key = '0+';
      }

      if (key in linkNumberDistribution) {
        linkNumberDistribution[key]++;
      } else {
        linkNumberDistribution[key] = 1;
      }
      totalOas++;
    }

    for (const range of ranges.filter(range => pathCount >= range[0] && pathCount <= range[1])) {
      const rangeString = '' + range;
      if (!(rangeString in linkAveragePerRange)) {
        linkAveragePerRange[rangeString] = { linkCount: 0, docSum: 0 };
      }
      linkAveragePerRange[rangeString].linkCount += tempResult.numLinks;
      linkAveragePerRange[rangeString].docSum++;
    }
  }

  console.log(`Total number of added links: ${totalLinks}`);
  console.log(`Total number of paths: ${totalPaths}`);
  console.log(`Total number of oas (with at least one path/total): ${totalOas}/${files.length}`);
  console.log();
  console.log('<average number of links per 100 paths>: <number of documents>');
  for (const key in linkNumberDistribution) {
    console.log(`${key}: ${linkNumberDistribution[key]}`);
  }

  console.log();
  console.log('<range of number of paths>: <average number of links added per document>');
  for (const key in linkAveragePerRange) {
    console.log(`${key}: ${linkAveragePerRange[key].linkCount / linkAveragePerRange[key].docSum}`);
  }
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
