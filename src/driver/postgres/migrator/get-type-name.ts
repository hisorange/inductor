import { IColumn } from '../../../interface/schema/column.interface';
import { PostgresColumnType } from '../../../interface/schema/postgres/postgres.column-type';

export const getTypeName = (column: IColumn): string => {
  let typeName: string = '';
  let isPrecisionDefined: boolean;
  let isScaleDefined: boolean;
  let isLengthDefined: boolean;

  switch (column.type.name) {
    case PostgresColumnType.BIGINT:
      typeName = 'bigint';
      break;
    case PostgresColumnType.BIGSERIAL:
      typeName = 'bigserial';
      break;
    case PostgresColumnType.BIT:
      typeName = 'bit';
      break;
    case PostgresColumnType.BIT_VARYING:
      isLengthDefined = typeof column.type.length === 'number';
      typeName =
        'bit varying' + (isLengthDefined ? `(${column.type.length})` : '');
      break;
    case PostgresColumnType.BOOLEAN:
      typeName = 'boolean';
      break;
    case PostgresColumnType.BOX:
      typeName = 'box';
      break;
    case PostgresColumnType.BYTEA:
      typeName = 'bytea';
      break;
    case PostgresColumnType.CHAR:
      typeName = 'character';
      break;
    case PostgresColumnType.CHAR_VARYING:
      isLengthDefined = typeof column.type.length === 'number';
      typeName =
        'character varying' +
        (isLengthDefined ? `(${column.type.length})` : '');
      break;
    case PostgresColumnType.CIDR:
      typeName = 'cidr';
      break;
    case PostgresColumnType.CIRCLE:
      typeName = 'circle';
      break;
    case PostgresColumnType.DATE:
      typeName = 'date';
      break;
    case PostgresColumnType.DOUBLE:
      typeName = 'double precision';
      break;
    case PostgresColumnType.INET:
      typeName = 'inet';
      break;
    case PostgresColumnType.INTEGER:
      typeName = 'integer';
      break;
    case PostgresColumnType.INTERVAL:
      typeName = 'interval';
      break;
    case PostgresColumnType.JSON:
      typeName = 'json';
      break;
    case PostgresColumnType.JSONB:
      typeName = 'jsonb';
      break;
    case PostgresColumnType.LINE:
      typeName = 'line';
      break;
    case PostgresColumnType.LSEG:
      typeName = 'lseg';
      break;
    case PostgresColumnType.MACADDR:
      typeName = 'macaddr';
      break;
    case PostgresColumnType.MACADDR8:
      typeName = 'macaddr8';
      break;
    case PostgresColumnType.MONEY:
      typeName = 'money';
      break;
    case PostgresColumnType.NUMERIC:
      isPrecisionDefined = typeof column.type.precision === 'number';
      isScaleDefined = typeof column.type.scale === 'number';

      // Cannot define scale without precision
      if (!isPrecisionDefined) {
        typeName = 'numeric';
      }
      // Only precision is defined but not scale
      else if (!isScaleDefined) {
        typeName = `numeric(${column.type.precision})`;
      }
      // Both precision and scale are defined
      else {
        typeName = `numeric(${column.type.precision}, ${column.type.scale})`;
      }
      break;
    case PostgresColumnType.PATH:
      typeName = 'path';
      break;
    case PostgresColumnType.PG_LSN:
      typeName = 'pg_lsn';
      break;
    case PostgresColumnType.PG_SNAPSHOT:
      typeName = 'pg_snapshot';
      break;
    case PostgresColumnType.POINT:
      typeName = 'point';
      break;
    case PostgresColumnType.POLYGON:
      typeName = 'polygon';
      break;

    case PostgresColumnType.REAL:
      typeName = 'real';
      break;

    case PostgresColumnType.SMALLINT:
      typeName = 'smallint';
      break;
    case PostgresColumnType.SMALLSERIAL:
      typeName = 'smallserial';
      break;
    case PostgresColumnType.SERIAL:
      typeName = 'serial';
      break;
    case PostgresColumnType.TEXT:
      typeName = 'text';
      break;
    case PostgresColumnType.TIME:
      typeName = 'time';
      break;
    case PostgresColumnType.TIME_WITH_TIMEZONE:
      typeName = 'time with time zone';
      break;
    case PostgresColumnType.TIMESTAMP:
      typeName = 'timestamp';
      break;
    case PostgresColumnType.TIMESTAMP_WITH_TIMEZONE:
      typeName = 'timestamp with time zone';
      break;
    case PostgresColumnType.TSQUERY:
      typeName = 'tsquery';
      break;
    case PostgresColumnType.TSVECTOR:
      typeName = 'tsvector';
      break;
    case PostgresColumnType.TXID_SNAPSHOT:
      typeName = 'txid_snapshot';
      break;
    case PostgresColumnType.UUID:
      typeName = 'uuid';
      break;
    case PostgresColumnType.XML:
      typeName = 'xml';
      break;
    case PostgresColumnType.ENUM:
      typeName = column.type.nativeName;
      break;

    default:
      throw new Error(
        `Unsupported column type: ${(column as IColumn).type.name}`,
      );
  }

  return typeName;
};
