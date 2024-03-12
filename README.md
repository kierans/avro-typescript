# Avro Typescript

A simple JS library to convert Avro Schemas to TypeScript interfaces for use in ANZx.

Forked from https://github.com/joewood/avro-typescript (MIT license)

## Install

```
npm install @anzx/avro-typescript
```

The library can be run in node.js or the browser. It takes an Avro Schema as a JavaScript object (from JSON) and returns 
the TypeScript code as a string.

## Usage

### As library

```typescript
import { avroToTypeScript, RecordType } from "avro-typescript"

const schemaText = fs.readFileSync("example.avsc", "UTF8");
const schema = JSON.parse(schemaText) as RecordType;
console.log(avroToTypeScript(schema as RecordType));
```

### As CLI

```shell
npx avro-ts -h
Usage: avro-ts [options]

Options:
  -i, --input <file>   Input file. If not present, defaults to STDIN
  -o, --output <file>  Output file. If not present, defaults to STDOUT
  -h, --help           display help for command
```

## Override logicalTypes

Tools like [avsc](https://github.com/mtth/avsc) allow you to [override the serialization/deserialization of LogicalTypes](https://github.com/mtth/avsc/wiki/Advanced-usage#logical-types),
 say from numbers to native JS Date objects, in this case we want to generate the typescript type as 'Date', not 'number'.
 Therefore, you can pass in a map 'logicalTypes' to the options to override the outputted TS type for the schema logicalType.
 
For example:

```typescript
const schema: Schema = {
    type: "record",
    name: "logicalOverrides",
    fields: [
        {
            name: "eventDate",
            type: {
                type: "int",
                logicalType: "date",
            },
        },
        {
            name: "startTime",
            type: {
                type: "int",
                logicalType: "timestamp-millis",
            },
        },
        {
            name: "displayTime",
            type: {
                type: "string",
                logicalType: "iso-datetime",
            },
        },
    ],
};
const actual = avroToTypeScript(schema, {
logicalTypes: {
    date: 'Date',
    'timestamp-millis': 'Date',
}
});

// this will output
export interface logicalOverrides {
    eventDate: Date;
    startTime: Date;
    displayTime: string;
}
```

## JSON Encoding

This fork changes how Avro union types are converted so that the resulting types are suitable for [JSON encoding][1].
It does this by creating an intermediate "JSON Encoding" type that matches the Avro encoding rules for JSON Encoding.
The resulting Typescript type is a union between the JSON Encoding types (which includes null).

For example, if a field `field` has an Avro type of `["null", "string"]` the resulting Typescript type will be

```typescript
interface StringJSONEncoding {
  string: string;
}

field: null | StringEncodingType;
```

## Features

Most Avro features are supported, including:

* Enumerated Types
* Maps
* Named Records
* Mandatory and optional fields
* Unions (using JSON encoding)
* Primitives

### To-do

* Generate a function to set defaults as per the schema
* Add support for fixed
* Generate JSDocs from documentation
* Add namespace support

[1]: https://avro.apache.org/docs/1.11.1/specification/#json-encoding
