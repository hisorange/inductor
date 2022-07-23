import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { IColumn } from '../../../interface/column.interface';
import { ISchema } from '../../../interface/schema.interface';
import { PostgresColumnType } from '../postgres.column-type';

export const createColumn = (
  table: Knex.CreateTableBuilder,
  name: string,
  column: IColumn,
  schema: ISchema,
) => {
  let columnBuilder: Knex.ColumnBuilder;

  switch (column.type) {
    case PostgresColumnType.BIGINT:
      columnBuilder = table.bigInteger(name);
      break;
    case PostgresColumnType.BIGSERIAL:
      columnBuilder = table.specificType(name, 'bigserial');
      break;
    case PostgresColumnType.BIT:
      columnBuilder = table.specificType(name, 'bit');
      break;
    case PostgresColumnType.BIT_VARYING:
      columnBuilder = table.specificType(name, 'bit varying');
      break;
    case PostgresColumnType.BOOLEAN:
      columnBuilder = table.boolean(name);
      break;
    case PostgresColumnType.BOX:
      columnBuilder = table.specificType(name, 'box');
      break;
    case PostgresColumnType.BYTEA:
      columnBuilder = table.specificType(name, 'bytea');
      break;
    case PostgresColumnType.CHAR:
      columnBuilder = table.specificType(name, 'character');
      break;
    case PostgresColumnType.CHAR_VARYING:
      columnBuilder = table.specificType(name, 'character varying');
      break;
    case PostgresColumnType.CIDR:
      columnBuilder = table.specificType(name, 'cidr');
      break;
    case PostgresColumnType.CIRCLE:
      columnBuilder = table.specificType(name, 'circle');
      break;
    case PostgresColumnType.DATE:
      columnBuilder = table.date(name);
      break;
    case PostgresColumnType.DOUBLE:
      columnBuilder = table.specificType(name, 'double precision');
      break;
    case PostgresColumnType.INET:
      columnBuilder = table.specificType(name, 'inet');
      break;
    case PostgresColumnType.INTEGER:
      columnBuilder = table.integer(name);
      break;
    case PostgresColumnType.INTERVAL:
      columnBuilder = table.specificType(name, 'interval');
      break;
    case PostgresColumnType.JSON:
      columnBuilder = table.json(name);
      break;
    case PostgresColumnType.JSONB:
      columnBuilder = table.jsonb(name);
      break;
    case PostgresColumnType.LINE:
      columnBuilder = table.specificType(name, 'line');
      break;
    case PostgresColumnType.LSEG:
      columnBuilder = table.specificType(name, 'lseg');
      break;
    case PostgresColumnType.MACADDR:
      columnBuilder = table.specificType(name, 'macaddr');
      break;
    case PostgresColumnType.MACADDR8:
      columnBuilder = table.specificType(name, 'macaddr8');
      break;
    case PostgresColumnType.MONEY:
      columnBuilder = table.specificType(name, 'money');
      break;
    case PostgresColumnType.NUMERIC:
      columnBuilder = table.specificType(name, 'numeric');
      break;
    case PostgresColumnType.PATH:
      columnBuilder = table.specificType(name, 'path');
      break;
    case PostgresColumnType.PG_LSN:
      columnBuilder = table.specificType(name, 'pg_lsn');
      break;
    case PostgresColumnType.PG_SNAPSHOT:
      columnBuilder = table.specificType(name, 'pg_snapshot');
      break;
    case PostgresColumnType.POINT:
      columnBuilder = table.specificType(name, 'point');
      break;
    case PostgresColumnType.POLYGON:
      columnBuilder = table.specificType(name, 'polygon');
      break;
    case PostgresColumnType.REAL:
      columnBuilder = table.specificType(name, 'real');
      break;
    case PostgresColumnType.SMALLINT:
      columnBuilder = table.smallint(name);
      break;
    case PostgresColumnType.SMALLSERIAL:
      columnBuilder = table.specificType(name, 'smallserial');
      break;
    case PostgresColumnType.SERIAL:
      columnBuilder = table.specificType(name, 'serial');
      break;
    case PostgresColumnType.TEXT:
      columnBuilder = table.text(name);
      break;
    case PostgresColumnType.TIME:
      columnBuilder = table.time(name);
      break;
    case PostgresColumnType.TIME_WITH_TIMEZONE:
      columnBuilder = table.specificType(name, 'time with time zone');
      break;
    case PostgresColumnType.TIMESTAMP:
      columnBuilder = table.timestamp(name, {
        useTz: false,
      });
      break;
    case PostgresColumnType.TIMESTAMP_WITH_TIMEZONE:
      columnBuilder = table.timestamp(name, {
        useTz: true,
      });
      break;
    case PostgresColumnType.TSQUERY:
      columnBuilder = table.specificType(name, 'tsquery');
      break;
    case PostgresColumnType.TSVECTOR:
      columnBuilder = table.specificType(name, 'tsvector');
      break;
    case PostgresColumnType.TXID_SNAPSHOT:
      columnBuilder = table.specificType(name, 'txid_snapshot');
      break;
    case PostgresColumnType.UUID:
      columnBuilder = table.uuid(name);
      break;
    case PostgresColumnType.XML:
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

  // Add unique constraint
  if (column.isUnique) {
    columnBuilder.unique();
  }

  // Add primary constraint, only if this is the only primary column
  if (column.isPrimary && ColumnTools.filterPrimary(schema).length === 1) {
    columnBuilder.primary();
  }
};
