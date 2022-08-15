import { Pojo } from 'objection';
import { ColumnKind } from './column.kind';
import { MySQLColumnType } from './mysql';
import { PostgresColumnType } from './postgres/postgres.column-type';
import { PostgresIndexType } from './postgres/postgres.index-type';

export type EnumColumnType = {
  name: PostgresColumnType.ENUM;
  nativeName: string;
  values: string[];
};

type ScalableColumnType = {
  name: PostgresColumnType.NUMERIC;
  precision: number;
  scale: number;
};

type VariableLengthColumnType = {
  name: PostgresColumnType.BIT_VARYING | PostgresColumnType.CHAR_VARYING;
  length: number;
};

type BasicColumnType = {
  name: // Has fixed default value
  | PostgresColumnType.NUMERIC
    | PostgresColumnType.TEXT
    // All attribute is fixed
    | PostgresColumnType.DOUBLE
    | PostgresColumnType.REAL
    | PostgresColumnType.BIGINT
    | PostgresColumnType.BIGSERIAL
    | PostgresColumnType.BIT
    | PostgresColumnType.BOOLEAN
    | PostgresColumnType.BOX
    | PostgresColumnType.BYTEA
    | PostgresColumnType.CHAR
    | PostgresColumnType.CIDR
    | PostgresColumnType.CIRCLE
    | PostgresColumnType.DATE
    | PostgresColumnType.INET
    | PostgresColumnType.INTEGER
    | PostgresColumnType.INTERVAL
    | PostgresColumnType.JSON
    | PostgresColumnType.JSONB
    | PostgresColumnType.LINE
    | PostgresColumnType.LSEG
    | PostgresColumnType.MACADDR
    | PostgresColumnType.MACADDR8
    | PostgresColumnType.MONEY
    | PostgresColumnType.PATH
    | PostgresColumnType.PG_LSN
    | PostgresColumnType.PG_SNAPSHOT
    | PostgresColumnType.POINT
    | PostgresColumnType.POLYGON
    | PostgresColumnType.SMALLINT
    | PostgresColumnType.SMALLSERIAL
    | PostgresColumnType.SERIAL
    | PostgresColumnType.TIME
    | PostgresColumnType.TIME_WITH_TIMEZONE
    | PostgresColumnType.TIMESTAMP
    | PostgresColumnType.TIMESTAMP_WITH_TIMEZONE
    | PostgresColumnType.TSQUERY
    | PostgresColumnType.TSVECTOR
    | PostgresColumnType.TXID_SNAPSHOT
    | PostgresColumnType.UUID
    | PostgresColumnType.XML;

  precision?: number;
  scale?: number;
  length?: number;
};

export interface IColumn<ColumnMeta = unknown> {
  /**
   * Columns can be defined as a traditional column,
   * but also as virtual / stored / computed columns.
   */
  kind: ColumnKind;

  /**
   * Property alias on the model.
   */
  propertyName?: string;

  /**
   * Type mapping with type attributes
   */
  type:
    | BasicColumnType
    | ScalableColumnType
    | EnumColumnType
    | VariableLengthColumnType
    | {
        name: MySQLColumnType;
      };

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
  isIndexed: false | PostgresIndexType;

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
   * Associated metadata with the database
   */
  meta?: ColumnMeta;
}
