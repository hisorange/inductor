import { ColumnType, IColumn, IndexType, ITable } from '../table/types';

const CannotBePrimary = [
  ColumnType.BOX,
  ColumnType.CIRCLE,
  ColumnType.JSON,
  ColumnType.LINE,
  ColumnType.LSEG,
  ColumnType.PATH,
  ColumnType.PG_SNAPSHOT,
  ColumnType.POINT,
  ColumnType.POLYGON,
  ColumnType.TXID_SNAPSHOT,
  ColumnType.XML,
];

const CannotBeUnique = [
  ColumnType.BOX,
  ColumnType.CIRCLE,
  ColumnType.JSON,
  ColumnType.JSONB,
  ColumnType.LINE,
  ColumnType.LSEG,
  ColumnType.PATH,
  ColumnType.PG_SNAPSHOT,
  ColumnType.POINT,
  ColumnType.POLYGON,
  ColumnType.TXID_SNAPSHOT,
  ColumnType.XML,
  // Serial types cannot be unique as those are primary keys
  ColumnType.SMALLSERIAL,
  ColumnType.SERIAL,
  ColumnType.BIGSERIAL,
];

const SerialTypes = [
  ColumnType.BIGSERIAL,
  ColumnType.SERIAL,
  ColumnType.SMALLSERIAL,
];

const IntegerTypes = [
  ColumnType.BIGINT,
  ColumnType.INTEGER,
  ColumnType.SMALLINT,
];

const FloatTypes = [
  ColumnType.MONEY,
  ColumnType.DOUBLE,
  ColumnType.REAL,
  ColumnType.MONEY,
  ColumnType.NUMERIC,
];

const LengthRequiredTypes = [ColumnType.BIT_VARYING, ColumnType.CHAR_VARYING];

const PrecisionRequiredTypes = [ColumnType.NUMERIC];

const ScaleRequiredTypes = [ColumnType.NUMERIC];

const _ColumnTools = {
  /**
   * Check if the column is serial type
   */
  isSerialType(column: IColumn): boolean {
    return SerialTypes.includes(column.type.name);
  },

  isFloatType(column: IColumn): boolean {
    return FloatTypes.includes(column.type.name);
  },

  /**
   * Columns which hold an integer
   */
  isIntegerType(column: IColumn): boolean {
    return IntegerTypes.includes(column.type.name) || this.isSerialType(column);
  },

  /**
   * Check if the column type can be a primary key
   */
  canTypeBePrimary(col: IColumn): boolean {
    return !CannotBePrimary.includes(col.type.name);
  },

  /**
   * Check if the column type can be unique
   */
  canTypeBeUnique(col: IColumn): boolean {
    return !CannotBeUnique.includes(col.type.name);
  },

  /**
   * Type requires a length definition
   */
  isTypeRequiresLength(type: ColumnType): boolean {
    return LengthRequiredTypes.includes(type);
  },

  /**
   * Type requires a precision definition
   */
  isTypeRequiresPrecision(type: ColumnType): boolean {
    return PrecisionRequiredTypes.includes(type);
  },

  /**
   * Type requires a precision definition
   */
  isTypeRequiresScale(type: ColumnType): boolean {
    return ScaleRequiredTypes.includes(type);
  },

  /**
   * List of index types that are supported
   */
  listIndexTypes(): string[] {
    return [
      IndexType.BTREE,
      IndexType.HASH,
      IndexType.GIN,
      IndexType.BRIN,
      IndexType.GIST,
      IndexType.SPGIST,
    ];
  },

  /**
   * List of possible column types
   */
  listColumnTypes(): ColumnType[] {
    return [
      ColumnType.BIGINT,
      ColumnType.BIGSERIAL,
      ColumnType.BIT,
      ColumnType.BIT_VARYING,
      ColumnType.BOOLEAN,
      ColumnType.BOX,
      ColumnType.BYTEA,
      ColumnType.CHAR,
      ColumnType.CHAR_VARYING,
      ColumnType.CIDR,
      ColumnType.CIRCLE,
      ColumnType.DATE,
      ColumnType.DOUBLE,
      ColumnType.INET,
      ColumnType.INTEGER,
      ColumnType.INTERVAL,
      ColumnType.JSON,
      ColumnType.JSONB,
      ColumnType.LINE,
      ColumnType.LSEG,
      ColumnType.MACADDR,
      ColumnType.MACADDR8,
      ColumnType.MONEY,
      ColumnType.NUMERIC,
      ColumnType.PATH,
      ColumnType.PG_LSN,
      ColumnType.PG_SNAPSHOT,
      ColumnType.POINT,
      ColumnType.POLYGON,
      ColumnType.REAL,
      ColumnType.SMALLINT,
      ColumnType.SMALLSERIAL,
      ColumnType.SERIAL,
      ColumnType.TEXT,
      ColumnType.TIME,
      ColumnType.TIME_WITH_TIMEZONE,
      ColumnType.TIMESTAMP,
      ColumnType.TIMESTAMP_WITH_TIMEZONE,
      ColumnType.TSQUERY,
      ColumnType.TSVECTOR,
      ColumnType.TXID_SNAPSHOT,
      ColumnType.UUID,
      ColumnType.XML,
    ];
  },
};

// Find and filter the primary column names from the table
export const filterPrimary = (table: ITable) => {
  const primaries = [];

  for (const colName in table.columns) {
    if (Object.prototype.hasOwnProperty.call(table.columns, colName)) {
      const colDef = table.columns[colName];

      if (colDef.isPrimary) {
        primaries.push(colName);
      }
    }
  }

  return primaries;
};

export const ColumnTools = {
  ..._ColumnTools,

  filterPrimary,
};
