import { PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/interface/blueprint/postgres/postgres.index-type';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createColumnWithType } from '../util/all-column';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] Composite Indexing', () => {
  const inductor = createTestInstance();

  afterAll(() => inductor.close());

  test.each([
    ['btree', PostgresColumnType.TEXT, PostgresIndexType.BTREE],
    ['gist', PostgresColumnType.POINT, PostgresIndexType.GIST],
    ['gin', PostgresColumnType.JSONB, PostgresIndexType.GIN],
    [
      'brin',
      PostgresColumnType.TIMESTAMP_WITH_TIMEZONE,
      PostgresIndexType.BRIN,
    ],
    ['brin', PostgresColumnType.DATE, PostgresIndexType.BRIN],
  ])(
    'should create [%s] composite index with [%s] column',
    async (
      tableSuffix: string,
      columnType: PostgresColumnType,
      indexType: PostgresIndexType,
    ) => {
      const columnSafeType = columnType.replace(/\s/g, '_');
      const tableName = `cpm_itest_${tableSuffix}_${columnSafeType.substring(
        0,
        10,
      )}`;
      const indexName = `${tableName}_${columnSafeType}_${indexType}`;

      const blueprint = createBlueprint(tableName);
      blueprint.indexes = {
        [indexName]: {
          type: indexType,
          columns: ['pair_column', `${columnSafeType}_column`],
        },
      };

      blueprint.columns = {
        primary_column: {
          ...createColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        unique_column: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isUnique: true,
        },
        idx2_column: {
          ...createColumnWithType(PostgresColumnType.TEXT),
          isIndexed: PostgresIndexType.BTREE,
        },
        pair_column: {
          ...createColumnWithType(columnType),
        },
        [`${columnSafeType}_column`]: {
          ...createColumnWithType(columnType),
        },
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropBlueprint(blueprint);
      await inductor.migrate([blueprint]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await inductor.driver.migrator.dropBlueprint(blueprint);
    },
  );
});
