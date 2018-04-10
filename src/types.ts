import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'

import { COLUMN_TYPES } from './constants'
import { isFunction } from './util'

import {
  Raw,
  SchemaBuilder,
  QueryBuilder
} from 'knex'

import { Left, Right } from 'fp-ts/lib/Either'

export const raise: (
  validation: Left<t.ValidationError[], any> | Right<t.ValidationError[], any>
) => void = ThrowReporter.report

export function validate <L> (value: L, type: t.Type<L>, defaultValue?: L): L {
  const result = type.decode(value)
  return raise(result) || result.getOrElse(defaultValue)
}

// based on `withDefault` from io-ts tests: https://git.io/vNGS6
export function withDefault <T extends t.Mixed> (
  type: T,
  defaultValue: (() => t.TypeOf<T>) | t.TypeOf<T>
): t.Type<t.TypeOf<T>, t.TypeOf<T>> {
  const value = isFunction(defaultValue)
    ? defaultValue()
    : defaultValue

  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(value)})`,
    type.is,
    (v, c) => type.validate(v != null ? v : value, c),
    type.encode
  )
}

export interface Thenable <T> {
  then <U> (
    onFulfilled?: (value: T) => U | Thenable<U>,
    onRejected?: (error: any) => U | Thenable<U>
  ): Thenable<U>
}

export type Query =
  | Raw
  | QueryBuilder
  | SchemaBuilder
  | Thenable<any>

export type DistinctArrayTuple <T, V = any> = T extends [string, string, V]
  ? [string, string, V]
  : T extends [string, V]
    ? [string, V]
    : T extends V[]
      ? V[]
      : V

export type ObjectLiteral = { [key: string]: any }

export type Criteria2 <D = ObjectLiteral> = [keyof D, D[keyof D]]
export type Criteria3 <D = ObjectLiteral> = [keyof D, string, D[keyof D]]
export type CriteriaObj <D = ObjectLiteral> = Partial<D>

export type CriteriaBase <D = ObjectLiteral> =
  | Criteria2<DistinctArrayTuple<D>>
  | Criteria3<DistinctArrayTuple<D>>
  | Partial<D>

export type CriteriaList <D = ObjectLiteral> = CriteriaBase<DistinctArrayTuple<D>>[]

export type Criteria<D = ObjectLiteral> =
  | CriteriaBase<D>
  // TODO: making this generic causes type errors
  | CriteriaList<D>

export const Index = t.union([
  t.string,
  t.array(t.union([t.string, t.array(t.string)])),
  t.dictionary(t.string, t.union([t.string, t.array(t.string)]))
])

export const GroupOrder = t.union([
  t.string,
  t.tuple([t.string, t.string])
])

export const TrilogyOptions = t.partial({
  client: withDefault(
    t.union([t.literal('sqlite3'), t.literal('sql.js')]),
    'sqlite3'
  ),
  connection: withDefault(t.partial({
    filename: t.string
  }), {}),
  dir: withDefault(t.string, process.cwd),
  verbose: withDefault(t.Function, () => t.identity)
})

export const ModelOptions = t.partial({
  index: Index,
  primary: t.array(t.string),
  unique: t.array(t.string),
  timestamps: t.boolean
})

export const AggregateOptions = t.partial({
  distinct: t.boolean,
  group: GroupOrder,
  order: GroupOrder
})

export const CreateOptions = t.partial({
  raw: t.boolean
})

export const FindOptions = t.partial({
  limit: t.number,
  order: GroupOrder,
  random: t.boolean,
  raw: t.boolean,
  skip: t.number
})

export const UpdateOptions = t.partial({
  raw: t.boolean
})

export const ColumnKind = t.refinement(
  t.union([t.string, t.Function]),
  value => {
    const type = isFunction(value) ? value.name : String(value)
    return COLUMN_TYPES.includes(type.toLowerCase())
  }
)

export const ColumnDescriptor = t.partial({
  defaultTo: t.any,
  index: t.string,
  notNullable: t.boolean,
  nullable: t.boolean,
  primary: t.boolean,
  unique: t.boolean,
  type: ColumnKind,
  get: t.Function,
  set: t.Function
})

export const WhereTuple = t.union([
  t.tuple([t.string, t.any]),
  t.tuple([t.string, t.string, t.any])
])

export const WhereClause = t.union([
  WhereTuple,
  t.Dictionary
])

export const WhereMultiple = t.array(WhereClause)

export type Index = t.TypeOf<typeof Index>
export type Order = t.TypeOf<typeof GroupOrder>

export type TrilogyOptions = t.TypeOf<typeof TrilogyOptions>
export type ModelOptions = t.TypeOf<typeof ModelOptions>
export type AggregateOptions = t.TypeOf<typeof AggregateOptions>
export type CreateOptions = t.TypeOf<typeof CreateOptions>
export type UpdateOptions = t.TypeOf<typeof UpdateOptions>
export type FindOptions = t.TypeOf<typeof FindOptions>
export type ColumnKind = t.TypeOf<typeof ColumnKind>
export type ColumnDescriptor = t.TypeOf<typeof ColumnDescriptor>

export interface SchemaRaw {
  [key: string]: ColumnKind | ColumnDescriptor
}

export interface Schema {
  [key: string]: ColumnDescriptor
}

export type SqlJsResponse = Array<{
  columns: string[],
  values: any[]
}>

export type WhereTuple = t.TypeOf<typeof WhereTuple>
export type WhereClause = t.TypeOf<typeof WhereClause>
export type WhereMultiple = WhereClause[]

export type StorageType = string | number | Date | null | undefined
export type ReturnType =
  | string
  | number
  | boolean
  | null
  | undefined
  | any[]
  | Date
  | ObjectLiteral

export type ReturnDict = { [key: string]: ReturnType }

export type CastToDefinition =
  | { [key: string]: StorageType }
  | [string, StorageType]
  | [string, string, StorageType]
  | WhereMultiple
  | never
