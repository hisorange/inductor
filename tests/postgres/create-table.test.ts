import { createBlueprint } from '../../src/util/create-blueprint';
import { PostgresAllColumn } from './util/all-column';
import { createPostgresTestInstance } from './util/create-connection';

describe('[Postgres] Create Table from Blueprint', () => {
  const inductor = createPostgresTestInstance();
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];
  const clearTables = () =>
    Promise.all(
      testTables.map(name => inductor.driver.migrator.dropTable(name)),
    );

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await inductor.close();
  });

  test.each(testTables)(
    'should create the [%s] table from blueprint',
    async (tableName: string) => {
      const blueprint = createBlueprint(tableName);
      blueprint.columns = PostgresAllColumn;

      await inductor.migrate([blueprint]);
      await inductor.driver.factCollector.gather();

      expect(
        inductor.driver.factCollector.isTableExists(tableName),
      ).toBeTruthy();
    },
  );
});
