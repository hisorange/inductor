import { PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/interface/blueprint/postgres/postgres.index-type';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Composite Indexing', () => {
  const driver = createPostgresDriver();

  afterAll(() => driver.close());

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
          ...createPostgresColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        unique_column: {
          ...createPostgresColumnWithType(PostgresColumnType.TEXT),
          isUnique: true,
        },
        idx2_column: {
          ...createPostgresColumnWithType(PostgresColumnType.TEXT),
          isIndexed: PostgresIndexType.BTREE,
        },
        pair_column: {
          ...createPostgresColumnWithType(columnType),
        },
        [`${columnSafeType}_column`]: {
          ...createPostgresColumnWithType(columnType),
        },
      };

      // Remove blueprint if exists from a previous test
      await driver.migrator.dropBlueprint(blueprint);
      await driver.migrate([blueprint]);

      expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await driver.migrator.dropBlueprint(blueprint);
    },
  );
});
