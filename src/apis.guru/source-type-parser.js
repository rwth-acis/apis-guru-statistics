/**
 * Take the most recent data from APIs.Guru and count how many APIs have which source format.
 */
'use strict';
const fse = require('fs-extra');
const path = require('path');
const file = path.resolve(__dirname, '../../data/apis.guru.json');

function parseAPISourceType(apisguruData) {
  // For each API type, count how many times it appears
  const apiTypeMap = new Map();

  // Read the data from APIs.Guru
  const entries = Object.entries(apisguruData);
  console.log(`Total number of APIs: ${entries.length}`);
  let definitionNumber = 0;

  for (const [apiName, api] of entries) {
    const prefApiVersion = api.versions[api.preferred];
    const origin = prefApiVersion.info['x-origin'];
    origin.forEach(origin => {
      let mapKey = '';
      if ('format' in origin) {
        mapKey += origin.format;
        if ('version' in origin) {
          mapKey += `-${origin.version}`;
        }
      } else {
        mapKey = 'unknown';
      }

      const oldVal = apiTypeMap.has(mapKey) ? apiTypeMap.get(mapKey) : 0;
      apiTypeMap.set(mapKey, oldVal + 1);
      definitionNumber++;
    });
  }

  console.log(`Total number of API definitions: ${definitionNumber}`);
  for (const [key, value] of apiTypeMap.entries()) {
    console.log(`${key}: ${value}, ${(value / definitionNumber) * 100}%`);
  }
  console.log();
}

async function loadData() {
  // Read the data from APIs.Guru
  const data = JSON.parse(await fse.readFile(file, 'utf8'));
  parseAPISourceType(data);
}

loadData();
