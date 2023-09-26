import {
  ConversionOptions,
  EnumType,
  Field,
  Metadata,
  NameOrType,
  PrimitiveTypeNames,
  RecordType,
  Type,
  fullName,
  isArrayType,
  isEnumType,
  isLogicalType,
  isMapType,
  isNamedType,
  isPrimitiveType,
  isRecordType,
  isReferencedType,
  isUnionType,
} from "./model";

/** Convert a primitive type from avro to TypeScript */
export function convertPrimitive(_: Metadata, avroType: PrimitiveTypeNames): string {
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

/** Convert an Avro Record type. Return the name, but add the definition to the file */
export function convertRecord(
  meta: Metadata,
  recordType: RecordType,
  fileBuffer: string[],
  opts: ConversionOptions
): string {
  let buffer = `export interface ${recordType.name} {\n`;
  for (let field of recordType.fields) {
    buffer += convertFieldDec(meta, field, fileBuffer, opts) + "\n";
  }
  buffer += "}\n";
  fileBuffer.push(buffer);
  return recordType.name;
}

/** Convert an Avro Enum type. Return the name, but add the definition to the file */
export function convertEnum(_: Metadata, enumType: EnumType, fileBuffer: string[]): string {
  const enumDef = `export enum ${enumType.name} { ${enumType.symbols.map(sym => `${sym} = '${sym}'`).join(", ")} };\n`;
  fileBuffer.push(enumDef);
  return enumType.name;
}

export function convertUnionType(meta: Metadata, type: NameOrType): NameOrType  {
  if (isReferencedType(type)) {
    return discriminatorType(meta, type, type);
  }

  if (isNamedType(type)) {
    return discriminatorType(meta, type.name, type);
  }

  return type;
}

export function convertType(meta: Metadata, type: Type, buffer: string[], opts: ConversionOptions): string {
  // if it's just a name, then use that
  if (isReferencedType(type)) {
    return type;
  }

  if (isPrimitiveType(type)) {
    return convertPrimitive(meta, type);
  }

  if (isUnionType(type)) {
    const discriminatedTypes = type.map((t) => convertUnionType(meta, t));

    // array means a Union. Use the names and call recursively
    return discriminatedTypes.map((t) => convertType(meta, t, buffer, opts)).join(" | ");
  }

  if (isRecordType(type)) {
    // record, use the name and add to the buffer
    return convertRecord(meta, type, buffer, opts);
  }

  if (isArrayType(type)) {
    // array, call recursively for the array element type
    return convertType(meta, type.items, buffer, opts) + "[]";
  }

  if (isMapType(type)) {
    // Dictionary of types, string as key
    return `{ [index:string]:${convertType(meta, type.values, buffer, opts)} }`;
  }

  if (isEnumType(type)) {
    // array, call recursively for the array element type
    return convertEnum(meta, type, buffer);
  }

  if (isLogicalType(type)) {
    if (opts.logicalTypes && opts.logicalTypes[type.logicalType]) {
      return opts.logicalTypes[type.logicalType];
    }

    return convertType(meta, type.type, buffer, opts);
  }

  console.error("Cannot work out type", type);

  return "UNKNOWN";
}

export function convertFieldDec(meta: Metadata, field: Field, buffer: string[], opts: ConversionOptions): string {
  // Union Type
  return `\t${field.name}: ${convertType(meta, field.type, buffer, opts)};`;
}

export function discriminatorType(meta: Metadata, name: string, type: NameOrType): RecordType {
  return {
    type: "record",
    name: `${name}Discriminator`,
    fields: [
      {
        name: `"${fullName(meta.namespace, name)}"`,
        type
      }
    ]
  }
}
