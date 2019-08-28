/**
 * Create a statistic about how many paths each definition contains.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const directory = path.resolve(__dirname, '../../data/apis.guru');

async function loadData() {
  const pathNumberDistribution = {};

  const files = await fse.readdir(directory);
  for (const file of files) {
    const tempResult = JSON.parse(await fse.readFile(path.join(directory, file)));

    let key = Object.keys(tempResult.paths).length;
    if (key in pathNumberDistribution) {
      pathNumberDistribution[key]++;
    } else {
      pathNumberDistribution[key] = 1;
    }
  }

  console.log('<number of paths>: <number of documents with that number of paths>');
  for (const key in pathNumberDistribution) {
    console.log(`${key}: ${pathNumberDistribution[key]}`);
  }
  console.log();

  // Generate paper statistics
  console.log('<range of number of paths>: <number of documents with path number in that range>');
  const ranges = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 10], [11, 20], [21, 50], [51, 5000]];
  for (const range of ranges) {
    let sum = 0;
    for (let i = range[0]; i <= range[1]; i++) {
      sum += pathNumberDistribution[i] || 0;
    }
    console.log(`${range[0]}-${range[1]}: ${sum}`);
  }
}

process.on('uncaughtException', function(exception) {
  console.error(exception);
});

loadData();
