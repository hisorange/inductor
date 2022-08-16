import { ColumnKind, IBlueprint, IColumn } from '../../src';
import { ColumnType } from '../../src/blueprint/types/column-type.enum';
import { getPostgresEnumName } from '../../src/migration/util/get-enum-name';
import { ColumnTools } from '../../src/tools/column-tools';

type typeArguments = {
  length?: number;
  precision?: number;
  scale?: number;
  values?: string[];
  nativeName?: string;
};

export const createTestColumn = (
  typeName: ColumnType,
  typeArgs: typeArguments = {},
): IColumn => {
  if (ColumnTools.isTypeRequiresLength(typeName)) {
    typeArgs.length = typeArgs?.length ?? 8;
  } else if (ColumnTools.isTypeRequiresPrecision(typeName)) {
    typeArgs.precision = typeArgs?.precision ?? 8;
  } else if (ColumnTools.isTypeRequiresScale(typeName)) {
    typeArgs.scale = typeArgs?.scale ?? 0;
  } else if (typeName === ColumnType.ENUM) {
    if (!typeArgs.values) {
      typeArgs.values = ['a', 'b', 'c'];
    }

    typeArgs.nativeName =
      typeArgs?.nativeName ?? getPostgresEnumName(typeArgs.values);
  }

  if (typeName === ColumnType.NUMERIC) {
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
  if (ColumnTools.isSerialType(definition)) {
    definition.isPrimary = true;
  }

  return definition;
};

export const TestColumns: IBlueprint['columns'] = {
  bigint: createTestColumn(ColumnType.BIGINT),
  bigserial: createTestColumn(ColumnType.BIGSERIAL),
  bit: createTestColumn(ColumnType.BIT),
  bit_varying: createTestColumn(ColumnType.BIT_VARYING),
  boolean: createTestColumn(ColumnType.BOOLEAN),
  box: createTestColumn(ColumnType.BOX),
  bytea: createTestColumn(ColumnType.BYTEA),
  char: createTestColumn(ColumnType.CHAR),
  char_varying: createTestColumn(ColumnType.CHAR_VARYING),
  cidr: createTestColumn(ColumnType.CIDR),
  circle: createTestColumn(ColumnType.CIRCLE),
  date: createTestColumn(ColumnType.DATE),
  double: createTestColumn(ColumnType.DOUBLE),
  inet: createTestColumn(ColumnType.INET),
  integer: createTestColumn(ColumnType.INTEGER),
  interval: createTestColumn(ColumnType.INTERVAL),
  json: createTestColumn(ColumnType.JSON),
  jsonb: createTestColumn(ColumnType.JSONB),
  line: createTestColumn(ColumnType.LINE),
  lseg: createTestColumn(ColumnType.LSEG),
  macaddr: createTestColumn(ColumnType.MACADDR),
  macaddr8: createTestColumn(ColumnType.MACADDR8),
  money: createTestColumn(ColumnType.MONEY),
  numeric: createTestColumn(ColumnType.NUMERIC),
  path: createTestColumn(ColumnType.PATH),
  pg_lsn: createTestColumn(ColumnType.PG_LSN),
  pg_snapshot: createTestColumn(ColumnType.PG_SNAPSHOT),
  point: createTestColumn(ColumnType.POINT),
  polygon: createTestColumn(ColumnType.POLYGON),
  real: createTestColumn(ColumnType.REAL),
  smallint: createTestColumn(ColumnType.SMALLINT),
  smallserial: createTestColumn(ColumnType.SMALLSERIAL),
  serial: createTestColumn(ColumnType.SERIAL),
  text: createTestColumn(ColumnType.TEXT),
  time: createTestColumn(ColumnType.TIME),
  time_with_timezone: createTestColumn(ColumnType.TIME_WITH_TIMEZONE),
  timestamp: createTestColumn(ColumnType.TIMESTAMP),
  timestamp_with_timezone: createTestColumn(ColumnType.TIMESTAMP_WITH_TIMEZONE),
  tsquery: createTestColumn(ColumnType.TSQUERY),
  tsvector: createTestColumn(ColumnType.TSVECTOR),
  txid_snapshot: createTestColumn(ColumnType.TXID_SNAPSHOT),
  uuid: createTestColumn(ColumnType.UUID),
  xml: createTestColumn(ColumnType.XML),
};
