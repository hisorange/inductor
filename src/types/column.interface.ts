import { Pojo } from 'objection';
import { ColumnType } from './column-type.enum';
import { ColumnCapability } from './column.capability';
import { IndexType } from './index-type.enum';

export type EnumColumnType = {
  name: ColumnType.ENUM;
  nativeName: string;
  values: string[];
};

type ScalableColumnType = {
  name: ColumnType.NUMERIC;
  precision: number;
  scale: number;
};

type VariableLengthColumnType = {
  name: ColumnType.BIT_VARYING | ColumnType.CHAR_VARYING;
  length: number;
};

type BasicColumnType = {
  name: // Has fixed default value
  | ColumnType.NUMERIC
    | ColumnType.TEXT
    // All attribute is fixed
    | ColumnType.DOUBLE
    | ColumnType.REAL
    | ColumnType.BIGINT
    | ColumnType.BIGSERIAL
    | ColumnType.BIT
    | ColumnType.BOOLEAN
    | ColumnType.BOX
    | ColumnType.BYTEA
    | ColumnType.CHAR
    | ColumnType.CIDR
    | ColumnType.CIRCLE
    | ColumnType.DATE
    | ColumnType.INET
    | ColumnType.INTEGER
    | ColumnType.INTERVAL
    | ColumnType.JSON
    | ColumnType.JSONB
    | ColumnType.LINE
    | ColumnType.LSEG
    | ColumnType.MACADDR
    | ColumnType.MACADDR8
    | ColumnType.MONEY
    | ColumnType.PATH
    | ColumnType.PG_LSN
    | ColumnType.PG_SNAPSHOT
    | ColumnType.POINT
    | ColumnType.POLYGON
    | ColumnType.SMALLINT
    | ColumnType.SMALLSERIAL
    | ColumnType.SERIAL
    | ColumnType.TIME
    | ColumnType.TIME_WITH_TIMEZONE
    | ColumnType.TIMESTAMP
    | ColumnType.TIMESTAMP_WITH_TIMEZONE
    | ColumnType.TSQUERY
    | ColumnType.TSVECTOR
    | ColumnType.TXID_SNAPSHOT
    | ColumnType.UUID
    | ColumnType.XML;

  precision?: number;
  scale?: number;
  length?: number;
};

export interface IColumn<ColumnMeta = unknown> {
  /**
   * Type mapping with type attributes
   */
  type:
    | BasicColumnType
    | ScalableColumnType
    | EnumColumnType
    | VariableLengthColumnType;

  /**
   * Nullable constraint.
   */
  isNullable: boolean;

  /**
   * Unique contraint.
   */
  isUnique: boolean;

  /**
   * Primary key constraint.
   */
  isPrimary: boolean;

  /**
   * Index
   */
  isIndexed: false | IndexType;

  /**
   * Default value
   */
  defaultValue:
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<unknown>
    | Pojo;

  /**
   * Model supported capabilities, stored in comment format.
   */
  capabilities: ColumnCapability[];

  /**
   * Model mapping to property name
   */
  alias?: string;

  /**
   * Associated metadata with the database
   */
  meta?: ColumnMeta;
}
