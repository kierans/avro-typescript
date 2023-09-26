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
    const output: string[] = [];

    const metadata: Metadata = !isNamedType(schema) ? {} : {
        namespace: schema.namespace
    };

    if (isEnumType(schema)) {
        convertEnum(metadata, schema, output);
    }
    else {
        if (isRecordType(schema)) {
            convertRecord(metadata, schema, output, opts);
        }
        else {
            throw "Unknown top level type " + (schema as ComplexType)["type"];
        }
    }

    return output.join("\n");
}
