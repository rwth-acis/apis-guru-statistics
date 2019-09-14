# APIs.Guru Statistics Parser

Generate statistics about OpenAPI documentations using data from the APIs.Guru OpenAPI database.
I used these tools to generate statistics for my bachelors thesis.

## Prerequisites

The scripts have been tested with Node v12 but may also run with older versions.

To initialize the project, run:

```
npm install
```

## Download

The repository already contains the downloaded data I used to generate my statistics.
Run `npm run download` to redownload all data from APIs.Guru and Requirements-Bazaar and update it to the newest version.

## Scripts

This project consists of multiple scripts generating different statistics that can be directly run via `node <pathToScript> <parameters>`.
The scripts are located under [src/apis.guru](src/apis.guru).

### add-link-definitions.js

```
Usage: node add-link-definitions.js
```

Uses the link generator on all the API documentations in the [data/apis.guru](data/apis.guru) folder and outputs statistics about how many links were added to how many documents.

### anyof-detail-parser.js

```
Usage: node anyof-detail-parser.js <pathToOpenAPI>
```

Takes a path to an OpenAPI document as parameter.
Counts how many times the `anyOf` keyword is used in schema objects in that OpenAPI document and with how many entries it is used.

### link-usage-parser.js

```
Usage: node link-usage-parser.js
```

Analyzes all the API documentations in the [data/apis.guru](data/apis.guru) folder and counts how many documentations use link definitions.

### multiple-response-parser.js

```
Usage: node multiple-response-parser.js
```

Analyzes all the API documentations in the [data/apis.guru](data/apis.guru) folder and counts how many documentations have at least one operation defined that has multiple success response codes (HTTP status codes in the range 200 to 299).
It also outputs how many operations there are in all documents with a specific number of successful responses defined.

### path-number-statistics.js

```
Usage: node path-number-statistics.js
```

Analyzes all the API documentations in the [data/apis.guru](data/apis.guru) folder and counts how many paths each document has.
Outputs how many documents with a specific number of paths exist.

### schema-statistics-parser.js

```
Usage: node schema-statistics-parser.js
```

Analyzes all the API documentations in the [data/apis.guru](data/apis.guru) folder and counts the usage of specific properties in schema objects.
The properties are:

```
multipleOf, maximum, minimum, exclusiveMinimum, exclusiveMaximum, maxLength, minLength, pattern, maxItems, minItems, uniqueItems, maxProperties, minProperties, oneOf, anyOf, not
```

### source-type-parser.js

```
Usage: node source-type-parser.js
```

Each entry in the API list from APIs.Guru has an `x-origin` entry.
This entry contains information about the source documentation that the entry in the APIs.Guru directory is from.
The script analyzes those entries and outputs statistics about the types of the source documentations.

### uniqueitems-detail-parser.js

```
Usage: node uniqueitems-detail-parser.js <pathToOpenAPI>
```

Takes a path to an OpenAPI document as parameter.
Analyzes the given OpenAPI document by counting how many times the `uniqueItems` keyword is used with a specific type.

# Research

In my thesis, I used the GitHub v3 API as an example to translate its schema to GraphQL.
The OpenAPI documentation used for this can be found [data/apis.guru/github.com.json](here).
To run [openapi-to-graphql](https://github.com/IBM/openapi-to-graphql) on that API, the following command can be used:

```
npx openapi-to-graphql data/apis.guru/github.com.json --save output.graphql
```

This will output the converted schema to `output.graphql`, if no errors occur.
