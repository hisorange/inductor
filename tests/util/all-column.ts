import { ColumnType } from '../../src/enum/column-type.enum';
import { ISchema } from '../../src/interface/schema.interface';

export const allColumn: ISchema['columns'] = {
  bigint: {
    type: ColumnType.BIGINT,
    kind: 'column',
  },
  bigserial: {
    type: ColumnType.BIGSERIAL,
    kind: 'column',
  },
  bit: {
    type: ColumnType.BIT,
    kind: 'column',
  },
  bit_varying: {
    type: ColumnType.BIT_VARYING,
    kind: 'column',
  },
  boolean: {
    type: ColumnType.BOOLEAN,
    kind: 'column',
  },
  box: {
    type: ColumnType.BOX,
    kind: 'column',
  },
  bytea: {
    type: ColumnType.BYTEA,
    kind: 'column',
  },
  char: {
    type: ColumnType.CHAR,
    kind: 'column',
  },
  char_varying: {
    type: ColumnType.CHAR_VARYING,
    kind: 'column',
  },
  cidr: {
    type: ColumnType.CIDR,
    kind: 'column',
  },
  circle: {
    type: ColumnType.CIRCLE,
    kind: 'column',
  },
  date: {
    type: ColumnType.DATE,
    kind: 'column',
  },
  double: {
    type: ColumnType.DOUBLE,
    kind: 'column',
  },
  inet: {
    type: ColumnType.INET,
    kind: 'column',
  },
  integer: {
    type: ColumnType.INTEGER,
    kind: 'column',
  },
  interval: {
    type: ColumnType.INTERVAL,
    kind: 'column',
  },
  json: {
    type: ColumnType.JSON,
    kind: 'column',
  },
  jsonb: {
    type: ColumnType.JSONB,
    kind: 'column',
  },
  line: {
    type: ColumnType.LINE,
    kind: 'column',
  },
  lseg: {
    type: ColumnType.LSEG,
    kind: 'column',
  },
  macaddr: {
    type: ColumnType.MACADDR,
    kind: 'column',
  },
  macaddr8: {
    type: ColumnType.MACADDR8,
    kind: 'column',
  },
  numeric: {
    type: ColumnType.NUMERIC,
    kind: 'column',
  },
  path: {
    type: ColumnType.PATH,
    kind: 'column',
  },
  pg_lsn: {
    type: ColumnType.PG_LSN,
    kind: 'column',
  },
  pg_snapshot: {
    type: ColumnType.PG_SNAPSHOT,
    kind: 'column',
  },
  point: {
    type: ColumnType.POINT,
    kind: 'column',
  },
  polygon: {
    type: ColumnType.POLYGON,
    kind: 'column',
  },
  real: {
    type: ColumnType.REAL,
    kind: 'column',
  },
  smallint: {
    type: ColumnType.SMALLINT,
    kind: 'column',
  },
  smallserial: {
    type: ColumnType.SMALLSERIAL,
    kind: 'column',
  },
  serial: {
    type: ColumnType.SERIAL,
    kind: 'column',
  },
  text: {
    type: ColumnType.TEXT,
    kind: 'column',
  },
  time: {
    type: ColumnType.TIME,
    kind: 'column',
  },
  time_with_timezone: {
    type: ColumnType.TIME_WITH_TIMEZONE,
    kind: 'column',
  },
  timestamp: {
    type: ColumnType.TIMESTAMP,
    kind: 'column',
  },
  timestamp_with_timezone: {
    type: ColumnType.TIMESTAMP_WITH_TIMEZONE,
    kind: 'column',
  },
  tsquery: {
    type: ColumnType.TSQUERY,
    kind: 'column',
  },
  tsvector: {
    type: ColumnType.TSVECTOR,
    kind: 'column',
  },
  txid_snapshot: {
    type: ColumnType.TXID_SNAPSHOT,
    kind: 'column',
  },
  uuid: {
    type: ColumnType.UUID,
    kind: 'column',
  },
  xml: {
    type: ColumnType.XML,
    kind: 'column',
  },
};
