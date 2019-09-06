/**
 * For every API doc, the folling steps are performed:
 * 1. Run openapi-to-graphql on the doc and measure the average, median and max graphql schema depth
 * 2. Run the link generator on the doc
 * 3. Repeat step 1, but on the modified doc from the link generator
 */
import fse from 'fs-extra';
import {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
  isEnumType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType
} from 'graphql';
import { addLinkDefinitions } from 'openapi-link-generator';
import { createGraphQlSchema } from 'openapi-to-graphql';
import { Oas3 } from 'openapi-to-graphql/lib/types/oas3';
import { OpenAPIV3 } from 'openapi-types';
import * as path from 'path';
import { average, median } from '../tools/math-tools';

interface Result {
  average: number;
  max: number;
  median: number;
}
const directory = path.resolve(__dirname, '../../data/apis.guru');

function processObjectType(input: GraphQLObjectType | GraphQLInterfaceType, depth: number) {
  const pathLengths: number[] = [];
  for (const field of Object.values(input.getFields())) {
    pathLengths.push(...processOutputType(field.type, depth + 1));
  }
  return pathLengths;
}

function processUnionType(input: GraphQLUnionType, depth: number) {
  const pathLengths: number[] = [];
  for (const type of input.getTypes()) {
    pathLengths.push(...processObjectType(type, depth));
  }
  return pathLengths;
}

function processOutputType(input: GraphQLOutputType, depth: number): number[] {
  let type:
    | GraphQLScalarType
    | GraphQLObjectType
    | GraphQLInterfaceType
    | GraphQLUnionType
    | GraphQLEnumType
    | GraphQLList<any>;

  if (isNonNullType(input)) {
    type = input.ofType as
      | GraphQLScalarType
      | GraphQLObjectType
      | GraphQLInterfaceType
      | GraphQLUnionType
      | GraphQLEnumType
      | GraphQLList<any>;
  } else {
    type = input;
  }

  // Handle all possible types
  if (isScalarType(type) || isEnumType(type)) {
    return [depth];
  } else if (isObjectType(type) || isInterfaceType(type)) {
    return processObjectType(type, depth);
  } else if (isUnionType(type)) {
    return processUnionType(type, depth);
  } else if (isListType(type)) {
    return processOutputType(type.ofType as GraphQLOutputType, depth);
  } else {
    throw new Error(`Type not implemented: ${type}`);
  }
}

async function processOpenAPIDocumentation(openapi: OpenAPIV3.Document): Promise<Result | null> {
  // Convert the OpenAPI to GraphQL and analyze the schema depth
  const gql = (await createGraphQlSchema(openapi as Oas3, { fillEmptyResponses: true })).schema;
  const queryRootType = gql.getQueryType();
  let pathLengths: number[] | undefined;
  if (queryRootType != null) {
    pathLengths = processOutputType(queryRootType, 1);
  }

  if (pathLengths != null) {
    return {
      average: average(pathLengths),
      max: Math.max(...pathLengths),
      median: median(pathLengths)
    };
  } else {
    return null;
  }
}

async function loadData() {
  const results: Array<{ after: Result; before: Result }> = [];

  const files = await fse.readdir(directory);
  for (const file of files) {
    const openapi = JSON.parse(await fse.readFile(path.join(directory, file), 'utf8'));
    try {
      const beforeResult = await processOpenAPIDocumentation(openapi);
      const afterResult = await processOpenAPIDocumentation(addLinkDefinitions(openapi).openapi);
      if (beforeResult != null && afterResult != null) {
        results.push({
          after: afterResult,
          before: beforeResult
        });
      }
    } catch (err) {
      console.log(`${file}: ${err.message}. Ignoring.`);
    }
  }

  // Calculate median of the medians before and after
  const beforeMedian = median(results.map(result => result.before.median));
  const afterMedian = median(results.map(result => result.after.median));
  console.log(`Median (before/after)): ${beforeMedian}/${afterMedian}`);
}

process.on('uncaughtException', exception => {
  console.error('Uncaught Error');
  console.error(exception);
});

loadData();
