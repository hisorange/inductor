import { ColumnType } from '../schema/types/column-type.enum';

// Maps native type alieses to their full names
export const mapTypname = (typname: string): ColumnType => {
  switch (typname) {
    case 'bigint':
    case 'int8':
      return ColumnType.BIGINT;
    case 'bigserial':
    case 'serial8':
      return ColumnType.BIGSERIAL;
    case 'bit':
      return ColumnType.BIT;
    case 'bit varying':
    case 'varbit':
      return ColumnType.BIT_VARYING;
    case 'bool':
    case 'boolean':
      return ColumnType.BOOLEAN;
    case 'box':
      return ColumnType.BOX;
    case 'bytea':
      return ColumnType.BYTEA;
    case 'bpchar':
    case 'char':
    case 'character':
      return ColumnType.CHAR;
    case 'varchar':
    case 'character varying':
      return ColumnType.CHAR_VARYING;
    case 'cidr':
      return ColumnType.CIDR;
    case 'circle':
      return ColumnType.CIRCLE;
    case 'date':
      return ColumnType.DATE;
    case 'float8':
    case 'double precision':
      return ColumnType.DOUBLE;
    case 'inet':
      return ColumnType.INET;
    case 'int':
    case 'int4':
    case 'integer':
      return ColumnType.INTEGER;
    case 'interval':
      return ColumnType.INTERVAL;
    case 'json':
      return ColumnType.JSON;
    case 'jsonb':
      return ColumnType.JSONB;
    case 'line':
      return ColumnType.LINE;
    case 'lseg':
      return ColumnType.LSEG;
    case 'macaddr':
      return ColumnType.MACADDR;
    case 'macaddr8':
      return ColumnType.MACADDR8;
    case 'money':
      return ColumnType.MONEY;
    case 'decimal':
    case 'numeric':
      return ColumnType.NUMERIC;
    case 'path':
      return ColumnType.PATH;
    case 'pg_lsn':
      return ColumnType.PG_LSN;
    case 'pg_snapshot':
      return ColumnType.PG_SNAPSHOT;
    case 'point':
      return ColumnType.POINT;
    case 'polygon':
      return ColumnType.POLYGON;
    case 'real':
    case 'float4':
      return ColumnType.REAL;
    case 'int2':
    case 'smallint':
      return ColumnType.SMALLINT;
    case 'serial2':
    case 'smallserial':
      return ColumnType.SMALLSERIAL;
    case 'serial':
    case 'serial4':
      return ColumnType.SERIAL;
    case 'text':
      return ColumnType.TEXT;
    case 'time':
    case 'time without time zone':
      return ColumnType.TIME;
    case 'timetz':
    case 'time with time zone':
      return ColumnType.TIME_WITH_TIMEZONE;
    case 'timestamp':
    case 'timestamp without time zone':
      return ColumnType.TIMESTAMP;
    case 'timestamptz':
    case 'timestamp with time zone':
      return ColumnType.TIMESTAMP_WITH_TIMEZONE;
    case 'tsquery':
      return ColumnType.TSQUERY;
    case 'tsvector':
      return ColumnType.TSVECTOR;
    case 'txid_snapshot':
      return ColumnType.TXID_SNAPSHOT;
    case 'uuid':
      return ColumnType.UUID;
    case 'xml':
      return ColumnType.XML;
    default:
      return typname as ColumnType;
  }
};
