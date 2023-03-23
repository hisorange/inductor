import { ColumnType } from '../../../types/column-type.enum';
import { IColumn } from '../../../types/column.interface';

export const generateNativeType = (column: IColumn): string => {
  let typeName: string = '';
  let isPrecisionDefined: boolean;
  let isScaleDefined: boolean;
  let isLengthDefined: boolean;

  switch (column.type.name) {
    case ColumnType.BIGINT:
      typeName = 'bigint';
      break;
    case ColumnType.BIGSERIAL:
      typeName = 'bigserial';
      break;
    case ColumnType.BIT:
      typeName = 'bit';
      break;
    case ColumnType.BIT_VARYING:
      isLengthDefined = typeof column.type.length === 'number';
      typeName =
        'bit varying' + (isLengthDefined ? `(${column.type.length})` : '');
      break;
    case ColumnType.BOOLEAN:
      typeName = 'boolean';
      break;
    case ColumnType.BOX:
      typeName = 'box';
      break;
    case ColumnType.BYTEA:
      typeName = 'bytea';
      break;
    case ColumnType.CHAR:
      typeName = 'character';
      break;
    case ColumnType.CHAR_VARYING:
      isLengthDefined = typeof column.type.length === 'number';
      typeName =
        'character varying' +
        (isLengthDefined ? `(${column.type.length})` : '');
      break;
    case ColumnType.CIDR:
      typeName = 'cidr';
      break;
    case ColumnType.CIRCLE:
      typeName = 'circle';
      break;
    case ColumnType.DATE:
      typeName = 'date';
      break;
    case ColumnType.DOUBLE:
      typeName = 'double precision';
      break;
    case ColumnType.INET:
      typeName = 'inet';
      break;
    case ColumnType.INTEGER:
      typeName = 'integer';
      break;
    case ColumnType.INTERVAL:
      typeName = 'interval';
      break;
    case ColumnType.JSON:
      typeName = 'json';
      break;
    case ColumnType.JSONB:
      typeName = 'jsonb';
      break;
    case ColumnType.LINE:
      typeName = 'line';
      break;
    case ColumnType.LSEG:
      typeName = 'lseg';
      break;
    case ColumnType.MACADDR:
      typeName = 'macaddr';
      break;
    case ColumnType.MACADDR8:
      typeName = 'macaddr8';
      break;
    case ColumnType.MONEY:
      typeName = 'money';
      break;
    case ColumnType.NUMERIC:
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
    case ColumnType.PATH:
      typeName = 'path';
      break;
    case ColumnType.PG_LSN:
      typeName = 'pg_lsn';
      break;
    case ColumnType.PG_SNAPSHOT:
      typeName = 'pg_snapshot';
      break;
    case ColumnType.POINT:
      typeName = 'point';
      break;
    case ColumnType.POLYGON:
      typeName = 'polygon';
      break;

    case ColumnType.REAL:
      typeName = 'real';
      break;

    case ColumnType.SMALLINT:
      typeName = 'smallint';
      break;
    case ColumnType.SMALLSERIAL:
      typeName = 'smallserial';
      break;
    case ColumnType.SERIAL:
      typeName = 'serial';
      break;
    case ColumnType.TEXT:
      typeName = 'text';
      break;
    case ColumnType.TIME:
      typeName = 'time';
      break;
    case ColumnType.TIME_WITH_TIMEZONE:
      typeName = 'time with time zone';
      break;
    case ColumnType.TIMESTAMP:
      typeName = 'timestamp';
      break;
    case ColumnType.TIMESTAMP_WITH_TIMEZONE:
      typeName = 'timestamp with time zone';
      break;
    case ColumnType.TSQUERY:
      typeName = 'tsquery';
      break;
    case ColumnType.TSVECTOR:
      typeName = 'tsvector';
      break;
    case ColumnType.TXID_SNAPSHOT:
      typeName = 'txid_snapshot';
      break;
    case ColumnType.UUID:
      typeName = 'uuid';
      break;
    case ColumnType.XML:
      typeName = 'xml';
      break;
    case ColumnType.ENUM:
      typeName = column.type.nativeName;
      break;

    default:
      throw new Error(
        `Unsupported column type: ${(column as IColumn).type.name}`,
      );
  }

  return typeName;
};
