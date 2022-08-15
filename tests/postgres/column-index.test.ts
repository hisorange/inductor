import { PostgresColumnType } from '../../src';
import { PostgresIndexType } from '../../src/interface/blueprint/postgres/postgres.index-type';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresTestInstance } from './util/create-connection';

describe('[Postgres] Column Indexing', () => {
  const inductor = createPostgresTestInstance();

  afterAll(() => inductor.close());

  test.each([
    ['btree', PostgresColumnType.TEXT, PostgresIndexType.BTREE],
    ['hash', PostgresColumnType.TEXT, PostgresIndexType.HASH],
    ['gist', PostgresColumnType.POINT, PostgresIndexType.GIST],
    ['gin', PostgresColumnType.JSONB, PostgresIndexType.GIN],
    ['brin', PostgresColumnType.TIMESTAMP, PostgresIndexType.BRIN],
    ['brin', PostgresColumnType.DATE, PostgresIndexType.BRIN],
    ['spgist', PostgresColumnType.INET, PostgresIndexType.SPGIST],
  ])(
    'should create [%s] index on [%s] column',
    async (
      tableSuffix: string,
      columnType: PostgresColumnType,
      indexType: PostgresIndexType,
    ) => {
      const tableName = `column_index_${tableSuffix}`;

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        primary_column: {
          ...createPostgresColumnWithType(PostgresColumnType.SERIAL),
          isPrimary: true,
        },
        unique_column: {
          ...createPostgresColumnWithType(PostgresColumnType.TEXT),
          isUnique: true,
        },
        index_column: {
          ...createPostgresColumnWithType(columnType),
          isIndexed: indexType,
        },
      };

      // Remove blueprint if exists from a previous test
      await inductor.driver.migrator.dropTable(tableName);
      await inductor.migrate([blueprint]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(blueprint);

      // Cleanup
      await inductor.driver.migrator.dropTable(tableName);
    },
  );
});
