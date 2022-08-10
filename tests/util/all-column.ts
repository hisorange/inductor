import { ColumnTools, IColumn } from '../../src';
import { getEnumName } from '../../src/driver/postgres/migrator/get-enum-name';
import { PostgresColumnType } from '../../src/driver/postgres/postgres.column-type';
import { ColumnKind } from '../../src/interface/schema/column.kind';
import { ISchema } from '../../src/interface/schema/schema.interface';

type typeArguments = {
  length?: number;
  precision?: number;
  scale?: number;
  values?: string[];
  nativeName?: string;
};

export const createColumnWithType = (
  typeName: PostgresColumnType,
  typeArgs: typeArguments = {},
): IColumn => {
  if (ColumnTools.postgres.isTypeRequiresLength(typeName)) {
    typeArgs.length = typeArgs?.length ?? 8;
  } else if (ColumnTools.postgres.isTypeRequiresPrecision(typeName)) {
    typeArgs.precision = typeArgs?.precision ?? 8;
  } else if (ColumnTools.postgres.isTypeRequiresScale(typeName)) {
    typeArgs.scale = typeArgs?.scale ?? 0;
  } else if (typeName === PostgresColumnType.ENUM) {
    if (!typeArgs.values) {
      typeArgs.values = ['a', 'b', 'c'];
    }

    typeArgs.nativeName = typeArgs?.nativeName ?? getEnumName(typeArgs.values);
  }

  if (typeName === PostgresColumnType.NUMERIC) {
    typeArgs.precision = typeArgs?.precision ?? 8;
    typeArgs.scale = typeArgs?.scale ?? 8;
  }

  const definition: IColumn = {
    type: {
      name: typeName,
      ...typeArgs,
    } as IColumn['type'],
    kind: ColumnKind.COLUMN,
    isNullable: false,
    isUnique: false,
    isPrimary: false,
    isIndexed: false,
    defaultValue: undefined,
  };

  // Fix the is primary flag
  if (ColumnTools.postgres.isSerialType(definition)) {
    definition.isPrimary = true;
  }

  return definition;
};

export const allColumn: ISchema['columns'] = {
  bigint: createColumnWithType(PostgresColumnType.BIGINT),
  bigserial: createColumnWithType(PostgresColumnType.BIGSERIAL),
  bit: createColumnWithType(PostgresColumnType.BIT),
  bit_varying: createColumnWithType(PostgresColumnType.BIT_VARYING),
  boolean: createColumnWithType(PostgresColumnType.BOOLEAN),
  box: createColumnWithType(PostgresColumnType.BOX),
  bytea: createColumnWithType(PostgresColumnType.BYTEA),
  char: createColumnWithType(PostgresColumnType.CHAR),
  char_varying: createColumnWithType(PostgresColumnType.CHAR_VARYING),
  cidr: createColumnWithType(PostgresColumnType.CIDR),
  circle: createColumnWithType(PostgresColumnType.CIRCLE),
  date: createColumnWithType(PostgresColumnType.DATE),
  double: createColumnWithType(PostgresColumnType.DOUBLE),
  inet: createColumnWithType(PostgresColumnType.INET),
  integer: createColumnWithType(PostgresColumnType.INTEGER),
  interval: createColumnWithType(PostgresColumnType.INTERVAL),
  json: createColumnWithType(PostgresColumnType.JSON),
  jsonb: createColumnWithType(PostgresColumnType.JSONB),
  line: createColumnWithType(PostgresColumnType.LINE),
  lseg: createColumnWithType(PostgresColumnType.LSEG),
  macaddr: createColumnWithType(PostgresColumnType.MACADDR),
  macaddr8: createColumnWithType(PostgresColumnType.MACADDR8),
  money: createColumnWithType(PostgresColumnType.MONEY),
  numeric: createColumnWithType(PostgresColumnType.NUMERIC),
  path: createColumnWithType(PostgresColumnType.PATH),
  pg_lsn: createColumnWithType(PostgresColumnType.PG_LSN),
  pg_snapshot: createColumnWithType(PostgresColumnType.PG_SNAPSHOT),
  point: createColumnWithType(PostgresColumnType.POINT),
  polygon: createColumnWithType(PostgresColumnType.POLYGON),
  real: createColumnWithType(PostgresColumnType.REAL),
  smallint: createColumnWithType(PostgresColumnType.SMALLINT),
  smallserial: createColumnWithType(PostgresColumnType.SMALLSERIAL),
  serial: createColumnWithType(PostgresColumnType.SERIAL),
  text: createColumnWithType(PostgresColumnType.TEXT),
  time: createColumnWithType(PostgresColumnType.TIME),
  time_with_timezone: createColumnWithType(
    PostgresColumnType.TIME_WITH_TIMEZONE,
  ),
  timestamp: createColumnWithType(PostgresColumnType.TIMESTAMP),
  timestamp_with_timezone: createColumnWithType(
    PostgresColumnType.TIMESTAMP_WITH_TIMEZONE,
  ),
  tsquery: createColumnWithType(PostgresColumnType.TSQUERY),
  tsvector: createColumnWithType(PostgresColumnType.TSVECTOR),
  txid_snapshot: createColumnWithType(PostgresColumnType.TXID_SNAPSHOT),
  uuid: createColumnWithType(PostgresColumnType.UUID),
  xml: createColumnWithType(PostgresColumnType.XML),
};
