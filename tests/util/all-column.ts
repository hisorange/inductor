import { ColumnType } from '../../src/enum/column-type.enum';
import { ISchema } from '../../src/interface/schema.interface';

export const allColumn: ISchema['columns'] = {
  bigint: {
    type: ColumnType.BIGINT,
    kind: 'column',
    isNullable: false,
  },
  bigserial: {
    type: ColumnType.BIGSERIAL,
    kind: 'column',
    isNullable: false,
  },
  bit: {
    type: ColumnType.BIT,
    kind: 'column',
    isNullable: false,
  },
  bit_varying: {
    type: ColumnType.BIT_VARYING,
    kind: 'column',
    isNullable: false,
  },
  boolean: {
    type: ColumnType.BOOLEAN,
    kind: 'column',
    isNullable: false,
  },
  box: {
    type: ColumnType.BOX,
    kind: 'column',
    isNullable: false,
  },
  bytea: {
    type: ColumnType.BYTEA,
    kind: 'column',
    isNullable: false,
  },
  char: {
    type: ColumnType.CHAR,
    kind: 'column',
    isNullable: false,
  },
  char_varying: {
    type: ColumnType.CHAR_VARYING,
    kind: 'column',
    isNullable: false,
  },
  cidr: {
    type: ColumnType.CIDR,
    kind: 'column',
    isNullable: false,
  },
  circle: {
    type: ColumnType.CIRCLE,
    kind: 'column',
    isNullable: false,
  },
  date: {
    type: ColumnType.DATE,
    kind: 'column',
    isNullable: false,
  },
  double: {
    type: ColumnType.DOUBLE,
    kind: 'column',
    isNullable: false,
  },
  inet: {
    type: ColumnType.INET,
    kind: 'column',
    isNullable: false,
  },
  integer: {
    type: ColumnType.INTEGER,
    kind: 'column',
    isNullable: false,
  },
  interval: {
    type: ColumnType.INTERVAL,
    kind: 'column',
    isNullable: false,
  },
  json: {
    type: ColumnType.JSON,
    kind: 'column',
    isNullable: false,
  },
  jsonb: {
    type: ColumnType.JSONB,
    kind: 'column',
    isNullable: false,
  },
  line: {
    type: ColumnType.LINE,
    kind: 'column',
    isNullable: false,
  },
  lseg: {
    type: ColumnType.LSEG,
    kind: 'column',
    isNullable: false,
  },
  macaddr: {
    type: ColumnType.MACADDR,
    kind: 'column',
    isNullable: false,
  },
  macaddr8: {
    type: ColumnType.MACADDR8,
    kind: 'column',
    isNullable: false,
  },
  numeric: {
    type: ColumnType.NUMERIC,
    kind: 'column',
    isNullable: false,
  },
  path: {
    type: ColumnType.PATH,
    kind: 'column',
    isNullable: false,
  },
  pg_lsn: {
    type: ColumnType.PG_LSN,
    kind: 'column',
    isNullable: false,
  },
  pg_snapshot: {
    type: ColumnType.PG_SNAPSHOT,
    kind: 'column',
    isNullable: false,
  },
  point: {
    type: ColumnType.POINT,
    kind: 'column',
    isNullable: false,
  },
  polygon: {
    type: ColumnType.POLYGON,
    kind: 'column',
    isNullable: false,
  },
  real: {
    type: ColumnType.REAL,
    kind: 'column',
    isNullable: false,
  },
  smallint: {
    type: ColumnType.SMALLINT,
    kind: 'column',
    isNullable: false,
  },
  smallserial: {
    type: ColumnType.SMALLSERIAL,
    kind: 'column',
    isNullable: false,
  },
  serial: {
    type: ColumnType.SERIAL,
    kind: 'column',
    isNullable: false,
  },
  text: {
    type: ColumnType.TEXT,
    kind: 'column',
    isNullable: false,
  },
  time: {
    type: ColumnType.TIME,
    kind: 'column',
    isNullable: false,
  },
  time_with_timezone: {
    type: ColumnType.TIME_WITH_TIMEZONE,
    kind: 'column',
    isNullable: false,
  },
  timestamp: {
    type: ColumnType.TIMESTAMP,
    kind: 'column',
    isNullable: false,
  },
  timestamp_with_timezone: {
    type: ColumnType.TIMESTAMP_WITH_TIMEZONE,
    kind: 'column',
    isNullable: false,
  },
  tsquery: {
    type: ColumnType.TSQUERY,
    kind: 'column',
    isNullable: false,
  },
  tsvector: {
    type: ColumnType.TSVECTOR,
    kind: 'column',
    isNullable: false,
  },
  txid_snapshot: {
    type: ColumnType.TXID_SNAPSHOT,
    kind: 'column',
    isNullable: false,
  },
  uuid: {
    type: ColumnType.UUID,
    kind: 'column',
    isNullable: false,
  },
  xml: {
    type: ColumnType.XML,
    kind: 'column',
    isNullable: false,
  },
};
