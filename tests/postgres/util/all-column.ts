import { ColumnTools, IColumn } from '../../../src';
import { getPostgresEnumName } from '../../../src/driver/postgres/migrator/util/get-enum-name';
import { IBlueprint } from '../../../src/interface/blueprint/blueprint.interface';
import { ColumnKind } from '../../../src/interface/blueprint/column.kind';
import { PostgresColumnType } from '../../../src/interface/blueprint/postgres/postgres.column-type';

type typeArguments = {
  length?: number;
  precision?: number;
  scale?: number;
  values?: string[];
  nativeName?: string;
};

export const createPostgresColumnWithType = (
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

    typeArgs.nativeName =
      typeArgs?.nativeName ?? getPostgresEnumName(typeArgs.values);
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

export const PostgresAllColumn: IBlueprint['columns'] = {
  bigint: createPostgresColumnWithType(PostgresColumnType.BIGINT),
  bigserial: createPostgresColumnWithType(PostgresColumnType.BIGSERIAL),
  bit: createPostgresColumnWithType(PostgresColumnType.BIT),
  bit_varying: createPostgresColumnWithType(PostgresColumnType.BIT_VARYING),
  boolean: createPostgresColumnWithType(PostgresColumnType.BOOLEAN),
  box: createPostgresColumnWithType(PostgresColumnType.BOX),
  bytea: createPostgresColumnWithType(PostgresColumnType.BYTEA),
  char: createPostgresColumnWithType(PostgresColumnType.CHAR),
  char_varying: createPostgresColumnWithType(PostgresColumnType.CHAR_VARYING),
  cidr: createPostgresColumnWithType(PostgresColumnType.CIDR),
  circle: createPostgresColumnWithType(PostgresColumnType.CIRCLE),
  date: createPostgresColumnWithType(PostgresColumnType.DATE),
  double: createPostgresColumnWithType(PostgresColumnType.DOUBLE),
  inet: createPostgresColumnWithType(PostgresColumnType.INET),
  integer: createPostgresColumnWithType(PostgresColumnType.INTEGER),
  interval: createPostgresColumnWithType(PostgresColumnType.INTERVAL),
  json: createPostgresColumnWithType(PostgresColumnType.JSON),
  jsonb: createPostgresColumnWithType(PostgresColumnType.JSONB),
  line: createPostgresColumnWithType(PostgresColumnType.LINE),
  lseg: createPostgresColumnWithType(PostgresColumnType.LSEG),
  macaddr: createPostgresColumnWithType(PostgresColumnType.MACADDR),
  macaddr8: createPostgresColumnWithType(PostgresColumnType.MACADDR8),
  money: createPostgresColumnWithType(PostgresColumnType.MONEY),
  numeric: createPostgresColumnWithType(PostgresColumnType.NUMERIC),
  path: createPostgresColumnWithType(PostgresColumnType.PATH),
  pg_lsn: createPostgresColumnWithType(PostgresColumnType.PG_LSN),
  pg_snapshot: createPostgresColumnWithType(PostgresColumnType.PG_SNAPSHOT),
  point: createPostgresColumnWithType(PostgresColumnType.POINT),
  polygon: createPostgresColumnWithType(PostgresColumnType.POLYGON),
  real: createPostgresColumnWithType(PostgresColumnType.REAL),
  smallint: createPostgresColumnWithType(PostgresColumnType.SMALLINT),
  smallserial: createPostgresColumnWithType(PostgresColumnType.SMALLSERIAL),
  serial: createPostgresColumnWithType(PostgresColumnType.SERIAL),
  text: createPostgresColumnWithType(PostgresColumnType.TEXT),
  time: createPostgresColumnWithType(PostgresColumnType.TIME),
  time_with_timezone: createPostgresColumnWithType(
    PostgresColumnType.TIME_WITH_TIMEZONE,
  ),
  timestamp: createPostgresColumnWithType(PostgresColumnType.TIMESTAMP),
  timestamp_with_timezone: createPostgresColumnWithType(
    PostgresColumnType.TIMESTAMP_WITH_TIMEZONE,
  ),
  tsquery: createPostgresColumnWithType(PostgresColumnType.TSQUERY),
  tsvector: createPostgresColumnWithType(PostgresColumnType.TSVECTOR),
  txid_snapshot: createPostgresColumnWithType(PostgresColumnType.TXID_SNAPSHOT),
  uuid: createPostgresColumnWithType(PostgresColumnType.UUID),
  xml: createPostgresColumnWithType(PostgresColumnType.XML),
};
