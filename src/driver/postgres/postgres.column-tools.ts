import { IColumn } from '../../interface/column.interface';
import { PostgresColumnType } from './postgres.column-type';
import { PostgresIndexType } from './postgres.index-type';

const CannotBePrimary = [
  PostgresColumnType.BOX,
  PostgresColumnType.CIRCLE,
  PostgresColumnType.JSON,
  PostgresColumnType.LINE,
  PostgresColumnType.LSEG,
  PostgresColumnType.PATH,
  PostgresColumnType.PG_SNAPSHOT,
  PostgresColumnType.POINT,
  PostgresColumnType.POLYGON,
  PostgresColumnType.TXID_SNAPSHOT,
  PostgresColumnType.XML,
];

const CannotBeUnique = [
  PostgresColumnType.BOX,
  PostgresColumnType.CIRCLE,
  PostgresColumnType.JSON,
  PostgresColumnType.JSONB,
  PostgresColumnType.LINE,
  PostgresColumnType.LSEG,
  PostgresColumnType.PATH,
  PostgresColumnType.PG_SNAPSHOT,
  PostgresColumnType.POINT,
  PostgresColumnType.POLYGON,
  PostgresColumnType.TXID_SNAPSHOT,
  PostgresColumnType.XML,
  // Serial types cannot be unique as those are primary keys
  PostgresColumnType.SMALLSERIAL,
  PostgresColumnType.SERIAL,
  PostgresColumnType.BIGSERIAL,
];

const SerialTypes = [
  PostgresColumnType.BIGSERIAL,
  PostgresColumnType.SERIAL,
  PostgresColumnType.SMALLSERIAL,
];

const IntegerTypes = [
  PostgresColumnType.BIGINT,
  PostgresColumnType.INTEGER,
  PostgresColumnType.SMALLINT,
];

const FloatTypes = [
  PostgresColumnType.MONEY,
  PostgresColumnType.DOUBLE,
  PostgresColumnType.REAL,
  PostgresColumnType.MONEY,
  PostgresColumnType.NUMERIC,
];

export const PostgresColumnTools = {
  /**
   * Check if the column is serial type
   */
  isSerialType(column: IColumn): boolean {
    return SerialTypes.includes(column.type);
  },

  isFloatType(column: IColumn): boolean {
    return FloatTypes.includes(column.type);
  },

  /**
   * Columns which hold an integer
   */
  isIntegerType(column: IColumn): boolean {
    return IntegerTypes.includes(column.type) || this.isSerialType(column);
  },

  /**
   * Check if the column type can be a primary key
   */
  canTypeBePrimary(col: IColumn): boolean {
    return !CannotBePrimary.includes(col.type);
  },

  /**
   * Check if the column type can be unique
   */
  canTypeBeUnique(col: IColumn): boolean {
    return !CannotBeUnique.includes(col.type);
  },

  /**
   * List of index types that are supported
   */
  listIndexTypes(): string[] {
    return [
      PostgresIndexType.BTREE,
      PostgresIndexType.HASH,
      PostgresIndexType.GIN,
      PostgresIndexType.BRIN,
      PostgresIndexType.GIST,
      PostgresIndexType.SPGIST,
    ];
  },

  /**
   * List of possible column types
   */
  listColumnTypes(): string[] {
    return [
      PostgresColumnType.BIGINT,
      PostgresColumnType.BIGSERIAL,
      PostgresColumnType.BIT,
      PostgresColumnType.BIT_VARYING,
      PostgresColumnType.BOOLEAN,
      PostgresColumnType.BOX,
      PostgresColumnType.BYTEA,
      PostgresColumnType.CHAR,
      PostgresColumnType.CHAR_VARYING,
      PostgresColumnType.CIDR,
      PostgresColumnType.CIRCLE,
      PostgresColumnType.DATE,
      PostgresColumnType.DOUBLE,
      PostgresColumnType.INET,
      PostgresColumnType.INTEGER,
      PostgresColumnType.INTERVAL,
      PostgresColumnType.JSON,
      PostgresColumnType.JSONB,
      PostgresColumnType.LINE,
      PostgresColumnType.LSEG,
      PostgresColumnType.MACADDR,
      PostgresColumnType.MACADDR8,
      PostgresColumnType.MONEY,
      PostgresColumnType.NUMERIC,
      PostgresColumnType.PATH,
      PostgresColumnType.PG_LSN,
      PostgresColumnType.PG_SNAPSHOT,
      PostgresColumnType.POINT,
      PostgresColumnType.POLYGON,
      PostgresColumnType.REAL,
      PostgresColumnType.SMALLINT,
      PostgresColumnType.SMALLSERIAL,
      PostgresColumnType.SERIAL,
      PostgresColumnType.TEXT,
      PostgresColumnType.TIME,
      PostgresColumnType.TIME_WITH_TIMEZONE,
      PostgresColumnType.TIMESTAMP,
      PostgresColumnType.TIMESTAMP_WITH_TIMEZONE,
      PostgresColumnType.TSQUERY,
      PostgresColumnType.TSVECTOR,
      PostgresColumnType.TXID_SNAPSHOT,
      PostgresColumnType.UUID,
      PostgresColumnType.XML,
    ];
  },
};
