import { createBlueprint } from '../../src/util/create-blueprint';
import { PostgresAllColumn } from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Create Table from Blueprint', () => {
  const driver = createPostgresDriver();
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.dropTable(name)));

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await driver.close();
  });

  test.each(testTables)(
    'should create the [%s] table from blueprint',
    async (tableName: string) => {
      const blueprint = createBlueprint(tableName);
      blueprint.columns = PostgresAllColumn;

      await driver.migrate([blueprint]);
      await driver.factCollector.gather();

      expect(driver.factCollector.isTableExists(tableName)).toBeTruthy();
    },
  );
});
