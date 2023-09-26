import { convertEnum, convertRecord } from "./types-generator";

export {
    EnumType,
    Field,
    isArrayType,
    isEnumType,
    isLogicalType,
    isMapType,
    isOptional,
    isRecordType,
    RecordType,
    Type,
} from "./model";

import {
    ComplexType,
    ConversionOptions,
    isEnumType,
    isNamedType,
    isRecordType,
    Metadata,
    Schema,
} from "./model";

/** Converts an Avro record type to a TypeScript file */
export function avroToTypeScript(schema: Schema, opts: ConversionOptions = {}): string {
    const metadata: Metadata = !isNamedType(schema) ? {} : {
        namespace: schema.namespace
    };

    return convertSchema(metadata, schema, opts).join("\n");
}

function convertSchema(meta: Metadata, schema: Schema, opts: ConversionOptions): string[] {
    const output: string[] = [];

    if (isEnumType(schema)) {
        convertEnum(meta, schema, output);

        return output;
    }

    if (isRecordType(schema)) {
        convertRecord(meta, schema, output, opts);

        return output;
    }

    throw "Unknown top level type " + (schema as ComplexType)["type"];
}
