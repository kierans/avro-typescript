/**** Contains the Interfaces and Type Guards for Avro schema */

export type Schema = RecordType | EnumType;
export interface ConversionOptions {
    logicalTypes?: { [type: string]: string };
}

export type Type = NameOrType | NameOrType[];
export type NameOrType = PrimitiveTypeNames | ComplexType | LogicalType | ReferencedType;
export type ReferencedType = string;
export type PrimitiveTypeNames = "null" | "boolean" | "int" | "long" | "float" | "double" | "bytes" | "string";
export type ComplexTypeNames = "record" | "array" | "map" | "enum";
export type NamedComplexTypeNames = Extract<ComplexTypeNames, "record" | "enum">;
export type TypeNames =  PrimitiveTypeNames | ComplexTypeNames | ReferencedType;

export interface Field {
    name: string;
    type: Type;
    default?: string | number | null | boolean;
}

export interface BaseType {
    type: TypeNames;
}

export interface ComplexType extends BaseType {
    type: ComplexTypeNames;
}

export interface RecordType extends NamedComplexType {
    type: "record";
    fields: Field[];
}

export interface ArrayType extends ComplexType {
    type: "array";
    items: Type;
}

export interface MapType extends ComplexType {
    type: "map";
    values: Type;
}

export interface EnumType extends NamedComplexType {
    type: "enum";
    symbols: string[];
}

export interface NamedComplexType extends ComplexType {
    type: NamedComplexTypeNames;
    name: string;
    namespace?: string;
}

export interface LogicalType extends BaseType {
    logicalType: string;
}

export interface Metadata {
    namespace?: string;
}

export function isComplexType(type: Type): type is ComplexType {
    return typeof type === "object" && "type" in type
}

export function isNamedType(type: Type): type is NamedComplexType {
    return isComplexType(type) && "name" in type;
}

export function isRecordType(type: Type): type is RecordType {
    return isComplexType(type) && type.type === "record";
}

export function isArrayType(type: Type): type is ArrayType {
    return isComplexType(type) && type.type === "array";
}

export function isMapType(type: Type): type is MapType {
    return isComplexType(type) && type.type === "map";
}

export function isEnumType(type: Type): type is EnumType {
    return isComplexType(type) && type.type === "enum";
}

export function isUnionType(type: Type): type is NameOrType[] {
    return type instanceof Array;
}

export function isOptional(type: Type): boolean {
    if (isUnionType(type)) {
        const t1 = type[0];
        if (typeof t1 === "string") {
            return t1 === "null";
        }
    }
}

export function isPrimitiveType(type: Type): type is PrimitiveTypeNames {
    return typeof type === "string" && (
      type === "null" ||
      type === "boolean" ||
      type === "int" ||
      type === "long" ||
      type === "float" ||
      type === "double" ||
      type === "bytes" ||
      type === "string"
    )
}

export function isReferencedType(type: Type): type is ReferencedType {
    return typeof type === "string" && !isPrimitiveType(type);
}

export function isLogicalType(type: Type): type is LogicalType {
    return typeof type !== "string" && "logicalType" in type;
}

export function fullName(namespace: string | undefined, name: string): string {
    return `${namespace ? namespace : ""}${namespace ? "." : ""}${name}`;
}
