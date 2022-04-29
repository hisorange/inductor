import { Knex } from 'knex';
import { ColumnType } from '../enum/column-type.enum';
import { IColumn } from '../interface/column.interface';
import { ISchema } from '../interface/schema.interface';
import { filterPrimary } from '../util/primary.filter';

export const createColumn = (
  table: Knex.CreateTableBuilder,
  name: string,
  column: IColumn,
  schema: ISchema,
) => {
  let columnBuilder: Knex.ColumnBuilder;

  switch (column.type) {
    case ColumnType.BIGINT:
      columnBuilder = table.bigInteger(name);
      break;
    case ColumnType.BIGSERIAL:
      columnBuilder = table.specificType(name, 'bigserial');
      break;
    case ColumnType.BIT:
      columnBuilder = table.specificType(name, 'bit');
      break;
    case ColumnType.BIT_VARYING:
      columnBuilder = table.specificType(name, 'bit varying');
      break;
    case ColumnType.BOOLEAN:
      columnBuilder = table.boolean(name);
      break;
    case ColumnType.BOX:
      columnBuilder = table.specificType(name, 'box');
      break;
    case ColumnType.BYTEA:
      columnBuilder = table.specificType(name, 'bytea');
      break;
    case ColumnType.CHAR:
      columnBuilder = table.specificType(name, 'character');
      break;
    case ColumnType.CHAR_VARYING:
      columnBuilder = table.specificType(name, 'character varying');
      break;
    case ColumnType.CIDR:
      columnBuilder = table.specificType(name, 'cidr');
      break;
    case ColumnType.CIRCLE:
      columnBuilder = table.specificType(name, 'circle');
      break;
    case ColumnType.DATE:
      columnBuilder = table.date(name);
      break;
    case ColumnType.DOUBLE:
      columnBuilder = table.specificType(name, 'double precision');
      break;
    case ColumnType.INET:
      columnBuilder = table.specificType(name, 'inet');
      break;
    case ColumnType.INTEGER:
      columnBuilder = table.integer(name);
      break;
    case ColumnType.INTERVAL:
      columnBuilder = table.specificType(name, 'interval');
      break;
    case ColumnType.JSON:
      columnBuilder = table.json(name);
      break;
    case ColumnType.JSONB:
      columnBuilder = table.jsonb(name);
      break;
    case ColumnType.LINE:
      columnBuilder = table.specificType(name, 'line');
      break;
    case ColumnType.LSEG:
      columnBuilder = table.specificType(name, 'lseg');
      break;
    case ColumnType.MACADDR:
      columnBuilder = table.specificType(name, 'macaddr');
      break;
    case ColumnType.MACADDR8:
      columnBuilder = table.specificType(name, 'macaddr8');
      break;
    case ColumnType.MONEY:
      columnBuilder = table.specificType(name, 'money');
      break;
    case ColumnType.NUMERIC:
      columnBuilder = table.specificType(name, 'numeric');
      break;
    case ColumnType.PATH:
      columnBuilder = table.specificType(name, 'path');
      break;
    case ColumnType.PG_LSN:
      columnBuilder = table.specificType(name, 'pg_lsn');
      break;
    case ColumnType.PG_SNAPSHOT:
      columnBuilder = table.specificType(name, 'pg_snapshot');
      break;
    case ColumnType.POINT:
      columnBuilder = table.specificType(name, 'point');
      break;
    case ColumnType.POLYGON:
      columnBuilder = table.specificType(name, 'polygon');
      break;
    case ColumnType.REAL:
      columnBuilder = table.specificType(name, 'real');
      break;
    case ColumnType.SMALLINT:
      columnBuilder = table.smallint(name);
      break;
    case ColumnType.SMALLSERIAL:
      columnBuilder = table.specificType(name, 'smallserial');
      break;
    case ColumnType.SERIAL:
      columnBuilder = table.specificType(name, 'serial');
      break;
    case ColumnType.TEXT:
      columnBuilder = table.text(name);
      break;
    case ColumnType.TIME:
      columnBuilder = table.time(name);
      break;
    case ColumnType.TIME_WITH_TIMEZONE:
      columnBuilder = table.specificType(name, 'time with time zone');
      break;
    case ColumnType.TIMESTAMP:
      columnBuilder = table.timestamp(name, {
        useTz: false,
      });
      break;
    case ColumnType.TIMESTAMP_WITH_TIMEZONE:
      columnBuilder = table.timestamp(name, {
        useTz: true,
      });
      break;
    case ColumnType.TSQUERY:
      columnBuilder = table.specificType(name, 'tsquery');
      break;
    case ColumnType.TSVECTOR:
      columnBuilder = table.specificType(name, 'tsvector');
      break;
    case ColumnType.TXID_SNAPSHOT:
      columnBuilder = table.specificType(name, 'txid_snapshot');
      break;
    case ColumnType.UUID:
      columnBuilder = table.uuid(name);
      break;
    case ColumnType.XML:
      columnBuilder = table.specificType(name, 'xml');
      break;

    default:
      throw new Error(`Unsupported column type: ${column.type}`);
  }

  // Add nullable constraint
  if (column.isNullable) {
    columnBuilder.nullable();
  } else {
    columnBuilder.notNullable();
  }

  // Add primary constraint, only if this is the only primary column
  if (column.isPrimary && filterPrimary(schema).length === 1) {
    columnBuilder.primary();
  }
};
