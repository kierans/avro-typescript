import { convertType } from "./types-generator";

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
    const metadata: Metadata = !isNamedType(schema) ? emptyMetadata() : {
        namespace: schema.namespace,
        typeDefs: []
    };

    return convertSchema(metadata, schema, opts).join("\n");
}

function convertSchema(meta: Metadata, schema: Schema, opts: ConversionOptions): string[] {
    const output: string[] = [];

    if (!isEnumType(schema) && !isRecordType(schema)) {
        throw "Unknown top level type " + (schema as ComplexType)["type"];
    }

    convertType(meta, schema, output, opts);

    return output;
}

function emptyMetadata(): Metadata {
    return {
        typeDefs: []
    };
}
