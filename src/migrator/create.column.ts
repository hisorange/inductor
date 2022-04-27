import { Knex } from 'knex';
import { ColumnType } from '../enum/column-type.enum';
import { IColumn } from '../interface/column.interface';

export const createColumn = (
  table: Knex.CreateTableBuilder,
  name: string,
  column: IColumn,
) => {
  switch (column.type) {
    case ColumnType.BIGINT:
      table.bigInteger(name);
      break;
    case ColumnType.BIGSERIAL:
      table.specificType(name, 'bigserial');
      break;
    case ColumnType.BIT:
      table.specificType(name, 'bit');
      break;
    case ColumnType.BIT_VARYING:
      table.specificType(name, 'bit varying');
      break;
    case ColumnType.BOOLEAN:
      table.boolean(name);
      break;
    case ColumnType.BOX:
      table.specificType(name, 'box');
      break;
    case ColumnType.BYTEA:
      table.specificType(name, 'bytea');
      break;
    case ColumnType.CHAR:
      table.specificType(name, 'character');
      break;
    case ColumnType.CHAR_VARYING:
      table.specificType(name, 'character varying');
      break;
    case ColumnType.CIDR:
      table.specificType(name, 'cidr');
      break;
    case ColumnType.CIRCLE:
      table.specificType(name, 'circle');
      break;
    case ColumnType.DATE:
      table.date(name);
      break;
    case ColumnType.DOUBLE:
      table.specificType(name, 'double precision');
      break;
    case ColumnType.INET:
      table.specificType(name, 'inet');
      break;
    case ColumnType.INTEGER:
      table.integer(name);
      break;
    case ColumnType.INTERVAL:
      table.specificType(name, 'interval');
      break;
    case ColumnType.JSON:
      table.json(name);
      break;
    case ColumnType.JSONB:
      table.jsonb(name);
      break;
    case ColumnType.LINE:
      table.specificType(name, 'line');
      break;
    case ColumnType.LSEG:
      table.specificType(name, 'lseg');
      break;
    case ColumnType.MACADDR:
      table.specificType(name, 'macaddr');
      break;
    case ColumnType.MACADDR8:
      table.specificType(name, 'macaddr8');
      break;
    case ColumnType.MONEY:
      table.specificType(name, 'money');
      break;
    case ColumnType.NUMERIC:
      table.specificType(name, 'numeric');
      break;
    case ColumnType.PATH:
      table.specificType(name, 'path');
      break;
    case ColumnType.PG_LSN:
      table.specificType(name, 'pg_lsn');
      break;
    case ColumnType.PG_SNAPSHOT:
      table.specificType(name, 'pg_snapshot');
      break;
    case ColumnType.POINT:
      table.specificType(name, 'point');
      break;
    case ColumnType.POLYGON:
      table.specificType(name, 'polygon');
      break;
    case ColumnType.REAL:
      table.specificType(name, 'real');
      break;
    case ColumnType.SMALLINT:
      table.smallint(name);
      break;
    case ColumnType.SMALLSERIAL:
      table.specificType(name, 'smallserial');
      break;
    case ColumnType.SERIAL:
      table.specificType(name, 'serial');
      break;
    case ColumnType.TEXT:
      table.text(name);
      break;
    case ColumnType.TIME:
      table.time(name);
      break;
    case ColumnType.TIME_WITH_TIMEZONE:
      table.specificType(name, 'time with time zone');
      break;
    case ColumnType.TIMESTAMP:
      table.timestamp(name, {
        useTz: false,
      });
      break;
    case ColumnType.TIMESTAMP_WITH_TIMEZONE:
      table.timestamp(name, {
        useTz: true,
      });
      break;
    case ColumnType.TSQUERY:
      table.specificType(name, 'tsquery');
      break;
    case ColumnType.TSVECTOR:
      table.specificType(name, 'tsvector');
      break;
    case ColumnType.TXID_SNAPSHOT:
      table.specificType(name, 'txid_snapshot');
      break;
    case ColumnType.UUID:
      table.uuid(name);
      break;
    case ColumnType.XML:
      table.specificType(name, 'xml');
      break;

    default:
      throw new Error(`Unsupported column type: ${column.type}`);
  }
};
