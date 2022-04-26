import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
import { createConnection } from './util/create-connection';

describe('Table creation', () => {
  let conn: Connection;

  beforeAll(() => {
    conn = createConnection();
  });

  afterAll(async () => {
    await conn.close();
  });

  test.each(['test', '__test', 'TeSt_ted'])(
    'should create the [%s] table from the schema',
    async (id: string) => {
      const schema: ISchema = {
        name: id,
        kind: 'table',
        columns: {
          bigint: {
            type: ColumnType.BIGINT,
            name: 'bigint',
            kind: 'column',
          },
          bigserial: {
            type: ColumnType.BIG_SERIAL,
            name: 'bigserial',
            kind: 'column',
          },
          bit: {
            type: ColumnType.BIT,
            name: 'bit',
            kind: 'column',
          },
          bit_varying: {
            type: ColumnType.BIT_VARYING,
            name: 'bit varying',
            kind: 'column',
          },
          boolean: {
            type: ColumnType.BOOLEAN,
            name: 'boolean',
            kind: 'column',
          },
          box: {
            type: ColumnType.BOX,
            name: 'box',
            kind: 'column',
          },
          bytea: {
            type: ColumnType.BYTEA,
            name: 'bytea',
            kind: 'column',
          },
          char: {
            type: ColumnType.CHAR,
            name: 'char',
            kind: 'column',
          },
          char_varying: {
            type: ColumnType.CHAR_VARYING,
            name: 'char varying',
            kind: 'column',
          },
          cidr: {
            type: ColumnType.CIDR,
            name: 'cidr',
            kind: 'column',
          },
          circle: {
            type: ColumnType.CIRCLE,
            name: 'circle',
            kind: 'column',
          },
          date: {
            type: ColumnType.DATE,
            name: 'date',
            kind: 'column',
          },
          double: {
            type: ColumnType.DOUBLE,
            name: 'double',
            kind: 'column',
          },
          inet: {
            type: ColumnType.INET,
            name: 'inet',
            kind: 'column',
          },
          integer: {
            type: ColumnType.INTEGER,
            name: 'integer',
            kind: 'column',
          },
          interval: {
            type: ColumnType.INTERVAL,
            name: 'interval',
            kind: 'column',
          },
          json: {
            type: ColumnType.JSON,
            name: 'json',
            kind: 'column',
          },
          jsonb: {
            type: ColumnType.JSONB,
            name: 'jsonb',
            kind: 'column',
          },
          line: {
            type: ColumnType.LINE,
            name: 'line',
            kind: 'column',
          },
          lseg: {
            type: ColumnType.LSEG,
            name: 'lseg',
            kind: 'column',
          },
          macaddr: {
            type: ColumnType.MACADDR,
            name: 'macaddr',
            kind: 'column',
          },
          macaddr8: {
            type: ColumnType.MACADDR8,
            name: 'macaddr8',
            kind: 'column',
          },
          numeric: {
            type: ColumnType.NUMERIC,
            name: 'numeric',
            kind: 'column',
          },
          path: {
            type: ColumnType.PATH,
            name: 'path',
            kind: 'column',
          },
          pg_lsn: {
            type: ColumnType.PG_LSN,
            name: 'pg_lsn',
            kind: 'column',
          },
          pg_snapshot: {
            type: ColumnType.PG_SNAPSHOT,
            name: 'pg_snapshot',
            kind: 'column',
          },
          point: {
            type: ColumnType.POINT,
            name: 'point',
            kind: 'column',
          },
          polygon: {
            type: ColumnType.POLYGON,
            name: 'polygon',
            kind: 'column',
          },
          real: {
            type: ColumnType.REAL,
            name: 'real',
            kind: 'column',
          },
          smallint: {
            type: ColumnType.SMALL_INT,
            name: 'smallint',
            kind: 'column',
          },
          smallserial: {
            type: ColumnType.SMALL_SERIAL,
            name: 'smallserial',
            kind: 'column',
          },
          serial: {
            type: ColumnType.SERIAL,
            name: 'serial',
            kind: 'column',
          },
          text: {
            type: ColumnType.TEXT,
            name: 'text',
            kind: 'column',
          },
          time: {
            type: ColumnType.TIME,
            name: 'time',
            kind: 'column',
          },
          time_with_timezone: {
            type: ColumnType.TIME_WITH_TIMEZONE,
            name: 'time with time zone',
            kind: 'column',
          },
          timestamp: {
            type: ColumnType.TIMESTAMP,
            name: 'timestamp',
            kind: 'column',
          },
          timestamp_with_timezone: {
            type: ColumnType.TIMESTAMP_WITH_TIMEZONE,
            name: 'timestamp with time zone',
            kind: 'column',
          },
          tsquery: {
            type: ColumnType.TSQUERY,
            name: 'tsquery',
            kind: 'column',
          },
          tsvector: {
            type: ColumnType.TSVECTOR,
            name: 'tsvector',
            kind: 'column',
          },
          txid_snapshot: {
            type: ColumnType.TXID_SNAPSHOT,
            name: 'txid_snapshot',
            kind: 'column',
          },
          uuid: {
            type: ColumnType.UUID,
            name: 'uuid',
            kind: 'column',
          },
          xml: {
            type: ColumnType.XML,
            name: 'xml',
            kind: 'column',
          },
        },
      };

      await conn.associate(schema);

      expect(await conn.migrator.inspector.tables()).toContain(id);
    },
    5_000,
  );
});
