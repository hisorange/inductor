import { PostgresColumnType } from '../../src/driver/postgres/postgres.column-type';
import { ISchema } from '../../src/interface/schema.interface';

export const allColumn: ISchema['columns'] = {
  bigint: {
    type: PostgresColumnType.BIGINT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  bigserial: {
    type: PostgresColumnType.BIGSERIAL,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  bit: {
    type: PostgresColumnType.BIT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  bit_varying: {
    type: PostgresColumnType.BIT_VARYING,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  boolean: {
    type: PostgresColumnType.BOOLEAN,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  box: {
    type: PostgresColumnType.BOX,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  bytea: {
    type: PostgresColumnType.BYTEA,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  char: {
    type: PostgresColumnType.CHAR,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  char_varying: {
    type: PostgresColumnType.CHAR_VARYING,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  cidr: {
    type: PostgresColumnType.CIDR,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  circle: {
    type: PostgresColumnType.CIRCLE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  date: {
    type: PostgresColumnType.DATE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  double: {
    type: PostgresColumnType.DOUBLE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  inet: {
    type: PostgresColumnType.INET,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  integer: {
    type: PostgresColumnType.INTEGER,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  interval: {
    type: PostgresColumnType.INTERVAL,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  json: {
    type: PostgresColumnType.JSON,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  jsonb: {
    type: PostgresColumnType.JSONB,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  line: {
    type: PostgresColumnType.LINE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  lseg: {
    type: PostgresColumnType.LSEG,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  macaddr: {
    type: PostgresColumnType.MACADDR,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  macaddr8: {
    type: PostgresColumnType.MACADDR8,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  numeric: {
    type: PostgresColumnType.NUMERIC,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  path: {
    type: PostgresColumnType.PATH,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  pg_lsn: {
    type: PostgresColumnType.PG_LSN,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  pg_snapshot: {
    type: PostgresColumnType.PG_SNAPSHOT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  point: {
    type: PostgresColumnType.POINT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  polygon: {
    type: PostgresColumnType.POLYGON,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  real: {
    type: PostgresColumnType.REAL,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  smallint: {
    type: PostgresColumnType.SMALLINT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  smallserial: {
    type: PostgresColumnType.SMALLSERIAL,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  serial: {
    type: PostgresColumnType.SERIAL,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  text: {
    type: PostgresColumnType.TEXT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  time: {
    type: PostgresColumnType.TIME,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  time_with_timezone: {
    type: PostgresColumnType.TIME_WITH_TIMEZONE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  timestamp: {
    type: PostgresColumnType.TIMESTAMP,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  timestamp_with_timezone: {
    type: PostgresColumnType.TIMESTAMP_WITH_TIMEZONE,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  tsquery: {
    type: PostgresColumnType.TSQUERY,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  tsvector: {
    type: PostgresColumnType.TSVECTOR,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  txid_snapshot: {
    type: PostgresColumnType.TXID_SNAPSHOT,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  uuid: {
    type: PostgresColumnType.UUID,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
  xml: {
    type: PostgresColumnType.XML,
    kind: 'column',
    isNullable: false,
    isUnique: false,
    isPrimary: false,
  },
};
