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
    ConversionOptions,
    EnumType,
    Field,
    isArrayType,
    isEnumType,
    isLogicalType,
    isMapType,
    isNamedType,
    isPrimitiveType,
    isRecordType,
    isReferencedType,
    isUnionType,
    NameOrType,
    PrimitiveTypeNames,
    RecordType,
    Schema,
    Type,
} from "./model";

/** Convert a primitive type from avro to TypeScript */
export function convertPrimitive(avroType: PrimitiveTypeNames): string {
    switch (avroType) {
        case "long":
        case "int":
        case "double":
        case "float":
            return "number";

        case "bytes":
            return "Buffer";

        case "null":
            return "null";

        case "boolean":
            return "boolean";

        case "string":
            return "string";

        default:
            return "UNKNOWN_PRIMITIVE";
    }
}

/** Converts an Avro record type to a TypeScript file */
export function avroToTypeScript(schema: Schema, opts: ConversionOptions = {}): string {
    const output: string[] = [];

    if (isEnumType(schema)) {
        convertEnum(schema, output);
    }
    else {
        if (isRecordType(schema)) {
            convertRecord(schema, output, opts);
        }
        else {
            throw "Unknown top level type " + (schema as unknown)["type"];
        }
    }

    return output.join("\n");
}

/** Convert an Avro Record type. Return the name, but add the definition to the file */
export function convertRecord(recordType: RecordType, fileBuffer: string[], opts: ConversionOptions): string {
    let buffer = `export interface ${recordType.name} {\n`;
    for (let field of recordType.fields) {
        buffer += convertFieldDec(field, fileBuffer, opts) + "\n";
    }
    buffer += "}\n";
    fileBuffer.push(buffer);
    return recordType.name;
}

/** Convert an Avro Enum type. Return the name, but add the definition to the file */
export function convertEnum(enumType: EnumType, fileBuffer: string[]): string {
    const enumDef = `export enum ${enumType.name} { ${enumType.symbols.map(sym => `${sym} = '${sym}'`).join(", ")} };\n`;
    fileBuffer.push(enumDef);
    return enumType.name;
}

export function convertUnionType(type: NameOrType): NameOrType  {
    if (isReferencedType(type)) {
        // console.error(`Referenced type ${type}`);
        return discriminatorType(type, type);
    }

    if (isNamedType(type)) {
        console.error(`Named type ${type.name}`);

        return discriminatorType(type.name, type);
    }

    return type;
}

export function convertType(type: Type, buffer: string[], opts: ConversionOptions): string {
    // if it's just a name, then use that
    if (isReferencedType(type)) {
        return type;
    }

    if (isPrimitiveType(type)) {
        return convertPrimitive(type);
    }

    if (isUnionType(type)) {
        const discriminatedTypes = type.map(convertUnionType);

        // array means a Union. Use the names and call recursively
        return discriminatedTypes.map((t) => convertType(t, buffer, opts)).join(" | ");
    }

    if (isRecordType(type)) {
        // record, use the name and add to the buffer
        return convertRecord(type, buffer, opts);
    }

    if (isArrayType(type)) {
        // array, call recursively for the array element type
        return convertType(type.items, buffer, opts) + "[]";
    }

    if (isMapType(type)) {
        // Dictionary of types, string as key
        return `{ [index:string]:${convertType(type.values, buffer, opts)} }`;
    }

    if (isEnumType(type)) {
        // array, call recursively for the array element type
        return convertEnum(type, buffer);
    }

    if (isLogicalType(type)) {
        if (opts.logicalTypes && opts.logicalTypes[type.logicalType]) {
            return opts.logicalTypes[type.logicalType];
        }

        return convertType(type.type, buffer, opts);
    }


    console.error("Cannot work out type", type);

    return "UNKNOWN";
}

export function convertFieldDec(field: Field, buffer: string[], opts: ConversionOptions): string {
    // Union Type
    return `\t${field.name}: ${convertType(field.type, buffer, opts)};`;
}

export function discriminatorType(name: string, type: NameOrType): RecordType {
    return {
        type: "record",
        name: `${name}Discriminator`,
        fields: [
            {
                name: `"com.foo.${name}"`,
                type
            }
        ]
    }
}
